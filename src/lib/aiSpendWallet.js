/* AI Spending Wallet — a second, separate on-device Kaspa wallet used only to
 * pay for AI agent chats. Funded from the user's TTT wallet. Keys never leave
 * the device (stored under their own localStorage key, independent of the TTT wallet).
 */
import { addressFromPrivateKey } from "@/lib/localKaspaWallet";

const AI_KEY = "ttt_ai_spend_wallet";

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getAiWallet() {
  try {
    const raw = localStorage.getItem(AI_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function generateAiWallet() {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  if (priv.every((b) => b === 0)) priv[0] = 1;
  const privateKey = bytesToHex(priv);
  const wallet = { privateKey, address: addressFromPrivateKey(privateKey), createdAt: Date.now() };
  try { localStorage.setItem(AI_KEY, JSON.stringify(wallet)); } catch {}
  return wallet;
}

export function clearAiWallet() {
  try { localStorage.removeItem(AI_KEY); } catch {}
}