import { secp256k1 } from "@noble/curves/secp256k1";

/**
 * localKaspaWallet — generate + store a Kaspa mainnet wallet ENTIRELY in the
 * browser. No backend call, no Node Buffer/crypto. The private key + address
 * are derived client-side and kept in localStorage only.
 *
 * Address format is the standard Kaspa pubkey-address (BCH-checksum bech32-like
 * with HRP "kaspa"), replicated from @okxweb3/coin-kaspa so results match the
 * server-derived addresses byte-for-byte.
 */

const STORAGE_KEY = "ttt_local_kaspa_wallet";
const HRP = "kaspa";
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR1 = [0x98, 0x79, 0xf3, 0xae, 0x1e];
const GENERATOR2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

function convertBits(data, from, to, strict) {
  const length = strict
    ? Math.floor((data.length * from) / to)
    : Math.ceil((data.length * from) / to);
  const mask = (1 << to) - 1;
  const result = new Uint8Array(length);
  let index = 0, accumulator = 0, bits = 0;
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    accumulator = (accumulator << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result[index++] = (accumulator >> bits) & mask;
    }
  }
  if (!strict && bits > 0) {
    result[index] = (accumulator << (to - bits)) & mask;
  }
  return result;
}

function base32Encode(data) {
  let out = "";
  for (const v of data) out += CHARSET[v];
  return out;
}

function prefixToArray(prefix) {
  const r = [];
  for (let i = 0; i < prefix.length; i++) r.push(prefix.charCodeAt(i) & 31);
  return r;
}

function checksumToArray(checksum) {
  const r = [];
  for (let i = 0; i < 8; i++) {
    r.push(checksum & 31);
    checksum /= 32;
  }
  return r.reverse();
}

function polymod(data) {
  let c0 = 0, c1 = 1, C = 0;
  for (let j = 0; j < data.length; j++) {
    C = c0 >>> 3;
    c0 &= 0x07;
    c0 <<= 5;
    c0 |= c1 >>> 27;
    c1 &= 0x07ffffff;
    c1 <<= 5;
    c1 ^= data[j];
    for (let i = 0; i < GENERATOR1.length; i++) {
      if (C & (1 << i)) {
        c0 ^= GENERATOR1[i];
        c1 ^= GENERATOR2[i];
      }
    }
  }
  c1 ^= 1;
  if (c1 < 0) {
    c1 ^= 1 << 31;
    c1 += (1 << 30) * 2;
  }
  return c0 * (1 << 30) * 4 + c1;
}

function bytesToHex(bytes) {
  let h = "";
  for (const b of bytes) h += b.toString(16).padStart(2, "0");
  return h;
}
function hexToBytes(hex) {
  const h = hex.replace(/^0x/, "").toLowerCase();
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

/** Encode a 32-byte x-only public key (hex) into a kaspa: address. */
export function addressFromPubKey(xOnlyPubKeyHex) {
  const pub = hexToBytes(xOnlyPubKeyHex);
  if (pub.length !== 32) throw new Error("x-only pubkey must be 32 bytes");
  const versionByte = 0;
  const payloadData = convertBits(new Uint8Array([versionByte, ...pub]), 8, 5, false);
  const prefixData = prefixToArray(HRP).concat([0]);
  const checksumData = new Uint8Array(prefixData.length + payloadData.length + 8);
  checksumData.set(prefixData);
  checksumData.set(payloadData, prefixData.length);
  const polymodData = checksumToArray(polymod(checksumData));
  const payload = new Uint8Array(payloadData.length + polymodData.length);
  payload.set(payloadData);
  payload.set(polymodData, payloadData.length);
  return HRP + ":" + base32Encode(payload);
}

/** Derive a kaspa: address from a 32-byte private key (hex). */
export function addressFromPrivateKey(privateKeyHex) {
  const compressed = secp256k1.getPublicKey(hexToBytes(privateKeyHex), true); // 33 bytes
  const xOnly = compressed.slice(1); // 32 bytes
  return addressFromPubKey(bytesToHex(xOnly));
}

/** Generate a fresh wallet on-device. Returns { privateKey, address, createdAt }. */
export function generateWallet() {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  // avoid the all-zero / negligible edge case
  if (priv.every((b) => b === 0)) priv[0] = 1;
  const privateKey = bytesToHex(priv);
  const address = addressFromPrivateKey(privateKey);
  const wallet = { privateKey, address, createdAt: Date.now() };
  saveWallet(wallet);
  return wallet;
}

export function importFromPrivateKey(privateKeyHex) {
  const pk = privateKeyHex.trim().toLowerCase().replace(/^0x/, "");
  if (pk.length !== 64 || !/^[0-9a-f]{64}$/.test(pk)) {
    throw new Error("Private key must be 64 hex chars");
  }
  const address = addressFromPrivateKey(pk);
  const wallet = { privateKey: pk, address, createdAt: Date.now(), imported: true };
  saveWallet(wallet);
  return wallet;
}

export function saveWallet(wallet) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet)); } catch {}
}
export function getWallet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearWallet() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  unlinkWallet();
}

/* ---- Agent Internet link (consent) --------------------------------------
 * The user explicitly authorizes the TTT AI agent to SEE their wallet
 * address and call read-only tools (balance, UTXOs, history) with it.
 * The private key is NEVER part of the link record and is NEVER sent to
 * the agent / LLM. Sends still require local signing + the confirm_money
 * gate, so linking only grants read access by default.
 */
const LINK_KEY = "ttt_agent_wallet_link";
export const LINK_SCOPES = ["balance", "utxos", "history"];

export function linkWallet(scope = LINK_SCOPES) {
  const w = getWallet();
  if (!w) return null;
  const link = {
    address: w.address,
    linkedAt: Date.now(),
    scope: Array.from(new Set(scope)).filter((s) => LINK_SCOPES.includes(s)),
  };
  try { localStorage.setItem(LINK_KEY, JSON.stringify(link)); } catch {}
  return link;
}

export function unlinkWallet() {
  try { localStorage.removeItem(LINK_KEY); } catch {}
}

export function getWalletLink() {
  try {
    const raw = localStorage.getItem(LINK_KEY);
    if (!raw) return null;
    const link = JSON.parse(raw);
    // invalidate if the underlying wallet was cleared / changed
    const w = getWallet();
    if (!w || w.address !== link.address) { unlinkWallet(); return null; }
    return link;
  } catch { return null; }
}

export function isWalletLinked() { return !!getWalletLink(); }
export function getLinkedAddress() { return getWalletLink()?.address || null; }

export function isValidKaspaAddress(address) {
  try {
    const a = address.toLowerCase();
    const parts = a.split(":");
    if (parts.length !== 2 || parts[0] !== HRP) return false;
    const payload = [];
    const inv = {};
    for (let i = 0; i < CHARSET.length; i++) inv[CHARSET[i]] = i;
    for (const ch of parts[1]) {
      if (!(ch in inv)) return false;
      payload.push(inv[ch]);
    }
    const prefixData = prefixToArray(HRP);
    const data = new Uint8Array(prefixData.length + 1 + payload.length);
    data.set(prefixData);
    data.set([0], prefixData.length);
    data.set(payload, prefixData.length + 1);
    return polymod(data) === 0;
  } catch { return false; }
}