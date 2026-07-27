import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const API_BASE = 'https://api.kaspa.org';

function sompiToKas(sompi) {
  if (sompi == null) return 0;
  return Number(sompi) / 1e8;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public endpoint — no login required so anyone can view transactions
    try { await base44.auth.me(); } catch { /* anonymous access allowed */ }

    const { txId } = await req.json();
    if (!txId) return Response.json({ error: 'Transaction ID required' }, { status: 400 });

    const kaspaApi = Deno.env.get('KASPA_API_KEY');
    const headers = { 'X-API-KEY': kaspaApi || '' };

    // Fetch the full transaction with resolved previous outpoints (sender addresses)
    const res = await fetch(
      `${API_BASE}/transactions/${txId}?resolve_previous_outpoints=light`,
      { headers }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('Kaspa tx detail error:', res.status, body);
      return Response.json(
        { error: `API returned ${res.status}` },
        { status: 502 }
      );
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});