/* Search Kaspa wallet — a dedicated on-device Kaspa wallet that pays the
 * micro-search fee. The user funds it by sending KAS to its address; every
 * search deducts a micro amount from a local spend ledger tracked against the
 * on-chain balance. Keys never leave the device.
 */
import { addressFromPrivateKey } from "@/lib/localKaspaWallet";
import { base44 } from "@/api/base44Client";

const KEY = "ttt_search_kaspa_wallet";

/** 0.001 KAS per search — the micro-transaction. */
export const SEARCH_FEE_SOMPI = 100000;
export const SEARCH_FEE_KAS = SEARCH_FEE_SOMPI / 1e8;

const listeners = new Set();
export function subscribe(cb) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function emit() { listeners.forEach((cb) => cb()); }

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function save(wallet) {
  try { localStorage.setItem(KEY, JSON.stringify(wallet)); } catch {}
}

export function getSearchWallet() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function generateSearchWallet() {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  if (priv.every((b) => b === 0)) priv[0] = 1;
  const privateKey = bytesToHex(priv);
  const wallet = { privateKey, address: addressFromPrivateKey(privateKey), createdAt: Date.now(), spentSompi: 0, searches: 0 };
  save(wallet);
  emit();
  return wallet;
}

export function resetSearchWallet() {
  try { localStorage.removeItem(KEY); } catch {}
  cache = { balanceSompi: null, at: 0 };
  emit();
}

export function getLedger() {
  const w = getSearchWallet();
  return w
    ? { spentSompi: w.spentSompi || 0, searches: w.searches || 0 }
    : { spentSompi: 0, searches: 0 };
}

let cache = { balanceSompi: null, at: 0 };
const CACHE_MS = 10000;

/** Fetch the on-chain balance (10s cache). Returns sompi + available after spend ledger. */
export async function fetchWalletBalance(force = false) {
  const w = getSearchWallet();
  if (!w) return { ok: false, reason: "nowallet" };
  const now = Date.now();
  if (!force && cache.balanceSompi !== null && now - cache.at < CACHE_MS) {
    return {
      ok: true,
      balanceSompi: cache.balanceSompi,
      availableSompi: Math.max(0, cache.balanceSompi - getLedger().spentSompi),
    };
  }
  const raw = await base44.functions.invoke("getKaspaBalance", { address: w.address });
  const d = raw?.data ?? raw;
  if (!d?.success) {
    cache = { balanceSompi: null, at: now };
    return { ok: false, reason: "fetch" };
  }
  cache = { balanceSompi: d.balanceSompi ?? 0, at: now };
  return {
    ok: true,
    balanceSompi: cache.balanceSompi,
    availableSompi: Math.max(0, cache.balanceSompi - getLedger().spentSompi),
  };
}

/** Every fee charge recorded on this device — newest first. */
export function getCharges() {
  const w = getSearchWallet();
  return w && Array.isArray(w.charges) ? w.charges : [];
}

/** Settle the fee on-chain as a self-send marker tx so it carries a real,
 * explorer-clickable tx id. Fire-and-forget: if it can't settle (recent tx
 * still confirming, API hiccup), the charge simply stays on the local ledger. */
function settleCharge(entryId, snapshot) {
  if (!snapshot?.privateKey) return;
  base44.functions
    .invoke("sendKaspaTransaction", {
      privateKey: snapshot.privateKey,
      fromAddress: snapshot.address,
      toAddress: snapshot.address,
      amountKas: SEARCH_FEE_KAS,
    })
    .then((raw) => {
      const res = raw?.data ?? raw;
      const txId = res?.txId;
      const cur = getSearchWallet();
      if (!txId || !cur || cur.address !== snapshot.address) return;
      cur.charges = (cur.charges || []).map((c) => (c.id === entryId ? { ...c, txId } : c));
      // The fee is now deducted on-chain — stop counting it in the local spend ledger.
      cur.spentSompi = Math.max(0, (cur.spentSompi || 0) - SEARCH_FEE_SOMPI);
      save(cur);
      emit();
    })
    .catch(() => {});
}

/** Charge one micro-search fee. Fails when there is no wallet, the balance
 * can't be verified, or the available balance is below the fee. */
export async function chargeSearch(query = "") {
  const w = getSearchWallet();
  if (!w) return { ok: false, reason: "nowallet" };
  const bal = await fetchWalletBalance();
  if (!bal.ok) return { ok: false, reason: bal.reason };
  if (bal.balanceSompi - getLedger().spentSompi < SEARCH_FEE_SOMPI) {
    return { ok: false, reason: "empty" };
  }
  w.spentSompi = (w.spentSompi || 0) + SEARCH_FEE_SOMPI;
  w.searches = (w.searches || 0) + 1;
  const entry = {
    id: `c${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    query: String(query || "").slice(0, 140),
    feeKas: SEARCH_FEE_KAS,
    at: Date.now(),
    txId: null,
  };
  w.charges = [entry, ...(w.charges || [])].slice(0, 100);
  save(w);
  emit();
  settleCharge(entry.id, w);
  return {
    ok: true,
    balanceSompi: bal.balanceSompi,
    availableSompi: bal.balanceSompi - w.spentSompi,
  };
}