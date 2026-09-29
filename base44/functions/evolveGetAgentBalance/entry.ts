import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { tn10Blocked } from '../../shared/evolveTn10Safety.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { experimentId, agentId } = await req.json();
    if (!experimentId || !agentId) return Response.json({ error: 'MISSING_PARAMS' }, { status: 400 });
    const wallets = await base44.entities.EvolveAgentWallet.filter({ experiment_id: experimentId, agent_id: agentId }, '-created_date', 1);
    const wallet = wallets[0];
    if (!wallet) return Response.json({ ok: false, reason: 'NO_WALLET' }, { status: 404 });
    // The old mainnet REST lookup and authoritative-cache fallback are removed.
    return Response.json(tn10Blocked({
      address: wallet.address, confirmedSompi: null, source: 'unavailable',
      lastKnown: { label: 'LAST KNOWN — UNVERIFIED', sompi: wallet.last_known_balance_sompi ?? null, observedAt: wallet.last_balance_check || null },
    }), { status: 503 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}