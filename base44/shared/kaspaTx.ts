// Shared Kaspa P2PK transaction signing helpers — mainnet + testnet.
// Plain module (no Deno.serve). Imported by backend functions that need to
// build, sign and broadcast Kaspa P2PK transactions.
import { blake2b } from 'npm:@noble/hashes@1.4.0/blake2b';

export const FEE_SOMPI = 50000n;
export const MAX_UTXOS = 80;
export const OP_DATA_32 = 0x20;
export const OP_CHECKSIG = 0xac;
export const SIGHASH_KEY = new TextEncoder().encode('TransactionSigningHash');
export const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
export const BECH32_REV_CHARSET = new Uint8Array(123).fill(100);
BECH32_CHARSET.split('').forEach((c, i) => { BECH32_REV_CHARSET[c.charCodeAt(0)] = i; });

export function estimateFee(numInputs, numOutputs) {
  const computeMass = BigInt(numInputs) * 1200n + BigInt(numOutputs) * 500n + 200n;
  const fee = computeMass * 100n;
  return fee > FEE_SOMPI ? fee : FEE_SOMPI;
}

export function hexToBytes(hex) {
  const clean = String(hex).startsWith('0x') ? String(hex).slice(2) : String(hex);
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  return bytes;
}
export function bytesToHex(bytes) { return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''); }
export function concatBytes(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}
export function writeU8(val) { return new Uint8Array([val & 0xff]); }
export function writeU16LE(val) { const b = new Uint8Array(2); b[0] = val & 0xff; b[1] = (val >> 8) & 0xff; return b; }
export function writeU32LE(val) { const b = new Uint8Array(4); for (let i = 0; i < 4; i++) b[i] = (val >> (i * 8)) & 0xff; return b; }
export function writeU64LE(val) { const n = BigInt(val); const b = new Uint8Array(8); for (let i = 0; i < 8; i++) b[i] = Number((n >> BigInt(i * 8)) & 0xffn); return b; }
export function hashBlake2bKeyed(data) { return blake2b(data, { dkLen: 32, key: SIGHASH_KEY }); }
export function canonicalDataPush(data) {
  if (data.length <= 75) return concatBytes(new Uint8Array([data.length]), data);
  throw new Error('Signature too large');
}

export function conv5to8(payload) {
  const eightBit = new Array(Math.floor(payload.length * 5 / 8)).fill(0);
  let idx = 0, buff = 0, bits = 0;
  for (const c of payload) {
    buff = (buff << 5) | c; bits += 5;
    while (bits >= 8) { bits -= 8; eightBit[idx++] = (buff >> bits) & 0xff; buff &= (1 << bits) - 1; }
  }
  return eightBit;
}
export function conv8to5(data) {
  const out = []; let buff = 0, bits = 0;
  for (const b of data) {
    buff = (buff << 8) | b; bits += 8;
    while (bits >= 5) { bits -= 5; out.push((buff >> bits) & 31); }
  }
  if (bits > 0) out.push((buff << (5 - bits)) & 31);
  return out;
}
export function polymod(values) {
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

// Decode a kaspa: or kaspatest: address — returns version byte + pubkey payload.
export function decodeAnyKaspaAddress(addr) {
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
  return new Uint8Array(conv5to8(payloadU5));
}

export function encodeKaspaAddress(hrp, payload) {
  const payloadU5 = conv8to5(payload);
  const prefixU5 = Array.from(new TextEncoder().encode(hrp)).map(b => b & 0x1f);
  const checksum = polymod([...prefixU5, 0, ...payloadU5, 0, 0, 0, 0, 0, 0, 0, 0]);
  const checksumU5 = [];
  for (let i = 7; i >= 0; i--) checksumU5.push(Number((checksum >> BigInt(i * 5)) & 31n));
  return hrp + ':' + [...payloadU5, ...checksumU5].map(i => BECH32_CHARSET[i]).join('');
}

export function p2pkScriptFromAddress(address) {
  const payload = decodeAnyKaspaAddress(address);
  const pubKey = payload.slice(1);
  if (pubKey.length !== 32) throw new Error('Unsupported address type');
  const script = new Uint8Array(34);
  script[0] = OP_DATA_32;
  script.set(pubKey, 1);
  script[33] = OP_CHECKSIG;
  return script;
}

export function hashPrevOutputs(inputs) {
  return hashBlake2bKeyed(concatBytes(...inputs.flatMap(inp => [hexToBytes(inp.prevTxId), writeU32LE(inp.prevIndex)])));
}
export function hashSequences(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU64LE(inp.sequence ?? 0n)))); }
export function hashSigOpCounts(inputs) { return hashBlake2bKeyed(concatBytes(...inputs.map(inp => writeU8(inp.sigOpCount)))); }
export function hashOutputs(outputs) {
  return hashBlake2bKeyed(concatBytes(...outputs.flatMap(out => [writeU64LE(out.amount), writeU16LE(out.scriptVersion ?? 0), writeU64LE(BigInt(out.scriptPubKey.length)), out.scriptPubKey])));
}
export function computeSigHash(tx, inputIndex) {
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