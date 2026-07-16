import { schnorr } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";

const STORAGE_KEY = "kas_privkey_hex";

export const bytesToHex = (bytes) =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

export const hexToBytes = (hex) => {
  const clean = hex.trim().replace(/^0x/, "");
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  return Uint8Array.from(clean.match(/.{2}/g).map((b) => parseInt(b, 16)));
};

export const getPrivateKey = () => localStorage.getItem(STORAGE_KEY) || null;

export const savePrivateKey = (hex) => {
  const bytes = hexToBytes(hex);
  if (bytes.length !== 32) throw new Error("Private key must be 32 bytes (64 hex chars)");
  localStorage.setItem(STORAGE_KEY, bytesToHex(bytes));
};

export const generatePrivateKey = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = bytesToHex(bytes);
  localStorage.setItem(STORAGE_KEY, hex);
  return hex;
};

export const clearPrivateKey = () => localStorage.removeItem(STORAGE_KEY);

export const getPublicKey = () => {
  const priv = getPrivateKey();
  if (!priv) return null;
  return bytesToHex(schnorr.getPublicKey(hexToBytes(priv)));
};

export const signPayload = (rawPayload) => {
  const priv = getPrivateKey();
  if (!priv) throw new Error("No private key stored. Import or generate one in the Keys tab.");
  const msgHash = sha256(new TextEncoder().encode(rawPayload));
  const signature = schnorr.sign(msgHash, hexToBytes(priv));
  return {
    signature: bytesToHex(signature),
    pubkey: getPublicKey(),
  };
};

// Parse a KSPT payload — accepts raw JSON text or hex-encoded JSON
export const parseKspt = (input) => {
  let text = input.trim();
  if (!text) throw new Error("Empty payload");
  if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
    try {
      text = new TextDecoder().decode(hexToBytes(text));
    } catch {
      // keep original
    }
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Could not parse payload — expected KSPT JSON or hex-encoded JSON");
  }
  const amount = data.amount_kas ?? data.amount ?? data.value;
  const to = data.pay_to ?? data.to ?? data.address ?? data.destination;
  const fee = data.fee_kas ?? data.fee ?? 0;
  if (amount === undefined || !to) {
    throw new Error("Payload missing amount or destination address");
  }
  return { amount: Number(amount), to: String(to), fee: Number(fee), raw: input.trim() };
};