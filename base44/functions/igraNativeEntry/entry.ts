// NATIVE Igra Entry bridge (KAS L1 -> iKAS L2) — replicates what KAT Bridge does.
// Protocol source: github.com/argonmining/igra-kas-bridge (MIT, verified docs).
//
// Entry tx: send KAS to Igra's Entry address with a 33-byte payload
//   [0x92][20-byte L2 addr][8-byte amount sompi LE][4-byte nonce BE]
// on the KIP-21 lane (subnetworkId 97b10000...0, tx version 1, computeBudget 10
// per input) and MINE the nonce until the Kaspa txid starts with "97b1".
// Igra's Viaduct detects it and IgReth mints iKAS to the L2 address. Min 10 KAS.
//
// Actions:
//   verify  { tx_id }                      — recompute the txid of a real on-chain
//                                            entry tx to prove our serializer is
//                                            byte-exact before risking funds
//   entry   { amount_kas, l2_address, dry_run } — build+mine(+sign+submit) from the
//                                            desk's KAS wallet
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { blake3 } from 'npm:@noble/hashes@1.4.0/blake3';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';

const KASPA_API = 'https://api.kaspa.org';
const ENTRY_ADDRESS = 'kaspa:ppvnxxzm0rr37zpnwux2f2ntvfpr4uqdpm7zsvsztg3en92r7gs0wkmr72q9n';
const TXID_PREFIX = '97b1';
const SUBNETWORK_ID = '97b1000000000000000000000000000000000000';
const MIN_ENTRY_KAS = 10;
const ID_KEY = new TextEncoder().encode('TransactionID');
const SIGHASH_KEY = new TextEncoder().encode('TransactionSigningHash');
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const REV = new Uint8Array(123).fill(100);
BECH32_CHARSET.split('').forEach((c, i) => { REV[c.charCodeAt(0)] = i; });

function hexToBytes(hex) {
  const clean = String(hex).startsWith('0x') ? String(hex).slice(2) : String(hex);
  const b = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) b[i / 2] = parseInt(clean.substr(i, 2), 16);
  return b;
}
function bytesToHex(b) { return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(''); }
function concatBytes(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const r = new Uint8Array(total); let o = 0;
  for (const a of arrays) { r.set(a, o); o += a.length; }
  return r;
}
function u8(v) { return new Uint8Array([v & 0xff]); }
function u16LE(v) { return new Uint8Array([v & 0xff, (v >> 8) & 0xff]); }
function u32LE(v) { const b = new Uint8Array(4); for (let i = 0; i < 4; i++) b[i] = (v >> (i * 8)) & 0xff; return b; }
function u64LE(v) { const n = BigInt(v); const b = new Uint8Array(8); for (let i = 0; i < 8; i++) b[i] = Number((n >> BigInt(i * 8)) & 0xffn); return b; }

function conv5to8(payload) {
  const out = new Array(Math.floor(payload.length * 5 / 8)).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 5) | c; bits += 5;
    while (bits >= 8) { bits -= 8; out[idx++] = (buff >> bits) & 0xff; buff &= (1 << bits) - 1; }
  }
  return out;
}
function decodeKaspaAddress(addr) {
  const dataPart = addr.substring(addr.indexOf(':') + 1);
  const u5 = [];
  for (const ch of dataPart) u5.push(REV[ch.charCodeAt(0)]);
  return new Uint8Array(conv5to8(u5.slice(0, u5.length - 8)));
}
function scriptFromAddress(address) {
  const payload = decodeKaspaAddress(address);
  const version = payload[0];
  const hash = payload.slice(1);
  if (version === 0) { // P2PK schnorr
    return concatBytes(u8(0x20), hash, u8(0xac));
  }
  if (version === 8) { // P2SH: OP_BLAKE2B <32B hash> OP_EQUAL
    return concatBytes(u8(0xaa), u8(0x20), hash, u8(0x87));
  }
  throw new Error(`Unsupported address version ${version}`);
}

function buildEntryPayload(l2Address, amountSompi, nonce) {
  const addr = hexToBytes(l2Address);
  if (addr.length !== 20) throw new Error('L2 address must be 20 bytes');
  const p = new Uint8Array(33);
  p[0] = 0x92;
  p.set(addr, 1);
  p.set(u64LE(amountSompi), 21);
  p[29] = (nonce >>> 24) & 0xff; p[30] = (nonce >>> 16) & 0xff; p[31] = (nonce >>> 8) & 0xff; p[32] = nonce & 0xff;
  return p;
}

// V1 TxID per rusty-kaspa hashing/tx.rs (post-Crescendo/Toccata):
//   txid = blake3_keyed("TransactionV1Id", payload_digest || rest_digest)
//   payload_digest = blake3_keyed("PayloadDigest", raw payload bytes)
//   rest_digest    = blake3_keyed("TransactionRest", tx serialized with payload,
//                    signature scripts, and mass commitment all EXCLUDED)
// blake3 keys are the domain string zero-padded to 32 bytes.
function b3Key(name) { const k = new Uint8Array(32); k.set(new TextEncoder().encode(name)); return k; }
const KEY_PAYLOAD = b3Key('PayloadDigest');
const KEY_REST = b3Key('TransactionRest');
const KEY_V1ID = b3Key('TransactionV1Id');

// Rest preimage: everything except payload / sig scripts / mass. Constant while
// mining (nonce only lives in the payload), so compute it once.
function restDigest(tx) {
  const parts = [u16LE(tx.version), u64LE(BigInt(tx.inputs.length))];
  for (const inp of tx.inputs) {
    parts.push(hexToBytes(inp.prevTxId), u32LE(inp.prevIndex));
    parts.push(u64LE(0n)); // empty signature script (var bytes)
    parts.push(u64LE(inp.sequence ?? 0n));
  }
  parts.push(u64LE(BigInt(tx.outputs.length)));
  for (const out of tx.outputs) {
    parts.push(u64LE(out.amount), u16LE(out.scriptVersion ?? 0), u64LE(BigInt(out.scriptPubKey.length)), out.scriptPubKey);
    parts.push(u8(0)); // v1: covenant presence bool (none)
  }
  parts.push(u64LE(tx.locktime ?? 0n));
  parts.push(hexToBytes(tx.subnetworkId));
  parts.push(u64LE(tx.gas ?? 0n));
  parts.push(u64LE(0n)); // payload EXCLUDED -> empty var bytes
  return blake3(concatBytes(...parts), { dkLen: 32, key: KEY_REST });
}

function txIdV1(restDig, payload) {
  const payloadDig = blake3(payload, { dkLen: 32, key: KEY_PAYLOAD });
  return bytesToHex(blake3(concatBytes(payloadDig, restDig), { dkLen: 32, key: KEY_V1ID }));
}

function computeTxId(tx) { return txIdV1(restDigest(tx), tx.payload); }

// V1 schnorr sighash per rusty-kaspa hashing/sighash.rs: for version >= 1 the
// sig-op-counts hash and per-input sig_op_count byte are OMITTED, and each
// output hashes a covenant-presence bool after the script public key.
function keyed(data) { return blake2b(data, { dkLen: 32, key: SIGHASH_KEY }); }
function computeSigHash(tx, inputIndex) {
  const inp = tx.inputs[inputIndex];
  const prevouts = keyed(concatBytes(...tx.inputs.flatMap(i => [hexToBytes(i.prevTxId), u32LE(i.prevIndex)])));
  const seqs = keyed(concatBytes(...tx.inputs.map(i => u64LE(i.sequence ?? 0n))));
  const outs = keyed(concatBytes(...tx.outputs.flatMap(o => [u64LE(o.amount), u16LE(o.scriptVersion ?? 0), u64LE(BigInt(o.scriptPubKey.length)), o.scriptPubKey, u8(0)])));
  const payloadHash = keyed(concatBytes(u64LE(BigInt(tx.payload.length)), tx.payload));
  return keyed(concatBytes(
    u16LE(tx.version), prevouts, seqs,
    hexToBytes(inp.prevTxId), u32LE(inp.prevIndex),
    u16LE(inp.utxoScriptVersion ?? 0), u64LE(BigInt(inp.utxoScriptPubKey.length)), inp.utxoScriptPubKey,
    u64LE(inp.utxoAmount), u64LE(inp.sequence ?? 0n),
    outs, u64LE(tx.locktime ?? 0n), hexToBytes(tx.subnetworkId), u64LE(tx.gas ?? 0n),
    payloadHash, u8(0x01)
  ));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, tx_id, amount_kas, l2_address, dry_run, id_variant } = await req.json();

    // ---- VERIFY: prove our txid serializer is byte-exact against a real entry tx ----
    if (action === 'verify') {
      let target = tx_id;
      if (!target) {
        // auto-discover a recent 97b1 entry tx at the Entry address
        const res = await fetch(`${KASPA_API}/addresses/${ENTRY_ADDRESS}/full-transactions-page?limit=20&resolve_previous_outpoints=no`);
        if (!res.ok) return Response.json({ error: `Entry address tx fetch failed: ${res.status}` }, { status: 500 });
        const txs = await res.json();
        const hit = (txs || []).find(t => (t.transaction_id || '').startsWith(TXID_PREFIX));
        if (!hit) return Response.json({ error: 'No 97b1 entry tx found in recent history', sample_ids: (txs || []).slice(0, 5).map(t => t.transaction_id) }, { status: 404 });
        target = hit.transaction_id;
      }
      const res = await fetch(`${KASPA_API}/transactions/${target}?inputs=true&outputs=true&resolve_previous_outpoints=no`);
      if (!res.ok) return Response.json({ error: `tx fetch failed: ${res.status}` }, { status: 500 });
      const t = await res.json();
      const tx = {
        version: t.version ?? 1,
        inputs: (t.inputs || []).map(i => ({
          prevTxId: i.previous_outpoint_hash, prevIndex: Number(i.previous_outpoint_index),
          sequence: 0n, computeBudget: 10,
        })),
        outputs: (t.outputs || []).map(o => ({
          amount: BigInt(o.amount), scriptVersion: 0, scriptPubKey: hexToBytes(o.script_public_key),
        })),
        locktime: BigInt(t.lock_time ?? 0),
        subnetworkId: t.subnetwork_id || SUBNETWORK_ID,
        gas: BigInt(t.gas ?? 0),
        payload: hexToBytes(t.payload || ''),
      };
      const computed = computeTxId(tx);
      return Response.json({
        target, matched: computed === target, computed,
        raw_fields: { version: t.version, subnetwork_id: t.subnetwork_id, payload_len: (t.payload || '').length / 2, lock_time: t.lock_time, gas: t.gas, num_inputs: (t.inputs || []).length, num_outputs: (t.outputs || []).length },
      });
    }

    // ---- ENTRY: mint iKAS natively from the desk's KAS wallet ----
    if (action === 'entry') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Login required' }, { status: 401 });

      const amount = Number(amount_kas);
      if (!amount || amount < MIN_ENTRY_KAS) return Response.json({ error: `Native entry minimum is ${MIN_ENTRY_KAS} KAS` }, { status: 400 });
      if (!/^0x[0-9a-fA-F]{40}$/.test(l2_address || '')) return Response.json({ error: 'Invalid 0x L2 address' }, { status: 400 });

      const wallets = await base44.asServiceRole.entities.IgraAgentWallet.list();
      const kasBridge = wallets.find(w => w.name === 'kasbridge');
      if (!kasBridge) return Response.json({ error: 'Desk KAS wallet not initialized — run the bridge once first' }, { status: 400 });

      const amountSompi = BigInt(Math.round(amount * 1e8));
      const utxoRes = await fetch(`${KASPA_API}/addresses/${kasBridge.address}/utxos`);
      const utxos = await utxoRes.json();
      if (!Array.isArray(utxos) || utxos.length === 0) return Response.json({ error: `Desk KAS wallet is empty — fund ${kasBridge.address}` }, { status: 400 });
      utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));

      // Lane fee floor (per igra-kas-bridge): flat + per-input, well above 100 sompi/gram
      const feeFor = (n) => 300000n + 100000n * BigInt(n);
      let totalIn = 0n; const selected = [];
      for (const u of utxos) {
        selected.push(u); totalIn += BigInt(u.utxoEntry.amount);
        if (totalIn >= amountSompi + feeFor(selected.length)) break;
      }
      const fee = feeFor(selected.length);
      if (totalIn < amountSompi + fee) return Response.json({ error: `Insufficient desk KAS: have ${Number(totalIn) / 1e8}, need ${Number(amountSompi + fee) / 1e8}` }, { status: 400 });

      const fromScript = scriptFromAddress(kasBridge.address);
      const entryScript = scriptFromAddress(ENTRY_ADDRESS);
      const change = totalIn - amountSompi - fee;

      const inputs = selected.map(u => ({
        prevTxId: u.outpoint.transactionId, prevIndex: u.outpoint.index,
        utxoScriptVersion: 0, utxoScriptPubKey: fromScript,
        utxoAmount: BigInt(u.utxoEntry.amount), sequence: 0n,
        sigOpCount: 0, computeBudget: 10,
      }));
      const outputs = [{ amount: amountSompi, scriptVersion: 0, scriptPubKey: entryScript }];
      if (change > 0n) outputs.push({ amount: change, scriptVersion: 0, scriptPubKey: fromScript });

      // ---- MINE the nonce until txid starts with 97b1 ----
      // rest_digest is nonce-independent, so each iteration is just 2 blake3 calls
      let nonce = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
      let txId = ''; let payload; let iterations = 0;
      const MAX_ITER = 4000000;
      const tx = { version: 1, inputs, outputs, locktime: 0n, gas: 0n, subnetworkId: SUBNETWORK_ID, payload: new Uint8Array(0) };
      const restDig = restDigest(tx);
      for (; iterations < MAX_ITER; iterations++) {
        payload = buildEntryPayload(l2_address, amountSompi, nonce);
        txId = txIdV1(restDig, payload);
        if (txId.startsWith(TXID_PREFIX)) break;
        nonce = (nonce + 1) >>> 0;
      }
      tx.payload = payload;
      if (!txId.startsWith(TXID_PREFIX)) return Response.json({ error: `Mining failed after ${MAX_ITER} iterations` }, { status: 500 });

      if (dry_run) {
        return Response.json({ dry_run: true, mined_tx_id: txId, nonce, iterations, payload: bytesToHex(payload), fee_kas: Number(fee) / 1e8, inputs: inputs.length, change_kas: Number(change) / 1e8 });
      }

      // ---- SIGN & SUBMIT ----
      let pk = kasBridge.private_key;
      if (pk.startsWith('0x')) pk = pk.slice(2);
      const sigScripts = inputs.map((_, i) => {
        const sig = schnorr.sign(computeSigHash(tx, i), hexToBytes(pk));
        const full = concatBytes(new Uint8Array(sig), u8(0x01));
        return bytesToHex(concatBytes(u8(full.length), full));
      });
      const rawTx = {
        version: 1,
        inputs: inputs.map((inp, i) => ({
          previousOutpoint: { transactionId: inp.prevTxId, index: inp.prevIndex },
          signatureScript: sigScripts[i], sequence: '0', sigOpCount: 0, computeBudget: 10,
        })),
        outputs: outputs.map(o => ({ amount: o.amount.toString(), scriptPublicKey: { version: 0, scriptPublicKey: bytesToHex(o.scriptPubKey) } })),
        lockTime: '0', subnetworkId: SUBNETWORK_ID, gas: '0', payload: bytesToHex(payload),
      };
      const submitRes = await fetch(`${KASPA_API}/transactions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
      });
      const submitText = await submitRes.text();
      if (!submitRes.ok) return Response.json({ error: `Submit failed (${submitRes.status}): ${submitText.slice(0, 400)}`, mined_tx_id: txId }, { status: 500 });
      let data; try { data = JSON.parse(submitText); } catch { data = submitText; }
      const actualId = data.transactionId || data.txid || String(data);
      return Response.json({
        success: true, tx_id: actualId, mined_tx_id: txId, prefix_ok: String(actualId).startsWith(TXID_PREFIX),
        nonce, iterations, amount_kas: amount, l2_address, fee_kas: Number(fee) / 1e8,
        explorer_url: `https://explorer.kaspa.org/txs/${actualId}`,
        note: 'Native Igra entry — iKAS will be minted to the L2 address once the Viaduct processes the tx.',
      });
    }

    return Response.json({ error: 'Unknown action — use verify or entry' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});