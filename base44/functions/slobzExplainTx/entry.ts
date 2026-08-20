import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Slobz Tx Tracker — smart Kaspa transaction + covenant reader.
// Decodes real covenant redeem scripts (CLTV, multisig, sentinel branching)
// and synthesises a plain-English explanation via the LLM.

const API_BASE = 'https://api.kaspa.org';
const BPS = 10; // Kaspa mainnet ~10 blocks/sec

function sompiToKas(s) { return Number(s || 0) / 1e8; }
function hexToBytes(hex) {
  const out = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
  return out;
}
function toHex(bytes) { return bytes.map((b) => b.toString(16).padStart(2, '0')).join(''); }
function leNum(bytes) {
  let n = 0n, m = 1n;
  for (const b of bytes) { n += BigInt(b) * m; m <<= 8n; }
  return n;
}

// Parse all data pushes from a script hex (used to pull the redeem script out of a P2SH sig script).
function parsePushes(hex) {
  const bytes = hexToBytes(hex);
  const pushes = [];
  let i = 0;
  while (i < bytes.length) {
    const op = bytes[i];
    if (op === 0x00) { i++; continue; }
    if (op >= 0x01 && op <= 0x4b) { pushes.push({ data: toHex(bytes.slice(i + 1, i + 1 + op)), num: op <= 4 ? Number(leNum(bytes.slice(i + 1, i + 1 + op))) : null }); i += 1 + op; continue; }
    if (op === 0x4c) { const n = bytes[i + 1]; pushes.push({ data: toHex(bytes.slice(i + 2, i + 2 + n)) }); i += 2 + n; continue; }
    if (op === 0x4d) { const n = bytes[i + 1] + (bytes[i + 2] << 8); pushes.push({ data: toHex(bytes.slice(i + 3, i + 3 + n)) }); i += 3 + n; continue; }
    if (op === 0x4e) { i += 5; continue; }
    i++;
  }
  return pushes;
}

function lastPushHex(hex) {
  const p = parsePushes(hex);
  if (!p.length) return null;
  return p[p.length - 1].data;
}

// Decode a redeem script into a covenant descriptor.
function decodeRedeemScript(hex, fundingBlueScore) {
  if (!hex) return null;
  const bytes = hexToBytes(hex);
  const ops = [];
  let i = 0;
  while (i < bytes.length) {
    const op = bytes[i];
    if (op === 0x00) { ops.push({ op: 'OP_0' }); i++; }
    else if (op >= 0x01 && op <= 0x4b) { ops.push({ op: 'PUSH', len: op, data: toHex(bytes.slice(i + 1, i + 1 + op)), num: op <= 4 ? Number(leNum(bytes.slice(i + 1, i + 1 + op))) : null }); i += 1 + op; }
    else if (op === 0x4c) { const n = bytes[i + 1]; ops.push({ op: 'PUSH', data: toHex(bytes.slice(i + 2, i + 2 + n)), num: n <= 4 ? Number(leNum(bytes.slice(i + 2, i + 2 + n))) : null }); i += 2 + n; }
    else if (op === 0x4d) { const n = bytes[i + 1] + (bytes[i + 2] << 8); ops.push({ op: 'PUSH', data: toHex(bytes.slice(i + 3, i + 3 + n)) }); i += 3 + n; }
    else if (op >= 0x4f && op <= 0x60) { ops.push({ op: 'OP_NUM', value: op - 0x4f }); i++; }
    else if (op === 0x63) { ops.push({ op: 'OP_IF' }); i++; }
    else if (op === 0x64) { ops.push({ op: 'OP_NOTIF' }); i++; }
    else if (op === 0x67) { ops.push({ op: 'OP_ELSE' }); i++; }
    else if (op === 0x68) { ops.push({ op: 'OP_ENDIF' }); i++; }
    else if (op === 0x6a) { ops.push({ op: 'OP_RETURN' }); i++; }
    else if (op === 0xac) { ops.push({ op: 'OP_CHECKSIG' }); i++; }
    else if (op === 0xba) { ops.push({ op: 'OP_CHECKSIGVERIFY' }); i++; }
    else if (op === 0xae) { ops.push({ op: 'OP_CHECKMULTISIG' }); i++; }
    else if (op === 0xb1) { ops.push({ op: 'OP_CLTV' }); i++; }
    else if (op === 0xbb) { ops.push({ op: 'OP_CSV' }); i++; }
    else if (op === 0xa9) { ops.push({ op: 'OP_HASH160' }); i++; }
    else if (op === 0x87) { ops.push({ op: 'OP_EQUAL' }); i++; }
    else { ops.push({ op: 'OP_' + op.toString(16) }); i++; }
  }

  const cltvIdx = ops.findIndex((o) => o.op === 'OP_CLTV');
  let cltv = { present: cltvIdx >= 0, value: null, type: null };
  if (cltv.present) {
    const prev = ops[cltvIdx - 1];
    let v = null;
    if (prev && prev.op === 'OP_NUM') v = prev.value;
    else if (prev && prev.op === 'PUSH' && prev.num != null) v = prev.num;
    if (v != null) {
      cltv.value = v;
      cltv.type = v > 1.6e9 ? 'timestamp' : 'blue-score';
    }
  }

  const checkSigCount = ops.filter((o) => o.op === 'OP_CHECKSIG' || o.op === 'OP_CHECKSIGVERIFY').length;
  const hasMultisig = ops.some((o) => o.op === 'OP_CHECKMULTISIG');
  const nums = ops.filter((o) => o.op === 'OP_NUM').map((o) => o.value);
  const multisig = hasMultisig ? { m: nums[0] != null ? nums[0] : null, n: nums[nums.length - 1] != null ? nums[nums.length - 1] : null } : { m: null, n: null };
  const pubkeyCount = ops.filter((o) => o.op === 'PUSH' && (o.len === 32 || o.len === 33)).length;
  const hasBranching = ops.some((o) => o.op === 'OP_IF' || o.op === 'OP_NOTIF');

  let estimatedType = 'custom P2SH smart contract';
  if (hasMultisig && cltv.present) estimatedType = 'time-locked multisig escrow';
  else if (hasMultisig) estimatedType = (multisig.m || '?') + '-of-' + (multisig.n || pubkeyCount || '?') + ' multisig escrow';
  else if (cltv.present && hasBranching) estimatedType = 'sentinel / branching covenant (signature path + CLTV timeout)';
  else if (cltv.present && checkSigCount === 1 && !hasBranching) estimatedType = 'time-lock / vesting covenant';
  else if (cltv.present) estimatedType = 'time-locked contract';

  let timelockHuman = 'none';
  if (cltv.present && cltv.value != null) {
    if (cltv.type === 'timestamp') {
      timelockHuman = 'until ' + new Date(cltv.value * 1000).toUTCString();
    } else if (fundingBlueScore != null) {
      const diff = cltv.value - Number(fundingBlueScore);
      if (diff <= 0) timelockHuman = 'already unlocked';
      else {
        const sec = diff / BPS;
        const days = sec / 86400;
        timelockHuman = days >= 1 ? ('~' + days.toFixed(1) + ' days (' + diff.toLocaleString() + ' blue score)') : ('~' + (sec / 3600).toFixed(1) + ' hours');
      }
    } else {
      timelockHuman = 'until blue score ' + cltv.value.toLocaleString();
    }
  }

  // Reject signatures / non-script data misread as a redeem script: a real covenant
  // script must contain at least one meaningful opcode.
  const meaningful = ops.some((o) => ['OP_CHECKSIG', 'OP_CHECKSIGVERIFY', 'OP_CHECKMULTISIG', 'OP_CLTV', 'OP_CSV', 'OP_IF', 'OP_NOTIF', 'OP_ELSE', 'OP_ENDIF', 'OP_RETURN', 'OP_EQUAL', 'OP_EQUALVERIFY', 'OP_HASH160'].includes(o.op));
  if (!meaningful) return null;

  return {
    redeemScriptHex: hex.slice(0, 96),
    cltv, checkSigCount, hasMultisig, multisig, pubkeyCount, hasBranching,
    estimatedType, timelockHuman,
  };
}

async function fetchTx(id, headers) {
  let res;
  for (let i = 0; i < 3; i++) {
    try { res = await fetch(API_BASE + '/transactions/' + id + '?resolve_previous_outpoints=light', { headers }); }
    catch (e) { if (i < 2) { await new Promise((s) => setTimeout(s, 800)); continue; } throw e; }
    if (res.ok || res.status === 404) break;
    await new Promise((s) => setTimeout(s, res.status === 429 ? 2000 : 600));
  }
  return res;
}

// Find the spending tx of a given (txId, outputIndex) by scanning the address history.
async function findSpendSigScript(address, txId, outIndex, headers) {
  try {
    const r = await fetch(API_BASE + '/addresses/' + address + '/full-transactions?limit=50', { headers });
    if (!r.ok) return null;
    const txs = await r.json();
    for (const t of txs) {
      for (const inp of (t.inputs || [])) {
        const prevHash = inp.previous_outpoint_hash || (inp.previous_outpoint ? inp.previous_outpoint.transaction_id : null);
        const prevIdx = inp.previous_outpoint_index != null ? inp.previous_outpoint_index : (inp.previous_outpoint ? inp.previous_outpoint.index : null);
        if (prevHash === txId && Number(prevIdx) === outIndex && inp.signature_script) {
          return inp.signature_script;
        }
      }
    }
  } catch (e) {}
  return null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try { await base44.auth.me(); } catch (e) { /* anon ok */ }

  const body = await req.json().catch(() => ({}));
  let txId = (body.txId || '').trim().toLowerCase().replace(/^0x/, '').replace(/^https?:\/\/[^/]+\/(transactions|txs)\//, '');
  if (!/^[a-f0-9]{64}$/.test(txId)) return Response.json({ error: 'That is not a valid 64-hex Kaspa transaction ID.' });

  const headers = { 'X-API-KEY': Deno.env.get('KASPA_API_KEY') || '' };
  const res = await fetchTx(txId, headers);
  if (!res || !res.ok) return Response.json({ error: res && res.status === 404 ? 'Transaction not found.' : 'Kaspa API unavailable.' });
  const tx = await res.json();

  const inputs = tx.inputs || [];
  const outputs = (tx.outputs || []).map((o) => ({
    address: o.script_public_key_address || (o.script_public_key ? o.script_public_key.address : null),
    amount: sompiToKas(o.amount),
    script_type: o.script_public_key_type || null,
    script_hex: o.script_public_key ? o.script_public_key.script : null,
  }));
  const isCoinbase = inputs.length === 0;
  const fundingBlueScore = tx.accepting_block_blue_score != null ? tx.accepting_block_blue_score : null;
  const inputTotal = inputs.reduce((s, i) => s + sompiToKas(i.previous_outpoint_amount || (i.previous_outpoint ? i.previous_outpoint.amount : 0)), 0);
  const outputTotal = outputs.reduce((s, o) => s + o.amount, 0);
  const fee = isCoinbase ? 0 : Math.max(0, inputTotal - outputTotal);

  // 1) Covenant inputs already spending a P2SH — redeem script is in the sig script.
  let covenant = null;
  for (const inp of inputs) {
    const sig = inp.signature_script || '';
    if (sig && sig.length > 80) {
      const redeemHex = lastPushHex(sig);
      if (redeemHex && redeemHex.length >= 20) {
        const decoded = decodeRedeemScript(redeemHex, fundingBlueScore);
        if (decoded) {
          covenant = Object.assign({ role: 'spending' }, decoded, {
            sourceAddress: inp.previous_outpoint_address || (inp.previous_outpoint && inp.previous_outpoint.script_public_key ? inp.previous_outpoint.script_public_key.address : null),
            amount: sompiToKas(inp.previous_outpoint_amount || (inp.previous_outpoint ? inp.previous_outpoint.amount : 0)),
          });
          break;
        }
      }
    }
  }

  // 2) Covenant funding — output is P2SH (scripthash). Try to find the spend tx to reveal terms.
  if (!covenant) {
    for (let idx = 0; idx < outputs.length; idx++) {
      const o = outputs[idx];
      if (o.script_type === 'scripthash' || (o.script_hex && o.script_hex.length === 64)) {
        const scriptHash = o.script_hex ? o.script_hex.slice(0, 64) : null;
        let decoded = null;
        if (o.address) {
          const spendSig = await findSpendSigScript(o.address, txId, idx, headers);
          if (spendSig) {
            const rh = lastPushHex(spendSig);
            if (rh) decoded = decodeRedeemScript(rh, fundingBlueScore);
          }
        }
        covenant = {
          role: decoded ? 'funding' : 'funding-terms-unrevealed',
          estimatedType: decoded ? decoded.estimatedType : 'P2SH covenant / smart contract (terms hidden until spent)',
          timelockHuman: decoded ? decoded.timelockHuman : 'unknown - redeem script not yet revealed on-chain',
          cltv: decoded ? decoded.cltv : { present: false, value: null, type: null },
          hasMultisig: decoded ? decoded.hasMultisig : false,
          multisig: decoded ? decoded.multisig : { m: null, n: null },
          pubkeyCount: decoded ? decoded.pubkeyCount : 0,
          hasBranching: decoded ? decoded.hasBranching : false,
          checkSigCount: decoded ? decoded.checkSigCount : 0,
          redeemScriptHash: scriptHash,
          address: o.address,
          amount: o.amount,
        };
        break;
      }
    }
  }

  // Compact facts for the LLM (no hallucination - it only rephrases these).
  const covenantFacts = covenant ? (function () {
    const m = covenant.hasMultisig ? (covenant.multisig.m || '?') : null;
    const n = covenant.hasMultisig ? (covenant.multisig.n || covenant.pubkeyCount || '?') : null;
    return {
      role: covenant.role,
      type: covenant.estimatedType,
      timelock: covenant.timelockHuman,
      cltvValue: covenant.cltv ? covenant.cltv.value : null,
      cltvType: covenant.cltv ? covenant.cltv.type : null,
      multisig: covenant.hasMultisig ? (String(m) + '-of-' + String(n)) : null,
      participants: covenant.hasMultisig ? (String(n) + ' parties') : (covenant.checkSigCount ? (covenant.checkSigCount + ' signer(s)') : null),
      branching: covenant.hasBranching,
      amount: covenant.amount,
      redeemScriptHash: covenant.redeemScriptHash,
    };
  })() : null;

  const facts = {
    txId: txId,
    isCoinbase: isCoinbase,
    confirmed: tx.is_accepted === true || !!tx.accepting_block_hash,
    blueScore: fundingBlueScore,
    block_time: tx.block_time || null,
    inputCount: inputs.length,
    outputCount: outputs.length,
    inputTotalKas: +inputTotal.toFixed(8),
    outputTotalKas: +outputTotal.toFixed(8),
    feeKas: +fee.toFixed(8),
    inputs: inputs.map((i) => ({ address: i.previous_outpoint_address || (i.previous_outpoint && i.previous_outpoint.script_public_key ? i.previous_outpoint.script_public_key.address : null), amount: +sompiToKas(i.previous_outpoint_amount || (i.previous_outpoint ? i.previous_outpoint.amount : 0)).toFixed(8) })),
    outputs: outputs.map((o) => ({ address: o.address, amount: +o.amount.toFixed(8), script_type: o.script_type })),
    covenant: covenantFacts,
  };

  const llm = await base44.integrations.Core.InvokeLLM({
    prompt: 'You are Slobz, the smartest Kaspa transaction reader. Explain this Kaspa L1 transaction in plain, friendly English for a non-technical user. If it involves a COVENANT (P2SH / scripthash / redeem script), explain WHAT KIND of covenant it is, the TIME-LOCK (how long), how many PEOPLE/keys (escrow M-of-N), the AMOUNT locked, and WHO can spend it under which conditions. Use ONLY the facts in the JSON below. If a value is null or unknown, say "unknown" plainly - do NOT invent numbers, addresses, or durations. Keep the story to 3-5 sentences. Facts JSON:\n' + JSON.stringify(facts),
    response_json_schema: {
      type: 'object',
      properties: {
        headline: { type: 'string', description: 'One-line plain-English summary' },
        story: { type: 'string', description: '3-5 sentence plain-English explanation' },
        bullets: { type: 'array', items: { type: 'string' }, description: 'Key facts as short bullets' },
        covenant: {
          type: 'object',
          properties: {
            isCovenant: { type: 'boolean' },
            kind: { type: 'string', description: 'e.g. time-lock, multisig escrow, sentinel x402, vesting, custom, none' },
            friendlyType: { type: 'string' },
            timelock: { type: 'string' },
            participants: { type: 'string' },
            amount: { type: 'string' },
            whoCanSpend: { type: 'string' },
            details: { type: 'string' },
          },
          required: ['isCovenant'],
        },
      },
      required: ['headline', 'story', 'covenant'],
    },
  });

  return Response.json({ txId: txId, tx: tx, covenant: covenant, plain: llm });
});