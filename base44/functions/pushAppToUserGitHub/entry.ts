import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { pushFilesToGitHub } from '../../shared/githubPush.ts';

// Push the builder's current files to the user's OWN GitHub repo using a
// Personal Access Token they supply per-request. The token is never stored
// server-side — it is used only for this call and discarded.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { token, repo, branch, files = [], commitMessage, isPrivate = false } = await req.json();
    const result = await pushFilesToGitHub(token, { repo, branch, files, commitMessage, isPrivate });
    return Response.json(result, { status: result.success ? 200 : (result.status || 502) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}