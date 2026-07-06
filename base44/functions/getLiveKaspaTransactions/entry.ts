import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const API_BASE = 'https://api.kaspa.org';

function apiHeaders() {
  const key = Deno.env.get('KASPA_API_KEY');
  return key ? { 'X-API-KEY': key } : {};
}

// Coinbase / block-reward txs have a "virtual" input pointing at all-zero tx id
const COINBASE_TX_ID = /^0+$/;

function isCoinbase(tx) {
  const inputs = tx.inputs || [];
  if (inputs.length === 0) return true;
  const prev = inputs[0].previousOutpoint || {};
  return COINBASE_TX_ID.test(String(prev.transactionId || ''));
}

function extractTx(tx, blockTimestamp) {
  const outputs = tx.outputs || [];
  const totalOut = outputs.reduce((s, o) => s + (parseInt(o.amount || 0, 10) || 0), 0);
  if (totalOut <= 0) return null;

  // First non-empty output recipient
  const recipientOut = outputs.find(
    (o) => o.verboseData && o.verboseData.scriptPublicKeyAddress
  );
  const to = recipientOut?.verboseData?.scriptPublicKeyAddress || null;

  const txId =
    (tx.verboseData && tx.verboseData.transactionId) || tx.hash || null;
  if (!txId) return null;

  return {
    hash: txId,
    amount: totalOut / 1e8, // sompi -> KAS
    timestamp: blockTimestamp ? parseInt(blockTimestamp, 10) : Date.now(),
    from: null, // sender resolution requires /full-transactions?resolve_previous_outpoints
    to: to ? (to.startsWith('kaspa:') ? to : `kaspa:${to}`) : null,
  };
}

async function fetchBlockTxs(blockHash) {
  const res = await fetch(
    `${API_BASE}/blocks/${blockHash}?includeTransactions=true`,
    { headers: apiHeaders() }
  );
  if (!res.ok) return { txs: [], parents: [] };
  const block = await res.json();
  const blockTimestamp = block?.header?.timestamp || null;
  const txs = (block.transactions || [])
    .filter((tx) => !isCoinbase(tx))
    .map((tx) => extractTx(tx, blockTimestamp))
    .filter(Boolean);
  const parents = [];
  for (const p of block?.header?.parents || []) {
    for (const h of p.parentHashes || []) parents.push(h);
  }
  return { txs, parents };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Get current sink (most recent) block hash from the DAG
    const dagRes = await fetch(`${API_BASE}/info/blockdag`, {
      headers: apiHeaders(),
    });
    if (!dagRes.ok) {
      return Response.json(
        { error: `DAG fetch failed: ${dagRes.status}` },
        { status: 502 }
      );
    }
    const dag = await dagRes.json();
    const sinkHash = dag.sink || dag.sinkBlockHash;
    if (!sinkHash) {
      return Response.json({ error: 'No sink block found' }, { status: 500 });
    }

    // 2. BFS the DAG tips + parents (parallel) to find real, recent txs.
    //    Most Kaspa blocks are coinbase-only at 10 BPS, so scan aggressively.
    const collected = [];
    const seenTx = new Set();
    const visited = new Set();
    const tips = Array.isArray(dag.tipHashes) && dag.tipHashes.length > 0
      ? dag.tipHashes
      : [sinkHash];
    let frontier = tips.slice(0, 6);
    const MAX_TXS = 15;
    const MAX_BLOCKS = 48;

    for (let depth = 0; depth < 7 && collected.length < MAX_TXS && visited.size < MAX_BLOCKS; depth++) {
      const fresh = frontier.filter((h) => !visited.has(h)).slice(0, 8);
      if (fresh.length === 0) break;
      const results = await Promise.all(fresh.map((h) => fetchBlockTxs(h)));
      const next = [];
      for (const hash of fresh) visited.add(hash);
      for (const { txs, parents } of results) {
        for (const t of txs) {
          if (collected.length >= MAX_TXS) break;
          if (seenTx.has(t.hash)) continue;
          seenTx.add(t.hash);
          collected.push(t);
        }
        next.push(...parents);
      }
      frontier = next;
    }

    return Response.json({ transactions: collected });
  } catch (error) {
    console.error('Error fetching live Kaspa transactions:', error);
    return Response.json(
      { error: error.message, transactions: [] },
      { status: 500 }
    );
  }
});