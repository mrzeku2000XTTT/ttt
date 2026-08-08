import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates a new, standalone, open-source GitHub repo containing JUST the TTT
// Builder (copied from the app's source repo) plus a README, LICENSE and a
// standalone package.json. Uses the builder's authorized shared GitHub
// connection (repo scope). The repo is created under the authenticated user's
// account so they own it.

const BUILDER_DIR = "src/components/tttbuilder/";
const BUILDER_PAGE = "src/pages/TTTBuilder.jsx";
const EXTRA = [
  "public/TTT_BUILDER_WALLET.md",
  "public/TTT_BUILDER_ARTHUUN.md",
  "public/ARHTUUN.md",
];

function b64(s) { return btoa(unescape(encodeURIComponent(s))); }

const README = `# TTT Builder

Open-source AI app builder for Kaspa. Describe what you want and TTT Builder generates a complete, production-quality multi-file app with the Kaspa wallet protocol built in.

## Bring your own keys (no integration credits)

TTT Builder runs on YOUR models. Open the model selector -> "+ Add open model" and add any OpenAI-compatible provider:

- **OpenRouter** (recommended - free + paid models, browser-friendly CORS): key from openrouter.ai/keys, model e.g. \`deepseek/deepseek-chat-v3.1:free\`
- **DeepSeek**: key from platform.deepseek.com, model \`deepseek-chat\`
- **Ollama** (local, no key): run \`ollama serve\`, model e.g. \`llama3.1\`
- **Custom**: any OpenAI-compatible endpoint (LM Studio, vLLM, llama.cpp server)

Keys are stored **only in your browser** (localStorage) and sent directly to the provider. They never touch any server.

## What's in this repo

This is the TTT Builder core:

- \`src/pages/TTTBuilder.jsx\` - the builder studio (chat + preview + dashboard)
- \`src/components/tttbuilder/\` - orchestrator, local LLM layer, model selector, wallet kit, project files, and all builder components
- \`public/TTT_BUILDER_WALLET.md\`, \`public/TTT_BUILDER_ARTHUUN.md\`, \`public/ARHTUUN.md\` - architecture & protocol docs

## Remaining platform dependencies

The builder core is open-source. A few features still depend on the Base44 platform (the original host). To run fully standalone, replace:

- **Live preview sandbox** (\`E2BLivePanel\` -> \`e2bSandbox\`): bring your own E2B API key, or use the in-browser static preview only.
- **Image generation** (\`imageGen.js\` -> \`GenerateImage\`): plug your own image API, or disable image markers.
- **GitHub push** (\`publishToGitHub\` / \`pushAppToUserGitHubOAuth\`): use a personal access token directly.
- **URL clone & file analysis** (\`uiClonerScrape\`, \`analyzeUploadedFile\`): optional features.
- **Auth / admin gate**: strip the \`user.role === 'admin'\` check in \`TTTBuilder.jsx\` for a local build.

## License

MIT - see LICENSE.
`;

const LICENSE = `MIT License

Copyright (c) 2026 TTT-Build

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const PACKAGE_JSON = `{
  "name": "ttt-builder",
  "version": "1.0.0",
  "private": true,
  "description": "TTT Builder - open-source AI app builder for Kaspa. Bring your own keys.",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.0",
    "framer-motion": "^11.16.4",
    "lucide-react": "^0.475.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}
`;

const GITIGNORE = `node_modules
dist
.env
.env.local
.DS_Store
*.log
`;

async function gh(token, url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TTT-Builder-Repo-Generator",
      ...(opts.headers || {}),
    },
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getConnection("github"));
    } catch (e) {
      return Response.json({ error: "GitHub connector not connected. Connect it first. " + (e?.message || "") }, { status: 401 });
      }
      const token = accessToken;

      let body = {};
  try { body = await req.json(); } catch {}
  const sourceRepo = (body.sourceRepo || "").trim();
  const targetRepo = (body.targetRepo || "ttt-builder").trim();
  const isPrivate = !!body.isPrivate;
  if (!sourceRepo.includes("/") || sourceRepo.split("/").length !== 2) {
    return Response.json({ error: "sourceRepo must be owner/repo" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(targetRepo)) {
    return Response.json({ error: "Invalid target repo name" }, { status: 400 });
  }

  const H = { "Content-Type": "application/json" };

  // 1. Source repo default branch + recursive tree
  const srcInfoRes = await gh(token, `https://api.github.com/repos/${sourceRepo}`);
  if (!srcInfoRes.ok) {
    const t = await srcInfoRes.text().catch(() => "");
    return Response.json({ error: `Source repo not found or inaccessible: ${sourceRepo} (${srcInfoRes.status}). ${t.slice(0, 200)}` }, { status: 404 });
  }
  const srcInfo = await srcInfoRes.json();
  if (!srcInfo || !srcInfo.default_branch) {
    return Response.json({ error: `Source repo has no default branch: ${sourceRepo}` }, { status: 404 });
  }
  const srcBranch = srcInfo.default_branch;
  const treeRes = await gh(token, `https://api.github.com/repos/${sourceRepo}/git/trees/${srcBranch}?recursive=1`);
  if (!treeRes.ok) {
    const t = await treeRes.text().catch(() => "");
    return Response.json({ error: `Could not read source tree (${treeRes.status}). ${t.slice(0, 200)}` }, { status: 502 });
  }
  const tree = await treeRes.json();
  if (!tree || !tree.tree) return Response.json({ error: "Could not read source tree" }, { status: 502 });
  const paths = tree.tree
    .filter((t) => t.type === "blob" && (t.path.startsWith(BUILDER_DIR) || t.path === BUILDER_PAGE || EXTRA.includes(t.path)))
    .map((t) => t.path);

  if (!paths.length) return Response.json({ error: "No TTT Builder files found in the source repo." }, { status: 404 });

  // 2. Resolve the authenticated user (target owner)
  const meRes = await gh(token, `https://api.github.com/user`);
  const me = await meRes.json();
  const targetOwner = me.login;
  const fullTarget = `${targetOwner}/${targetRepo}`;

  // 3. Create the target repo (422 = already exists, fine)
  await gh(token, `https://api.github.com/user/repos`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      name: targetRepo,
      private: isPrivate,
      description: "TTT Builder - open-source AI app builder for Kaspa. Bring your own keys.",
    }),
  });

  // 4. Copy each builder file: GET content (base64) from source -> PUT to target
  let copied = 0;
  for (const p of paths) {
    const getRes = await gh(token, `https://api.github.com/repos/${sourceRepo}/contents/${p}?ref=${srcBranch}`);
    if (!getRes.ok) continue;
    const file = await getRes.json();
    const content = file.content; // already base64
    // If the file already exists in target, fetch its sha so we can update it
    let sha = null;
    const ex = await gh(token, `https://api.github.com/repos/${fullTarget}/contents/${p}`);
    if (ex.ok) { const j = await ex.json(); sha = j.sha; }
    const putRes = await gh(token, `https://api.github.com/repos/${fullTarget}/contents/${p}`, {
      method: "PUT", headers: H,
      body: JSON.stringify({ message: `Add ${p}`, content, ...(sha ? { sha } : {}) }),
    });
    if (putRes.ok) copied++;
  }

  // 5. Authored files (README, LICENSE, package.json, .gitignore)
  const authored = [
    { path: "README.md", content: b64(README) },
    { path: "LICENSE", content: b64(LICENSE) },
    { path: "package.json", content: b64(PACKAGE_JSON) },
    { path: ".gitignore", content: b64(GITIGNORE) },
  ];
  let authoredCount = 0;
  for (const f of authored) {
    let sha = null;
    const ex = await gh(token, `https://api.github.com/repos/${fullTarget}/contents/${f.path}`);
    if (ex.ok) { const j = await ex.json(); sha = j.sha; }
    const putRes = await gh(token, `https://api.github.com/repos/${fullTarget}/contents/${f.path}`, {
      method: "PUT", headers: H,
      body: JSON.stringify({ message: `Add ${f.path}`, content: f.content, ...(sha ? { sha } : {}) }),
    });
    if (putRes.ok) authoredCount++;
  }

    return Response.json({
      success: true,
      repo: fullTarget,
      url: `https://github.com/${fullTarget}`,
      cloneUrl: `https://github.com/${fullTarget}.git`,
      copiedFiles: copied,
      authoredFiles: authoredCount,
    });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) || "server error" }, { status: 500 });
  }
}