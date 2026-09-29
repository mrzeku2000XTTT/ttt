import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { tn10Blocked } from '../../shared/evolveTn10Safety.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { experimentId, agents } = await req.json();
    if (!experimentId || !Array.isArray(agents) || !agents.length) return Response.json({ error: 'MISSING_PARAMS' }, { status: 400 });
    // No fabricated addresses, funding TXIDs, wallet records, or local credits.
    return Response.json(tn10Blocked({ funded: 0 }), { status: 503 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}