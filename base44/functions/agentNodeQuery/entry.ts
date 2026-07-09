// AGENT live Kaspa node queries — status, address scan (balance + latest txs), tx details
const API = 'https://api.kaspa.org';

const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Kaspa API ${res.status}`);
  return res.json();
};

const sompiToKAS = (v) => Number(v || 0) / 1e8;

Deno.serve(async (req) => {
  try {
    const { action, address, txId } = await req.json();

    if (action === 'status') {
      const [network, dag] = await Promise.all([
        get('/info/network').catch(() => ({})),
        get('/info/blockdag').catch(() => ({})),
      ]);
      return Response.json({
        success: true,
        network: network.networkName || dag.networkName || 'kaspa-mainnet',
        blockCount: Number(dag.blockCount || 0),
        headerCount: Number(dag.headerCount || 0),
        virtualDaaScore: Number(dag.virtualDaaScore || 0),
        difficulty: Number(dag.difficulty || 0),
        tipHashes: (dag.tipHashes || []).slice(0, 3),
      });
    }

    if (action === 'scan') {
      const addr = (address || '').trim().startsWith('kaspa:') ? address.trim() : `kaspa:${(address || '').trim()}`;
      const [balData, txs] = await Promise.all([
        get(`/addresses/${encodeURIComponent(addr)}/balance`).catch(() => ({ balance: 0 })),
        get(`/addresses/${encodeURIComponent(addr)}/full-transactions?limit=10&resolve_previous_outpoints=light`).catch(() => []),
      ]);

      const list = (Array.isArray(txs) ? txs : []).map((tx) => {
        const received = (tx.outputs || []).filter(o => o.script_public_key_address === addr)
          .reduce((s, o) => s + Number(o.amount || 0), 0);
        const sent = (tx.inputs || []).filter(i => i.previous_outpoint_address === addr)
          .reduce((s, i) => s + Number(i.previous_outpoint_amount || 0), 0);
        const net = received - sent;
        return {
          txId: tx.transaction_id,
          time: tx.block_time || null,
          accepted: !!tx.is_accepted,
          direction: net >= 0 ? 'in' : 'out',
          amountKAS: Math.abs(sompiToKAS(net)),
        };
      });

      return Response.json({
        success: true,
        address: addr,
        balanceKAS: sompiToKAS(balData.balance),
        txs: list,
      });
    }

    if (action === 'tx') {
      const id = (txId || '').trim();
      const tx = await get(`/transactions/${encodeURIComponent(id)}?resolve_previous_outpoints=light`);
      const inputs = (tx.inputs || []).map(i => ({
        address: i.previous_outpoint_address || 'unknown',
        amountKAS: sompiToKAS(i.previous_outpoint_amount),
      }));
      const outputs = (tx.outputs || []).map(o => ({
        address: o.script_public_key_address || 'unknown',
        amountKAS: sompiToKAS(o.amount),
      }));
      const totalIn = inputs.reduce((s, i) => s + i.amountKAS, 0);
      const totalOut = outputs.reduce((s, o) => s + o.amountKAS, 0);
      return Response.json({
        success: true,
        txId: tx.transaction_id || id,
        blockTime: tx.block_time || null,
        accepted: !!tx.is_accepted,
        blockBlueScore: tx.accepting_block_blue_score || null,
        mass: tx.mass || null,
        inputs, outputs,
        totalInKAS: totalIn,
        totalOutKAS: totalOut,
        feeKAS: totalIn > 0 ? Math.max(0, totalIn - totalOut) : 0,
      });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});