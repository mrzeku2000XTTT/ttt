import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

/**
 * evolveGetAgentBalance — retrieves an AI agent's TN10 balance.
 *
 * The database balance is a CACHE ONLY. The blockchain is AUTHORITATIVE.
 * This function queries the Kaspa TN10 API for the agent's address balance.
 *
 * In mock mode, returns the cached balance from EvolveAgentWallet.
 * In TN10 mode, queries the Kaspa RPC and updates the cache.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { experimentId, agentId } = body;

    if (!experimentId || !agentId) {
      return Response.json({ error: "MISSING_PARAMS" }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Find the agent's wallet.
    const wallets = await sr.entities.EvolveAgentWallet.filter({
      experiment_id: experimentId,
      agent_id: agentId,
    }, "-created_date", 1);

    if (!wallets.length) {
      return Response.json({ ok: false, reason: "NO_WALLET", cachedSompi: 0 });
    }

    const wallet = wallets[0];

    // Try to query the Kaspa API for the real balance.
    const apiKey = secrets.get("KASPA_API_KEY") || secrets.get("FORBOLE_KASPA_API_KEY");
    if (apiKey && wallet.address) {
      try {
        const apiUrl = `https://api.kaspa.org/v1/addresses/${wallet.address}/balance`;
        const resp = await fetch(apiUrl, {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          const balanceSompi = Number(data?.balance || 0);
          // Update the cache.
          await sr.entities.EvolveAgentWallet.update(wallet.id, {
            last_known_balance_sompi: balanceSompi,
            last_balance_check: new Date().toISOString(),
          });
          return Response.json({
            ok: true,
            balanceSompi,
            source: "tn10",
            address: wallet.address,
          });
        }
      } catch (e) {
        // Fall through to cached balance.
      }
    }

    // Mock mode — return cached balance.
    return Response.json({
      ok: true,
      balanceSompi: wallet.last_known_balance_sompi || 0,
      source: "cache",
      address: wallet.address,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}