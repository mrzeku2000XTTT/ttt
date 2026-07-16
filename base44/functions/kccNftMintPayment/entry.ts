import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// KCC NFT mint payment detector — checks the agent wallet for the tier payment.
// Admin-only for now.
const AGENT_WALLET = "kaspa:qpkn4aczvuqpmhvzv2lunjudfnda6wlk258w90yptjxv6v2q7dlkq2cm8e58e";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'KCC NFT minting is admin-only for now' }, { status: 403 });
    }

    const { kas_amount, buyer_address, started_at } = await req.json();
    const amount = Number(kas_amount);
    if (!amount || amount <= 0) return Response.json({ error: 'kas_amount required' }, { status: 400 });

    const startedTime = started_at ? new Date(started_at).getTime() : Date.now() - 30 * 60 * 1000;
    const expectedSompi = Math.round(amount * 100000000);
    const tolerance = expectedSompi * 0.01;

    const res = await fetch(
      `https://api.kaspa.org/addresses/${AGENT_WALLET}/full-transactions?limit=20&resolve_previous_outpoints=light`,
      { headers: { 'Authorization': `Bearer ${Deno.env.get('KASPA_API_KEY') || ''}` } }
    );
    if (!res.ok) throw new Error(`Kaspa API error: ${res.status}`);
    const transactions = await res.json();
    const txList = Array.isArray(transactions) ? transactions : (transactions.transactions || []);

    for (const tx of txList) {
      const txTime = tx.block_time ? Number(tx.block_time) : Date.now();
      // block_time is in milliseconds on api.kaspa.org
      if (txTime < startedTime - 60000) continue;

      // Amount must match one of the outputs to the agent wallet
      const matchingOutput = (tx.outputs || []).find(o =>
        o.script_public_key_address === AGENT_WALLET &&
        Math.abs(parseInt(o.amount) - expectedSompi) <= tolerance
      );
      if (!matchingOutput) continue;

      // If a buyer address is known, prefer verifying the sender
      if (buyer_address) {
        const fromBuyer = (tx.inputs || []).some(i =>
          i.previous_outpoint_address === buyer_address ||
          i.previous_outpoint_resolved?.script_public_key_address === buyer_address
        );
        if (!fromBuyer) continue;
      }

      return Response.json({
        detected: true,
        tx_id: tx.transaction_id,
        amount_kas: parseInt(matchingOutput.amount) / 100000000,
        block_time: txTime,
      });
    }

    return Response.json({ detected: false, checked: txList.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});