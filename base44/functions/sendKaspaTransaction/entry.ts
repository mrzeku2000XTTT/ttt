// Real Kaspa transaction: fetch UTXOs → manually sign P2PK inputs → submit to Kaspa REST API
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';

const KASPA_API = 'https://api.kaspa.org';
const FEE_SOMPI = 10000n; // 0.0001 KAS
const MAX_UTXOS = 80;
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

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

function hashPrevOutputs(inputs) {
  return hashBlake2bKeyed(concatBytes(...inputs.flatMap(inp => [txIdToBytes(inp.prevTxId), writeU32LE(inp.prevIndex)])));
}
function hashSequences(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU64LE(inp.sequence ?? 0n)))); }
function hashSigOpCounts(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU8(inp.sigOpCount)))); }
function hashOutputs(outputs) {
  return hashBlake2bKeyed(concatBytes(...outputs.flatMap(out => [writeU64LE(out.amount), writeU16LE(out.scriptVersion ?? 0), writeU64LE(BigInt(out.scriptPubKey.length)), out.scriptPubKey])));
}

function computeSigHash(tx, inputIndex) {
  const inp = tx.inputs[inputIndex];
  const subnetworkId = new Uint8Array(20);
  const payloadHash = new Uint8Array(32);
  return hashBlake2bKeyed(concatBytes(
    writeU16LE(tx.version ?? 0),
    hashPrevOutputs(tx.inputs),
    hashSequences(tx.inputs),
    hashSigOpCounts(tx.inputs),
    txIdToBytes(inp.prevTxId),
    writeU32LE(inp.prevIndex),
    writeU16LE(inp.utxoScriptVersion ?? 0),
    writeU64LE(BigInt(inp.utxoScriptPubKey.length)),
    inp.utxoScriptPubKey,
    writeU64LE(inp.utxoAmount),
    writeU64LE(inp.sequence ?? 0n),
    writeU8(inp.sigOpCount),
    hashOutputs(tx.outputs),
    writeU64LE(tx.locktime ?? 0n),
    subnetworkId,
    writeU64LE(tx.gas ?? 0n),
    payloadHash,
    writeU8(0x01)
  ));
}

Deno.serve(async (req) => {
  try {
    const { mnemonic, privateKey: inputPrivateKey, fromAddress, toAddress, amountKas, sendAll } = await req.json();

    if ((!mnemonic && !inputPrivateKey) || !fromAddress || !toAddress || (!amountKas && !sendAll)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedFromAddress = fromAddress.startsWith('kaspa:') ? fromAddress : `kaspa:${fromAddress}`;
    const normalizedToAddress = toAddress.startsWith('kaspa:') ? toAddress : `kaspa:${toAddress}`;
    verifyKaspaAddress(normalizedFromAddress);
    verifyKaspaAddress(normalizedToAddress);

    let amountSompi = amountKas ? BigInt(Math.round(parseFloat(amountKas) * 1e8)) : 0n;
    if (!sendAll && amountSompi <= 0n) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    let privateKey = inputPrivateKey;

    // Only load the OKX SDK when we must derive a key from a mnemonic.
    // Match the SAME version used by the working krc20Transfer function (@1.0.6).
    if (!privateKey) {
      let KaspaWallet;
      try {
        ({ KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@1.0.6'));
      } catch (e) {
        throw new Error('Signing module unavailable on server. Please re-import your wallet using its private key, or try again shortly.');
      }
      const wallet = new KaspaWallet();
      privateKey = await wallet.getDerivedPrivateKey({ mnemonic: mnemonic.trim(), hdPath: "m/44'/111111'/0'/0/0" });
    }
    if (typeof privateKey === 'object') privateKey = privateKey.toString();
    if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

    const utxoRes = await fetch(`${KASPA_API}/addresses/${normalizedFromAddress}/utxos`, { signal: AbortSignal.timeout(15000) });
    if (!utxoRes.ok) throw new Error(`Failed to fetch UTXOs: ${utxoRes.status}`);
    const utxos = await utxoRes.json();
    if (!utxos || utxos.length === 0) throw new Error('No UTXOs. Your balance may be 0 or unconfirmed.');

    utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
    let totalIn = 0n;
    const selectedUtxos = [];

    if (sendAll) {
      for (const utxo of utxos) {
        if (selectedUtxos.length >= MAX_UTXOS) break;
        selectedUtxos.push(utxo);
        totalIn += BigInt(utxo.utxoEntry.amount);
      }
      amountSompi = totalIn - FEE_SOMPI;
      if (amountSompi <= 0n) throw new Error('Balance too low to cover fee');
    } else {
      const needed = amountSompi + FEE_SOMPI;
      for (const utxo of utxos) {
        if (totalIn >= needed) break;
        if (selectedUtxos.length >= MAX_UTXOS) break;
        selectedUtxos.push(utxo);
        totalIn += BigInt(utxo.utxoEntry.amount);
      }
      if (totalIn < needed) throw new Error(`Insufficient balance. Need ${(Number(needed) / 1e8).toFixed(8)} KAS, have ${(Number(totalIn) / 1e8).toFixed(8)} KAS`);
    }

    const fromScript = p2pkScriptFromAddress(normalizedFromAddress);
    const toScript = p2pkScriptFromAddress(normalizedToAddress);
    const change = totalIn - amountSompi - FEE_SOMPI;

    const inputs = selectedUtxos.map(u => ({
      prevTxId: u.outpoint.transactionId,
      prevIndex: u.outpoint.index,
      utxoScriptVersion: 0,
      utxoScriptPubKey: fromScript,
      utxoAmount: BigInt(u.utxoEntry.amount),
      sequence: 0n,
      sigOpCount: 1,
    }));

    const outputs = [{ amount: amountSompi, scriptVersion: 0, scriptPubKey: toScript }];
    if (change > 0n) outputs.push({ amount: change, scriptVersion: 0, scriptPubKey: fromScript });

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

    const submitRes = await fetch(`${KASPA_API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
      signal: AbortSignal.timeout(15000),
    });

    const submitText = await submitRes.text();
    if (!submitRes.ok) throw new Error(`Submit failed (${submitRes.status}): ${submitText.slice(0, 200)}`);
    let submitData;
    try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }

    return Response.json({
      success: true,
      txId: submitData.transactionId || submitData.txid || submitData,
      amountKas: Number(amountSompi) / 1e8,
      fee: Number(FEE_SOMPI) / 1e8,
    });
  } catch (error) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('sendKaspaTransaction error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});