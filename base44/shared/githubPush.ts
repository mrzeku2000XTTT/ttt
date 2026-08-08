// Shared GitHub push logic used by both the PAT-based and OAuth-based
// "push to your GitHub" backend functions. Pure GitHub API calls — no
// Base44 SDK, no Response objects. Callers wrap the returned object.

const GH = "https://api.github.com";

const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "TTT-Builder",
});

// UTF-8 safe base64
const b64 = (s) => btoa(unescape(encodeURIComponent(s || "")));

const err = (status, msg) => ({ success: false, status, error: msg });

// Push files to a GitHub repo. Returns { success: true, ... } or { success: false, status, error }.
export async function pushFilesToGitHub(token, opts) {
  const { repo, branch, files = [], commitMessage, isPrivate = false } = opts || {};
  if (!token || !repo || !Array.isArray(files) || !files.length) {
    return err(400, "Missing token, repo, or files");
  }

  // 1. Validate token + learn the GitHub user's login
  const meRes = await fetch(`${GH}/user`, { headers: ghHeaders(token) });
  if (!meRes.ok) {
    const t = await meRes.text();
    return err(401, `GitHub rejected your token (${meRes.status}). ${t.slice(0, 180)}`);
  }
  const ghUser = await meRes.json();

  // 2. Resolve owner/repo — "owner/name" or just "name" (under the token user)
  let owner, repoName;
  if (repo.includes("/")) {
    [owner, repoName] = repo.split("/");
  } else {
    owner = ghUser.login;
    repoName = repo;
  }
  repoName = repoName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  if (!repoName) return err(400, "Invalid repo name");

  // 3. Ensure the repo exists (create under the token user if missing)
  let repoRes = await fetch(`${GH}/repos/${owner}/${repoName}`, { headers: ghHeaders(token) });
  if (repoRes.status === 404) {
    const createRes = await fetch(`${GH}/user/repos`, {
      method: "POST",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ name: repoName, private: !!isPrivate, auto_init: true }),
    });
    if (!createRes.ok) {
      const t = await createRes.text();
      return err(502, `Could not create repo (${createRes.status}). ${t.slice(0, 180)}`);
    }
    repoRes = await fetch(`${GH}/repos/${owner}/${repoName}`, { headers: ghHeaders(token) });
  }
  if (!repoRes.ok) {
    const t = await repoRes.text();
    return err(502, `Could not access repo "${owner}/${repoName}" (${repoRes.status}). ${t.slice(0, 180)}`);
  }
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";
  const targetBranch = (branch || "").trim() || defaultBranch;

  // 4. Resolve target branch ref (create it off the default branch if missing)
  let parentSha = null;
  let baseTreeSha = null;
  const refRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/refs/heads/${targetBranch}`, { headers: ghHeaders(token) });
  if (refRes.ok) {
    parentSha = (await refRes.json()).object.sha;
  } else if (targetBranch !== defaultBranch) {
    const defRefRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`, { headers: ghHeaders(token) });
    if (!defRefRes.ok) return err(502, `Default branch "${defaultBranch}" not found.`);
    parentSha = (await defRefRes.json()).object.sha;
    const createBranchRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/refs`, {
      method: "POST",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha: parentSha }),
    });
    if (!createBranchRes.ok) {
      const t = await createBranchRes.text();
      return err(502, `Could not create branch "${targetBranch}". ${t.slice(0, 180)}`);
    }
  } else {
    const t = await refRes.text();
    return err(502, `Could not read branch "${targetBranch}". ${t.slice(0, 180)}`);
  }

  if (parentSha) {
    const commitRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/commits/${parentSha}`, { headers: ghHeaders(token) });
    if (commitRes.ok) baseTreeSha = (await commitRes.json()).tree.sha;
  }

  // 5. Create a blob for every file
  const treeEntries = [];
  for (const f of files) {
    const path = String(f.path || "").replace(/^\.?\//, "");
    if (!path) continue;
    const blobRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/blobs`, {
      method: "POST",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ content: b64(f.content), encoding: "base64" }),
    });
    if (!blobRes.ok) {
      const t = await blobRes.text();
      return err(502, `Failed to upload "${path}". ${t.slice(0, 180)}`);
    }
    treeEntries.push({ path, mode: "100644", type: "blob", sha: (await blobRes.json()).sha });
  }
  if (!treeEntries.length) return err(400, "No valid files to push.");

  // 6. Build a tree on top of the current one
  const treeBody = { tree: treeEntries };
  if (baseTreeSha) treeBody.base_tree = baseTreeSha;
  const treeRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/trees`, {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(treeBody),
  });
  if (!treeRes.ok) {
    const t = await treeRes.text();
    return err(502, `Failed to create git tree. ${t.slice(0, 180)}`);
  }
  const tree = await treeRes.json();

  // 7. Create the commit
  const commitRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/commits`, {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: commitMessage || "Initial commit from TTT Builder",
      tree: tree.sha,
      parents: parentSha ? [parentSha] : [],
    }),
  });
  if (!commitRes.ok) {
    const t = await commitRes.text();
    return err(502, `Failed to create commit. ${t.slice(0, 180)}`);
  }
  const newCommit = await commitRes.json();

  // 8. Move the branch ref forward
  const updateRes = await fetch(`${GH}/repos/${owner}/${repoName}/git/refs/heads/${targetBranch}`, {
    method: "PATCH",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });
  if (!updateRes.ok) {
    const t = await updateRes.text();
    return err(502, `Commit created but branch update failed. ${t.slice(0, 180)}`);
  }

  return {
    success: true,
    owner,
    repo: repoName,
    branch: targetBranch,
    repoUrl: `https://github.com/${owner}/${repoName}`,
    commitUrl: `https://github.com/${owner}/${repoName}/commit/${newCommit.sha}`,
    filesPushed: treeEntries.length,
    commitSha: newCommit.sha,
  };
}

// Lightweight: validate a token and return the GitHub user's login.
export async function getGitHubUser(token) {
  if (!token) return { connected: false };
  const meRes = await fetch(`${GH}/user`, { headers: ghHeaders(token) });
  if (!meRes.ok) return { connected: false };
  const u = await meRes.json();
  return { connected: true, login: u.login, avatar: u.avatar_url, name: u.name };
}