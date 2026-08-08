import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getGitHubUser } from '../../shared/githubPush.ts';

// Connection check for the per-user GitHub OAuth connector.
// Returns { connected: true, login, avatar } when the app user has connected
// their GitHub, or { connected: false } otherwise. Used by the Push modal to
// decide whether to show "Connect GitHub" or the connected user + Push button.
const CONNECTOR_ID = "6a76c96c1625886d0f70a701";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ connected: false, error: "Unauthorized" }, { status: 401 });

    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID));
    } catch {
      return Response.json({ connected: false });
    }
    if (!accessToken) return Response.json({ connected: false });

    const gh = await getGitHubUser(accessToken);
    return Response.json(gh);
  } catch (error) {
    return Response.json({ connected: false, error: error.message });
  }
}