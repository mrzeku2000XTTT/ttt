import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const API_BASE = 'https://api.kaspa.org';

function sompiToKas(sompi) {
  if (sompi == null) return 0;
  return Number(sompi) / 1e8;
}

function isHex64(s) {
  return /^[0-9a-fA-F]{64}$/.test(String(s || ''));
}

function isKaspaAddress(s) {
  const v = String(s || '').replace(/^kaspa:/, '');
  return /^[a-z0-9]{34,62}$/i.test(v);
}

function detectTags(tx) {
  const tags = [];
  const sn = String(tx.subnetwork_id || '').toLowerCase();
  const isNative = sn === '0000000000000000000000000000000000000000' || sn === '';
  const isIgra = sn.startsWith('97b1');

  let isKrc20 = false;
  let isKrc721 = false;
  const payload = String(tx.payload || '');
  if (payload) {
    const lp = payload.toLowerCase();
    isKrc20 = lp.includes('6b72632d3230');
    isKrc721 = lp.includes('6b72632d373231');
  }

  if (isIgra) tags.push('Igra L2');
  else if (isKrc20) tags.push('KRC-20');
  else if (isKrc721) tags.push('KRC-721');
  else if (isNative) tags.push('Native');

  if (tx.covenant_id) tags.push('Covenant++');
  return tags;
}

function parseTransaction(tx) {
  return {
    type: 'transaction',
    transaction_id: tx.transaction_id,
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
    tags: detectTags(tx),
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
    })),
    outputs: (tx.outputs || []).map((out) => ({
      index: out.index ?? 0,
      amount: sompiToKas(out.amount),
      amount_sompi: out.amount,
      script_public_key: out.script_public_key || null,
      script_public_key_address: out.script_public_key_address ||
        out.script_public_key?.address || null,
      script_public_key_type: out.script_public_key_type || null,
    })),
  };
}

// Simple fetch with one retry on transient errors — NO AbortSignal.timeout
// (AbortSignal.timeout crashes the Deno runtime, causing 502s)
async function fetchKaspa(url, headers) {
  let res;
  for (let i = 0; i < 2; i++) {
    try {
      res = await fetch(url, { headers });
    } catch (e) {
      if (i === 0) { await new Promise((s) => setTimeout(s, 400)); continue; }
      throw e;
    }
    if (res.ok || res.status === 404) return res;
    if (i === 0) { await new Promise((s) => setTimeout(s, 400)); continue; }
  }
  return res;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public endpoint — anonymous access allowed
    try { await base44.auth.me(); } catch { /* guest */ }

    const { query } = await req.json();
    if (!query) return Response.json({ error: 'Query required' });

    const q = String(query).trim();
    const kaspaApi = Deno.env.get('KASPA_API_KEY');
    const headers = { 'X-API-KEY': kaspaApi || '' };

    // 1. Address search
    if (isKaspaAddress(q)) {
      const full = q.startsWith('kaspa:') ? q : `kaspa:${q}`;

      const balRes = await fetchKaspa(`${API_BASE}/addresses/${full}/balance`, headers);
      let balance = null;
      if (balRes && balRes.ok) {
        const b = await balRes.json();
        balance = {
          address: full,
          balance: sompiToKas(b.balance),
          totalReceived: sompiToKas(b.total_received ?? b.totalReceived),
          totalSent: sompiToKas(b.total_sent ?? b.totalSent),
          txCount: b.transaction_count ?? b.transactionCount ?? 0,
        };
      }

      const txRes = await fetchKaspa(
        `${API_BASE}/addresses/${full}/full-transactions?limit=20&resolve_previous_outpoints=light`,
        headers
      );
      let transactions = [];
      if (txRes && txRes.ok) {
        const data = await txRes.json();
        const list = Array.isArray(data) ? data : data.transactions || [];
        transactions = list.map((tx) => {
          const myOuts = (tx.outputs || []).filter(
            (o) => o.script_public_key_address === full ||
                   o.script_public_key?.address === full
          );
          const myIns = (tx.inputs || []).filter(
            (i) => i.previous_outpoint_address === full ||
                   i.previous_outpoint?.script_public_key?.address === full
          );
          const isReceived = myOuts.length > 0 && myIns.length === 0;
          const amount = isReceived
            ? myOuts.reduce((s, o) => s + (o.amount || 0), 0) / 1e8
            : myIns.reduce((s, i) => s + (i.previous_outpoint_amount || i.previous_outpoint?.amount || 0), 0) / 1e8;
          return {
            transaction_id: tx.transaction_id,
            amount,
            type: isReceived ? 'receive' : 'send',
            timestamp: tx.block_time || null,
            tags: detectTags(tx),
            is_accepted: tx.is_accepted ?? null,
          };
        });
      }

      if (!balance && transactions.length === 0) {
        return Response.json({ error: 'Address not found or Kaspa API unavailable. Please try again.' });
      }

      return Response.json({ type: 'address', address: full, balance, transactions });
    }

    // 2. 64-char hex — transaction or block hash
    if (isHex64(q)) {
      const txRes = await fetchKaspa(
        `${API_BASE}/transactions/${q}?resolve_previous_outpoints=light`,
        headers
      );
      if (txRes && txRes.ok) {
        const tx = await txRes.json();
        return Response.json({ type: 'transaction', ...parseTransaction(tx) });
      }

      const blkRes = await fetchKaspa(`${API_BASE}/blocks/${q}`, headers);
      if (blkRes && blkRes.ok) {
        const blk = await blkRes.json();
        const blkData = Array.isArray(blk) ? blk[0] : blk;
        const blockTxs = (blkData.verboseData?.transactionIds || []).slice(0, 20);
        return Response.json({
          type: 'block',
          hash: blkData.header?.hash || q,
          blueScore: blkData.verboseData?.blueScore ?? null,
          timestamp: blkData.header?.timestamp ?? blkData.verboseData?.timestamp ?? null,
          isChainBlock: blkData.verboseData?.isChainBlock ?? null,
          transactionCount: (blkData.verboseData?.transactionIds || []).length,
          transactions: blockTxs,
        });
      }

      const txStatus = txRes?.status ?? 0;
      const blkStatus = blkRes?.status ?? 0;
      if (txStatus === 404 && blkStatus === 404) {
        return Response.json({ error: 'Not found as transaction or block.' });
      }
      return Response.json({ error: 'Kaspa API temporarily unavailable. Please try again.' });
    }

    return Response.json({ error: 'Unrecognized query. Enter a Kaspa address or 64-char transaction/block hash.' });
  } catch (error) {
    console.error('searchKaspaExplorer error:', error);
    return Response.json({ error: 'Search failed. Please try again.' });
  }
});