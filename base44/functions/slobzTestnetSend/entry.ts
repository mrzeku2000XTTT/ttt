// Slobz Testnet (TN10) engine: TKAS balance, address conversion (kaspa: -> kaspatest:)
// and real testnet transactions — same manual P2PK signer as mainnet, testnet params.
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';
import { schnorr } from 'npm:@noble/curves@1.4.0/secp256k1';

const TESTNET_API = 'https://api-tn10.kaspa.org';
const TESTNET_HRP = 'kaspatest';
const FEE_SOMPI = 50000n;
const MAX_UTXOS = 80;
const OP_DATA_32 = 0x20;
const OP_CHECKSIG = 0xac;
const SIGHASH_KEY = new TextEncoder().encode('TransactionSigningHash');
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_REV_CHARSET = new Uint8Array(123).fill(100);
BECH32_CHARSET.split('').forEach((c, i) => { BECH32_REV_CHARSET[c.charCodeAt(0)] = i; });

function estimateFee(numInputs, numOutputs) {
  const computeMass = BigInt(numInputs) * 1200n + BigInt(numOutputs) * 500n + 200n;
  const fee = computeMass * 100n;
  return fee > FEE_SOMPI ? fee : FEE_SOMPI;
}

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
function canonicalDataPush(data) {
  if (data.length <= 75) return concatBytes(new Uint8Array([data.length]), data);
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
function conv8to5(data) {
  const out = []; let buff = 0, bits = 0;
  for (const b of data) {
    buff = (buff << 8) | b; bits += 8;
    while (bits >= 5) { bits -= 5; out.push((buff >> bits) & 31); }
  }
  if (bits > 0) out.push((buff << (5 - bits)) & 31);
  return out;
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

function decodeAnyKaspaAddress(addr) {
  const colonIdx = addr.indexOf(':');
  if (colonIdx < 0) throw new Error('Invalid Kaspa address');
  const hrp = addr.substring(0, colonIdx);
  if (hrp !== 'kaspa' && hrp !== 'kaspatest') throw new Error('Unsupported address prefix');
  const dataPart = addr.substring(colonIdx + 1);
  const addressU5 = [];
  for (const ch of dataPart) {
    const code = ch.charCodeAt(0);
    if (code >= BECH32_REV_CHARSET.length || BECH32_REV_CHARSET[code] === 100) throw new Error(`Invalid address character: ${ch}`);
    addressU5.push(BECH32_REV_CHARSET[code]);
  }
  const prefixU5 = Array.from(new TextEncoder().encode(hrp)).map(b => b & 0x1f);
  if (polymod([...prefixU5, 0, ...addressU5]) !== 0n) throw new Error('Address checksum failed');
  const payloadU5 = addressU5.slice(0, addressU5.length - 8);
  return new Uint8Array(conv5to8(payloadU5)); // version byte + pubkey
}

function encodeKaspaAddress(hrp, payload) {
  const payloadU5 = conv8to5(payload);
  const prefixU5 = Array.from(new TextEncoder().encode(hrp)).map(b => b & 0x1f);
  const checksum = polymod([...prefixU5, 0, ...payloadU5, 0, 0, 0, 0, 0, 0, 0, 0]);
  const checksumU5 = [];
  for (let i = 7; i >= 0; i--) checksumU5.push(Number((checksum >> BigInt(i * 5)) & 31n));
  return hrp + ':' + [...payloadU5, ...checksumU5].map(i => BECH32_CHARSET[i]).join('');
}

// Convert any kaspa:/kaspatest: address to its testnet twin (same pubkey)
function toTestnetAddress(addr) {
  const a = addr.includes(':') ? addr : `kaspa:${addr}`;
  if (a.startsWith('kaspatest:')) { decodeAnyKaspaAddress(a); return a; }
  return encodeKaspaAddress(TESTNET_HRP, decodeAnyKaspaAddress(a));
}

function p2pkScriptFromAddress(address) {
  const payload = decodeAnyKaspaAddress(address);
  const pubKey = payload.slice(1);
  if (pubKey.length !== 32) throw new Error('Unsupported address type');
  const script = new Uint8Array(34);
  script[0] = OP_DATA_32;
  script.set(pubKey, 1);
  script[33] = OP_CHECKSIG;
  return script;
}

function hashPrevOutputs(inputs) {
  return hashBlake2bKeyed(concatBytes(...inputs.flatMap(inp => [hexToBytes(inp.prevTxId), writeU32LE(inp.prevIndex)])));
}
function hashSequences(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU64LE(inp.sequence ?? 0n)))); }
function hashSigOpCounts(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU8(inp.sigOpCount)))); }
function hashOutputs(outputs) {
  return hashBlake2bKeyed(concatBytes(...outputs.flatMap(out => [writeU64LE(out.amount), writeU16LE(out.scriptVersion ?? 0), writeU64LE(BigInt(out.scriptPubKey.length)), out.scriptPubKey])));
}
function computeSigHash(tx, inputIndex) {
  const inp = tx.inputs[inputIndex];
  return hashBlake2bKeyed(concatBytes(
    writeU16LE(tx.version ?? 0),
    hashPrevOutputs(tx.inputs),
    hashSequences(tx.inputs),
    hashSigOpCounts(tx.inputs),
    hexToBytes(inp.prevTxId),
    writeU32LE(inp.prevIndex),
    writeU16LE(inp.utxoScriptVersion ?? 0),
    writeU64LE(BigInt(inp.utxoScriptPubKey.length)),
    inp.utxoScriptPubKey,
    writeU64LE(inp.utxoAmount),
    writeU64LE(inp.sequence ?? 0n),
    writeU8(inp.sigOpCount),
    hashOutputs(tx.outputs),
    writeU64LE(tx.locktime ?? 0n),
    new Uint8Array(20),
    writeU64LE(tx.gas ?? 0n),
    new Uint8Array(32),
    writeU8(0x01)
  ));
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'convert') {
      const testnetAddress = toTestnetAddress(body.address);
      return Response.json({ success: true, testnetAddress });
    }

    if (action === 'balance') {
      const addr = toTestnetAddress(body.address);
      const res = await fetch(`${TESTNET_API}/addresses/${addr}/balance`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Testnet API error: ${res.status}`);
      const data = await res.json();
      return Response.json({ success: true, testnetAddress: addr, balanceTkas: (data.balance || 0) / 1e8 });
    }

    if (action !== 'send') {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const { mnemonic, privateKey: inputPrivateKey, fromAddress, toAddress, amountKas } = body;
    if ((!mnemonic && !inputPrivateKey) || !fromAddress || !toAddress || !amountKas) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const from = toTestnetAddress(fromAddress);
    const to = toTestnetAddress(toAddress);
    let amountSompi = BigInt(Math.round(parseFloat(amountKas) * 1e8));
    if (amountSompi <= 0n) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    let privateKey = inputPrivateKey;
    if (!privateKey) {
      const { KaspaWallet } = await import('npm:@okxweb3/coin-kaspa@1.0.6');
      const wallet = new KaspaWallet();
      privateKey = await wallet.getDerivedPrivateKey({ mnemonic: mnemonic.trim(), hdPath: "m/44'/111111'/0'/0/0" });
    }
    if (typeof privateKey === 'object') privateKey = privateKey.toString();
    if (typeof privateKey === 'string' && privateKey.startsWith('0x')) privateKey = privateKey.slice(2);

    const utxoRes = await fetch(`${TESTNET_API}/addresses/${from}/utxos`, { signal: AbortSignal.timeout(15000) });
    if (!utxoRes.ok) throw new Error(`Failed to fetch testnet UTXOs: ${utxoRes.status}`);
    const utxos = await utxoRes.json();
    if (!utxos || utxos.length === 0) throw new Error('No TKAS in your testnet wallet. Grab free TKAS from the faucet first.');

    utxos.sort((a, b) => Number(b.utxoEntry.amount) - Number(a.utxoEntry.amount));
    let totalIn = 0n;
    const selectedUtxos = [];
    const maxFee = estimateFee(MAX_UTXOS, 2);
    for (const utxo of utxos) {
      if (totalIn >= amountSompi + maxFee) break;
      if (selectedUtxos.length >= MAX_UTXOS) break;
      selectedUtxos.push(utxo);
      totalIn += BigInt(utxo.utxoEntry.amount);
    }
    let feeSompi = estimateFee(selectedUtxos.length, 2);
    if (totalIn < amountSompi + feeSompi) {
      throw new Error(`Insufficient TKAS. Need ${(Number(amountSompi + feeSompi) / 1e8).toFixed(4)}, have ${(Number(totalIn) / 1e8).toFixed(4)}`);
    }

    const fromScript = p2pkScriptFromAddress(from);
    const toScript = p2pkScriptFromAddress(to);
    const inputs = selectedUtxos.map(u => ({
      prevTxId: u.outpoint.transactionId,
      prevIndex: u.outpoint.index,
      utxoScriptVersion: 0,
      utxoScriptPubKey: fromScript,
      utxoAmount: BigInt(u.utxoEntry.amount),
      sequence: 0n,
      sigOpCount: 1,
    }));

    let submitRes, submitText;
    let currentFee = feeSompi;
    for (let attempt = 0; attempt < 2; attempt++) {
      const change = totalIn - amountSompi - currentFee;
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

      if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
      submitRes = await fetch(`${TESTNET_API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: rawTx, allowOrphan: false }),
        signal: AbortSignal.timeout(15000),
      });
      submitText = await submitRes.text();
      if (submitRes.ok) break;

      console.error(`[slobzTestnetSend] attempt ${attempt + 1} error:`, submitText.slice(0, 400));
      const requiredMatch = submitText.match(/required amount of (\d+)/);
      if (requiredMatch && attempt === 0) {
        currentFee = BigInt(requiredMatch[1]) + BigInt(requiredMatch[1]) / 10n;
        continue;
      }
      break;
    }

    if (!submitRes.ok) throw new Error(`Testnet submit failed (${submitRes.status}): ${submitText.slice(0, 300)}`);

    let submitData;
    try { submitData = JSON.parse(submitText); } catch { submitData = submitText; }

    return Response.json({
      success: true,
      network: 'testnet-10',
      txId: submitData.transactionId || submitData.txid || submitData,
      amountTkas: Number(amountSompi) / 1e8,
      fee: Number(currentFee) / 1e8,
      from,
      to,
    });
  } catch (error) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('slobzTestnetSend error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});