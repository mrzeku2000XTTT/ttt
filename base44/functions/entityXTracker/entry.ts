import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ENTITY_X = 'kaspa:qpz2vgvlxhmyhmt22h538pjzmvvd52nuut80y5zulgpvyerlskvvwm7n4uk5a';
const API = 'https://api.kaspa.org';

function classifyTx(tx, address) {
  let received = 0;
  let sent = 0;
  for (const out of tx.outputs || []) {
    if (out.script_public_key_address === address) received += out.amount || 0;
  }
  for (const inp of tx.inputs || []) {
    if (inp.previous_outpoint_address === address) sent += inp.previous_outpoint_amount || 0;
  }
  const net = received - sent;
  return {
    txId: tx.transaction_id,
    time: tx.block_time,
    direction: net >= 0 ? 'in' : 'out',
    amountKas: Math.abs(net) / 1e8,
  };
}

async function fetchTxsSince(address, cutoffMs) {
  const all = [];
  let before = 0;
  for (let page = 0; page < 6; page++) {
    const url = `${API}/addresses/${address}/full-transactions-page?limit=500&resolve_previous_outpoints=light${before ? `&before=${before}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const txs = await res.json();
    if (!Array.isArray(txs) || txs.length === 0) break;
    for (const tx of txs) {
      if (tx.block_time && tx.block_time < cutoffMs) return all;
      all.push(tx);
    }
    before = txs[txs.length - 1].block_time;
    if (txs.length < 500) break;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, days } = await req.json().catch(() => ({}));

    if (action === 'report') {
      const period = days === 30 ? 30 : 7;
      const cutoff = Date.now() - period * 24 * 60 * 60 * 1000;
      const txs = await fetchTxsSince(ENTITY_X, cutoff);
      let inflow = 0, outflow = 0, inCount = 0, outCount = 0, largestIn = 0, largestOut = 0;
      for (const tx of txs) {
        const c = classifyTx(tx, ENTITY_X);
        if (c.direction === 'in') { inflow += c.amountKas; inCount++; if (c.amountKas > largestIn) largestIn = c.amountKas; }
        else { outflow += c.amountKas; outCount++; if (c.amountKas > largestOut) largestOut = c.amountKas; }
      }

      const balRes = await fetch(`${API}/addresses/${ENTITY_X}/balance`);
      const balData = balRes.ok ? await balRes.json() : {};
      const balanceKas = (balData.balance || 0) / 1e8;

      const stats = {
        periodDays: period,
        txCount: txs.length,
        inflowKas: Math.round(inflow * 100) / 100,
        outflowKas: Math.round(outflow * 100) / 100,
        netKas: Math.round((inflow - outflow) * 100) / 100,
        inCount, outCount,
        largestInKas: Math.round(largestIn * 100) / 100,
        largestOutKas: Math.round(largestOut * 100) / 100,
        balanceKas: Math.round(balanceKas * 100) / 100,
      };

      const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Entity X analyst for a Kaspa whale-tracking dashboard. Entity X is the Kaspa wallet ${ENTITY_X}, believed to be among the largest KAS holders.

On-chain data computed directly from the Kaspa node API (api.kaspa.org) for the last ${period} days:
- Current balance: ${stats.balanceKas.toLocaleString()} KAS
- Transactions: ${stats.txCount} (${stats.inCount} incoming, ${stats.outCount} outgoing)
- Total inflow: ${stats.inflowKas.toLocaleString()} KAS
- Total outflow: ${stats.outflowKas.toLocaleString()} KAS
- Net flow: ${stats.netKas.toLocaleString()} KAS
- Largest single inflow: ${stats.largestInKas.toLocaleString()} KAS | Largest single outflow: ${stats.largestOutKas.toLocaleString()} KAS

FACT-CHECK this against multiple public sources (kas.fyi address page, explorer.kaspa.org, kaspa rich list data, any recent whale-watch news). Note whether the balance and activity are consistent with what public explorers report, and whether this address appears on the Kaspa rich list (and roughly what rank).

Then write a short motivational whale report in markdown (max ~250 words) with sections:
## Entity X — ${period}-Day Report
### Verified Numbers (bullet list of the stats above)
### Fact Check (what the other sources confirm or contradict, 2-3 bullets)
### The Takeaway (2 sentences of motivation for everyday Kaspa builders — accumulation discipline, long-term conviction — no financial advice)`,
        add_context_from_internet: true,
      });

      return Response.json({ success: true, stats, summary });
    }

    // Default: overview — balance + recent transactions
    const [balRes, txRes] = await Promise.all([
      fetch(`${API}/addresses/${ENTITY_X}/balance`),
      fetch(`${API}/addresses/${ENTITY_X}/full-transactions?limit=15&resolve_previous_outpoints=light`),
    ]);
    const balData = balRes.ok ? await balRes.json() : {};
    const txs = txRes.ok ? await txRes.json() : [];

    let priceUsd = null;
    try {
      const p = await fetch(`${API}/info/price`);
      if (p.ok) priceUsd = (await p.json()).price;
    } catch { /* price optional */ }

    const balanceKas = (balData.balance || 0) / 1e8;
    const recent = (Array.isArray(txs) ? txs : [])
      .map((tx) => classifyTx(tx, ENTITY_X))
      .filter((t) => t.amountKas > 0)
      .slice(0, 10);

    return Response.json({
      success: true,
      address: ENTITY_X,
      balanceKas: Math.round(balanceKas * 100) / 100,
      balanceUsd: priceUsd ? Math.round(balanceKas * priceUsd) : null,
      priceUsd,
      recent,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});