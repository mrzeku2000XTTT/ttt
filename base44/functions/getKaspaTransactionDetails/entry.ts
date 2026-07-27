import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const API_BASE = 'https://api.kaspa.org';

function sompiToKas(sompi) {
  if (sompi == null) return 0;
  return Number(sompi) / 1e8;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* anonymous access allowed */ }

    const { txId } = await req.json();
    if (!txId) return Response.json({ error: 'Transaction ID required' });

    const kaspaApi = Deno.env.get('KASPA_API_KEY');
    const headers = { 'X-API-KEY': kaspaApi || '' };

    // Fetch with retry — NO AbortSignal.timeout (crashes Deno).
    // 429 = rate limited: wait 2s before retry.
    let res;
    for (let i = 0; i < 3; i++) {
      try {
        res = await fetch(`${API_BASE}/transactions/${txId}?resolve_previous_outpoints=light`, { headers });
      } catch (e) {
        if (i < 2) { await new Promise((s) => setTimeout(s, 800)); continue; }
        throw e;
      }
      if (res.ok || res.status === 404) break;
      const delay = res.status === 429 ? 2000 : 600;
      if (i < 2) { await new Promise((s) => setTimeout(s, delay)); }
    }

    if (!res || !res.ok) {
      if (res?.status === 404) return Response.json({ error: 'Transaction not found.' });
      return Response.json({ error: 'Kaspa API temporarily unavailable. Please try again.' });
    }

    const tx = await res.json();

    return Response.json({
      transaction_id: tx.transaction_id || txId,
      hash: tx.hash || null,
      subnetwork_id: tx.subnetwork_id || null,
      version: tx.version ?? null,
      mass: tx.mass ? Number(tx.mass) : null,
      payload: tx.payload || null,
      block_hash: tx.block_hash || [],
      block_time: tx.block_time || null,
      is_accepted: tx.is_accepted ?? null,
      accepting_block_hash: tx.accepting_block_hash || null,
      accepting_block_blue_score: tx.accepting_block_blue_score ?? null,
      accepting_block_time: tx.accepting_block_time || null,
      inputs: (tx.inputs || []).map((inp) => ({
        index: inp.index ?? 0,
        previous_outpoint_hash: inp.previous_outpoint_hash || null,
        previous_outpoint_index: inp.previous_outpoint_index ?? null,
        previous_outpoint_address:
          inp.previous_outpoint_address ||
          inp.previous_outpoint?.script_public_key?.address ||
          null,
        previous_outpoint_amount: inp.previous_outpoint_amount ||
          inp.previous_outpoint?.amount || null,
        signature_script: inp.signature_script || null,
        sig_op_count: inp.sig_op_count ?? null,
        compute_budget: inp.compute_budget ?? null,
      })),
      outputs: (tx.outputs || []).map((out) => ({
        index: out.index ?? 0,
        amount: sompiToKas(out.amount),
        amount_sompi: out.amount,
        script_public_key_address: out.script_public_key_address ||
          out.script_public_key?.address || null,
        script_public_key_type: out.script_public_key_type || null,
        script_public_key: out.script_public_key || null,
      })),
    });
  } catch (error) {
    console.error('getKaspaTransactionDetails error:', error);
    return Response.json({ error: 'Failed to load transaction. Please try again.' });
  }
});