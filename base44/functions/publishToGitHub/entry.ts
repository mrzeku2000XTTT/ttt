import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { html, siteName, repo } = await req.json();
    if (!html || !siteName || !repo) {
      return Response.json({ error: 'Missing html, siteName, or repo' }, { status: 400 });
    }

    // repo format: "owner/repo-name"
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return Response.json({ error: 'repo must be in format owner/repo-name' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    const filePath = `sites/${siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/index.html`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

    // Check if file already exists (need SHA for updates)
    let sha = null;
    const existsRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    });
    if (existsRes.ok) {
      const existing = await existsRes.json();
      sha = existing.sha;
    }

    // Base64 encode the HTML
    const encoded = btoa(unescape(encodeURIComponent(html)));

    const body = {
      message: sha
        ? `TTT Builder: update ${siteName}`
        : `TTT Builder: publish ${siteName}`,
      content: encoded,
      ...(sha ? { sha } : {}),
    };

    const pushRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!pushRes.ok) {
      const err = await pushRes.text();
      return Response.json({ error: err }, { status: pushRes.status });
    }

    const result = await pushRes.json();
    const htmlUrl = result.content?.html_url || `https://github.com/${owner}/${repoName}/blob/main/${filePath}`;
    const pagesUrl = `https://${owner}.github.io/${repoName}/sites/${siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/`;

    return Response.json({ success: true, htmlUrl, pagesUrl, filePath });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});