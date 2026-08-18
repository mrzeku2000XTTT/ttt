import { addressFromPrivateKey } from "@/lib/localKaspaWallet";

/**
 * AgentInternet Wallet — a dedicated, self-custodied Kaspa wallet used ONLY by
 * the Agent Internet Studio for self-send training transactions.
 *
 * Stored separately from the TTT wallet so training activity never touches the
 * user's main funds. Key generation + storage is 100% client-side.
 */

const KEY = "agent_internet_wallet";

function bytesToHex(bytes) {
  let h = "";
  for (const b of bytes) h += b.toString(16).padStart(2, "0");
  return h;
}

export function getAgentWallet() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAgentWallet(wallet) {
  try { localStorage.setItem(KEY, JSON.stringify(wallet)); } catch {}
  return wallet;
}

/** Generate a brand new AgentInternet wallet on-device. */
export function generateAgentWallet() {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  if (priv.every((b) => b === 0)) priv[0] = 1;
  const privateKey = bytesToHex(priv);
  return saveAgentWallet({
    privateKey,
    address: addressFromPrivateKey(privateKey),
    createdAt: Date.now(),
  });
}

export function importAgentWallet(privateKeyHex) {
  const pk = String(privateKeyHex).trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(pk)) throw new Error("Private key must be 64 hex characters");
  return saveAgentWallet({
    privateKey: pk,
    address: addressFromPrivateKey(pk),
    createdAt: Date.now(),
    imported: true,
  });
}

export function clearAgentWallet() {
  try { localStorage.removeItem(KEY); } catch {}
}