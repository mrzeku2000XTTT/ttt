// Admin-only: splits a large chest UTXO into multiple small spendable UTXOs.
//
// Problem: Kaspa rejects transactions whose total storage mass exceeds 500,000.
// Storage mass ≈ total_output_sompi / 500, so a 5 KAS UTXO produces ~1,000,000
// mass — unspendable. This function spends the large UTXO by creating multiple
// small outputs back to the chest address (each becomes a separate UTXO), with
// the excess consumed as fee. Some KAS is lost to fees, but the chest becomes
// operational again.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';

const KASPA_API = 'https://api.kaspa.org';
// Empirically derived mass formula from Kaspa node rejections:
//   mass ≈ 38753 * N_outputs + 0.001845 * total_output_sompi
// Target 400,000 for safety margin below the 500,000 consensus limit.
const MAX_TARGET_MASS = 400000n;
const MASS_PER_OUTPUT = 38753n;
const MASS_PER_SOMPI = 1845n; // 0.001845 * 1000
const SOMPI_SCALE = 1000000n; // 0.001845 = 1845/1000000
const TARGET_UTXO_KAS = 0.8; // each output UTXO (supports 80 claims of 0.01 KAS)

const OP_DATA_32 = 0x20;
const OP_CHECKSIG = 0xac;
const SIGHASH_KEY = new TextEncoder().encode('TransactionSigningHash');
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_REV_CHARSET = new Uint8Array(123).fill(100);
BECH32_CHARSET.split('').forEach((c, i) => { BECH32_REV_CHARSET[c.charCodeAt(0)] = i; });

function hexToBytes(hex) {
  const clean = String(hex).startsWith('0x') ? String(hex).slice(2) : String(hex);
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  return bytes;
}
function bytesToHex(bytes) { return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''); }
function concatBytes(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}
function writeU8(val) { return new Uint8Array([val & 0xff]); }
function writeU16LE(val) { const b = new Uint8Array(2); b[0] = val & 0xff; b[1] = (val >> 8) & 0xff; return b; }
function writeU32LE(val) { const b = new Uint8Array(4); for (let i = 0; i < 4; i++) b[i] = (val >> (i * 8)) & 0xff; return b; }
function writeU64LE(val) { const n = BigInt(val); const b = new Uint8Array(8); for (let i = 0; i < 8; i++) b[i] = Number((n >> BigInt(i * 8)) & 0xffn); return b; }
function hashBlake2bKeyed(data) { return blake2b(data, { dkLen: 32, key: SIGHASH_KEY }); }
function txIdToBytes(txIdHex) { return hexToBytes(txIdHex); }
function canonicalDataPush(data) {
  const len = data.length;
  if (len <= 75) return concatBytes(new Uint8Array([len]), data);
  throw new Error('Signature too large');
}
function conv5to8(payload) {
  const eightBit = new Array(Math.floor(payload.length * 5 / 8)).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 5) | c; bits += 5;
    while (bits >= 8) { bits -= 8; eightBit[idx++] = (buff >> bits) & 0xff; buff &= (1 << bits) - 1; }
  }
  return eightBit;
}
function polymod(values) {
  let c = 1n;
  for (const d of values) {
    const c0 = c >> 35n;
    c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d);
    if (c0 & 0x01n) c ^= 0x98f2bc8e61n;
    if (c0 & 0x02n) c ^= 0x79b76d99e2n;
    if (c0 & 0x04n) c ^= 0xf33e5fb3c4n;
    if (c0 & 0x08n) c ^= 0xae2eabe2a8n;
    if (c0 & 0x10n) c ^= 0x1e4f43e470n;
  }
  return c ^ 1n;
}
function verifyKaspaAddress(addr) {
  const colonIdx = addr.indexOf(':');
  if (colonIdx < 0) throw new Error('Invalid Kaspa address');
  const hrp = addr.substring(0, colonIdx);
  if (hrp !== 'kaspa') throw new Error('Only mainnet kaspa: addresses are supported');
  const dataPart = addr.substring(colonIdx + 1);
  const addressU5 = [];
  for (const ch of dataPart) {
    const code = ch.charCodeAt(0);
    if (code >= BECH32_REV_CHARSET.length || BECH32_REV_CHARSET[code] === 100) throw new Error(`Invalid address character: ${ch}`);
    addressU5.push(BECH32_REV_CHARSET[code]);
  }
  const prefixBytes = new TextEncoder().encode(hrp);
  const prefixU5 = Array.from(prefixBytes).map(b => b & 0x1f);
  if (polymod([...prefixU5, 0, ...addressU5]) !== 0n) throw new Error('Address checksum failed');
}
function decodeKaspaAddress(addr) {
  verifyKaspaAddress(addr);
  const dataPart = addr.substring(addr.indexOf(':') + 1);
  const addressU5 = [];
  for (const ch of dataPart) addressU5.push(BECH32_REV_CHARSET[ch.charCodeAt(0)]);
  const payloadU5 = addressU5.slice(0, addressU5.length - 8);
  return new Uint8Array(conv5to8(payloadU5));
}
function p2pkScriptFromAddress(address) {
  const payload = decodeKaspaAddress(address);
  const pubKey = payload.slice(1);
  if (pubKey.length !== 32) throw new Error('Unsupported address type');
  const script = new Uint8Array(34);
  script[0] = OP_DATA_32;
  script.set(pubKey, 1);
  script[33] = OP_CHECKSIG;
  return script;
}
function hashPrevOutputs(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.flatMap(inp => [txIdToBytes(inp.prevTxId), writeU32LE(inp.prevIndex)]))); }
function hashSequences(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU64LE(inp.sequence ?? 0n)))); }
function hashSigOpCounts(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU8(inp.sigOpCount)))); }
function hashOutputs(outputs) { return hashBlake2bKeyed(concatBytes(...outputs.flatMap(out => [writeU64LE(out.amount), writeU16LE(out.scriptVersion ?? 0), writeU64LE(BigInt(out.scriptPubKey.length)), out.scriptPubKey]))); }
function computeSigHash(tx, inputIndex) {
  const inp = tx.inputs[inputIndex];
  const subnetworkId = new Uint8Array(20);
  const payloadHash = new Uint8Array(32);
  return hashBlake2bKeyed(concatBytes(
    writeU16LE(tx.version ?? 0), hashPrevOutputs(tx.inputs), hashSequences(tx.inputs), hashSigOpCounts(tx.inputs),
    txIdToBytes(inp.prevTxId), writeU32LE(inp.prevIndex), writeU16LE(inp.utxoScriptVersion ?? 0),
    writeU64LE(BigInt(inp.utxoScriptPubKey.length)), inp.utxoScriptPubKey, writeU64LE(inp.utxoAmount),
    writeU64LE(inp.sequence ?? 0n), writeU8(inp.sigOpCount), hashOutputs(tx.outputs),
    writeU64LE(tx.locktime ?? 0n), subnetworkId, writeU64LE(tx.gas ?? 0n), payloadHash, writeU8(0x01)
  ));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get active chest wallet
    const wallets = await base44.asServiceRole.entities.ChestWallet.filter({ is_active: true });
    if (!wallets || wallets.length === 0) {
      return Response.json({ error: 'No active chest wallet found' }, { status: 404 });
    }
    const chest = wallets[0];
    const chestAddress = chest.kaspa_address.startsWith('kaspa:') ? chest.kaspa_address : `kaspa:${chest.kaspa_address}`;

    // Fetch UTXOs
    const utxoRes = await fetch(`${KASPA_API}/addresses/${chestAddress}/utxos`, { signal: AbortSignal.timeout(15000) });
    if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.status}`);
    let utxos = await utxoRes.json();
    if (!utxos || utxos.length === 0) throw new Error('No UTXOs found');

    // Only spend mature UTXOs
    let virtualDaa = 0;
    try {
      const tipRes = await fetch(`${KASPA_API}/info/virtual-chain-blue-score`, { signal: AbortSignal.timeout(10000) });
      if (tipRes.ok) virtualDaa = Number((await tipRes.json()).blueScore || 0);
    } catch {}
    if (virtualDaa > 0) {
      const matureUtxos = utxos.filter(u => {
        const score = Number(u.utxoEntry?.blockDaaScore || 0);
        return score > 0 && (virtualDaa - score) >= 10;
      });
      if (matureUtxos.length > 0) utxos = matureUtxos;
    }

    // Find UTXOs that are too large (> 2.5 KAS → would exceed mass limit)
    const MAX_SPENDABLE_SOMPI = 250000000n; // 2.5 KAS
    const largeUtxos = utxos.filter(u => BigInt(u.utxoEntry.amount) > MAX_SPENDABLE_SOMPI);
    const smallUtxos = utxos.filter(u => BigInt(u.utxoEntry.amount) <= MAX_SPENDABLE_SOMPI);

    if (largeUtxos.length === 0) {
      return Response.json({
        success: true,
        message: 'No large UTXOs to split. Chest is already healthy.',
        smallUtxoCount: smallUtxos.length,
        smallUtxoTotalKas: smallUtxos.reduce((s, u) => s + Number(u.utxoEntry.amount), 0) / 1e8,
      });
    }

    // Derive private key
    let privateKey;
    try {
      const { KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@1.0.6');
      const wallet = new KaspaWallet();
      privateKey = await wallet.getDerivedPrivateKey({ mnemonic: chest.seed_phrase.trim(), hdPath: "m/44'/111111'/0'/0/0" });
    } catch (e) {
      return Response.json({ error: 'Signing module unavailable: ' + e.message }, { status: 500 });
    }
    if (typeof privateKey === 'object') privateKey = privateKey.toString();
    if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

    const chestScript = p2pkScriptFromAddress(chestAddress);
    const outputSompi = BigInt(Math.round(TARGET_UTXO_KAS * 1e8));
    const results = [];

    for (const utxo of largeUtxos) {
      const utxoAmount = BigInt(utxo.utxoEntry.amount);

      // Calculate how many outputs we can create while staying under mass limit
      // mass = compute_mass + storage_mass
      // compute_mass ≈ 150,000 + 3,000 (1 input) + 2,000 * N outputs
      // storage_mass = outputSompi * N / 500
      let numOutputs = 1;
      while (numOutputs < 200) {
        const computeMass = 150000n + 3000n + 2000n * BigInt(numOutputs);
        const storageMass = (outputSompi * BigInt(numOutputs)) / STORAGE_MASS_DIVISOR;
        if (computeMass + storageMass >= MAX_TX_MASS) {
          numOutputs = Math.max(1, numOutputs - 1);
          break;
        }
        numOutputs++;
      }
      if (numOutputs < 1) numOutputs = 1;

      const totalOutput = outputSompi * BigInt(numOutputs);
      const fee = utxoAmount - totalOutput;

      if (fee <= 0n) {
        results.push({ utxoAmount: Number(utxoAmount) / 1e8, error: 'UTXO too small to split' });
        continue;
      }

      // Build transaction
      const inputs = [{
        prevTxId: utxo.outpoint.transactionId,
        prevIndex: utxo.outpoint.index,
        utxoScriptVersion: 0,
        utxoScriptPubKey: chestScript,
        utxoAmount: utxoAmount,
        sequence: 0n,
        sigOpCount: 1,
      }];

      const outputs = [];
      for (let i = 0; i < numOutputs; i++) {
        outputs.push({ amount: outputSompi, scriptVersion: 0, scriptPubKey: chestScript });
      }

      const tx = { version: 0, inputs, outputs, locktime: 0n, gas: 0n };
      const signatureScripts = inputs.map((_, i) => {
        const sig = schnorr.sign(computeSigHash(tx, i), hexToBytes(privateKey));
        return bytesToHex(canonicalDataPush(concatBytes(new Uint8Array(sig), new Uint8Array([0x01]))));
      });

      const rawTx = {
        version: 0,
        inputs: inputs.map((inp, i) => ({
          previousOutpoint: { transactionId: inp.prevTxId, index: inp.prevIndex },
          signatureScript: signatureScripts[i],
          sequence: '0',
          sigOpCount: inp.sigOpCount,
        })),
        outputs: outputs.map(out => ({
          amount: out.amount.toString(),
          scriptPublicKey: { version: out.scriptVersion, scriptPublicKey: bytesToHex(out.scriptPubKey) },
        })),
        lockTime: '0',
        subnetworkId: '0000000000000000000000000000000000000000',
      };

      let submitRes, submitText;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
        submitRes = await fetch(`${KASPA_API}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
          signal: AbortSignal.timeout(15000),
        });
        submitText = await submitRes.text();
        if (submitRes.ok) break;
        if (!submitText.includes('orphan') && !submitText.includes('missing') && !submitText.includes('already')) break;
      }

      if (!submitRes.ok) {
        results.push({
          utxoAmount: Number(utxoAmount) / 1e8,
          error: `Submit failed: ${submitText.slice(0, 200)}`,
        });
        continue;
      }

      let submitData;
      try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }
      const txId = submitData.transactionId || submitData.txid || submitData;

      results.push({
        utxoAmount: Number(utxoAmount) / 1e8,
        txId,
        outputsCreated: numOutputs,
        outputPerUtxoKas: TARGET_UTXO_KAS,
        recoveredKas: Number(totalOutput) / 1e8,
        feeKas: Number(fee) / 1e8,
      });

      // Wait between transactions to avoid double-spend conflicts
      await new Promise(r => setTimeout(r, 3000));
    }

    const totalRecovered = results.filter(r => r.recoveredKas).reduce((s, r) => s + r.recoveredKas, 0);
    const totalFee = results.filter(r => r.feeKas).reduce((s, r) => s + r.feeKas, 0);
    const totalNewUtxos = results.filter(r => r.outputsCreated).reduce((s, r) => s + r.outputsCreated, 0);

    return Response.json({
      success: true,
      message: `Split complete. Created ${totalNewUtxos} new UTXOs of ${TARGET_UTXO_KAS} KAS each. Recovered ${totalRecovered.toFixed(4)} KAS, lost ${totalFee.toFixed(4)} KAS to fees.`,
      chestAddress,
      results,
      summary: {
        largeUtxosSplit: results.filter(r => r.txId).length,
        newUtxosCreated: totalNewUtxos,
        recoveredKas: totalRecovered,
        lostToFeeKas: totalFee,
        existingSmallUtxos: smallUtxos.length,
      },
    });
  } catch (error) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('splitChestUTXO error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});