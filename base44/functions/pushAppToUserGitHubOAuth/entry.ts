import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { pushFilesToGitHub } from '../../shared/githubPush.ts';

// Per-user OAuth variant: the app user connects their own GitHub account via
// the workspace connector (id below). Their OAuth access token is fetched
// server-side per request — no PAT is ever asked of them.
const CONNECTOR_ID = "6a76c96c1625886d0f70a701";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID));
    } catch {
      return Response.json({ error: "GitHub not connected. Connect your account first." }, { status: 401 });
    }
    if (!accessToken) {
      return Response.json({ error: "GitHub not connected. Connect your account first." }, { status: 401 });
    }

    const { repo, branch, files = [], commitMessage, isPrivate = false } = await req.json();
    const result = await pushFilesToGitHub(accessToken, { repo, branch, files, commitMessage, isPrivate });
    return Response.json(result, { status: result.success ? 200 : (result.status || 502) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}