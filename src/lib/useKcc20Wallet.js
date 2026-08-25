// Shared KCC20 wallet session for all App Store v2 apps.
// Uses window.kcc20.connect() + getState() per the KCC20 wallet spec.
// Keys never hit Base44, entities, functions, or logs. TTT only sees the address.
import { useState, useEffect } from "react";
import {
  loadKcc20Sdk,
  kcc20Provider,
  disconnectKcc20Pwa,
} from "@/lib/kcc20Pwa";

// Module-level shared state so every component using the hook stays in sync.
let _address = null;
let _kas = null;       // live KAS balance from w.getState()
let _kkdag = null;      // live KKDAG balance
let _holdings = null;   // other KCC20 ticks
let _loading = false;
let _error = null;
let _initStarted = false;
let _initDone = false;
const _subscribers = new Set();

function snap() {
  return { address: _address, kas: _kas, kkdag: _kkdag, holdings: _holdings, loading: _loading, error: _error };
}
function emit() {
  const s = snap();
  _subscribers.forEach((fn) => { try { fn(s); } catch {} });
}

function setAddress(addr) {
  const clean = addr ? String(addr).replace(/^kaspa:/, "") : null;
  if (clean !== _address) {
    _address = clean;
    _kas = null; _kkdag = null; _holdings = null;
    emit();
  }
}

function applyState(state) {
  if (!state) return;
  const kas = state.kas ?? state.balance?.kas ?? state.balanceKAS ?? null;
  const kkdag = state.kkdags ?? state.kkdag ?? null;
  const holdings = state.holdings ?? null;
  let changed = false;
  if (kas !== _kas) { _kas = kas; changed = true; }
  if (kkdag !== _kkdag) { _kkdag = kkdag; changed = true; }
  if (holdings !== _holdings) { _holdings = holdings; changed = true; }
  if (changed) emit();
}

// Read live balances from the parent wallet via getState(). No HTTP, no 422.
export async function refreshKcc20State() {
  const w = kcc20Provider();
  if (!w || !_address) return null;
  try {
    let state;
    if (typeof w.getState === "function") state = await w.getState();
    else if (typeof w.request === "function") state = await w.request("getState");
    applyState(state);
    return state;
  } catch {
    return null;
  }
}

async function silentRestore() {
  const w = kcc20Provider();
  if (!w) return;
  try {
    let acc = null;
    if (typeof w.getAccounts === "function") acc = await w.getAccounts();
    else if (typeof w.request === "function") {
      try { acc = await w.request("getAccounts"); } catch {}
    }
    const addr = acc?.address || acc?.accounts?.[0] || (Array.isArray(acc) ? acc[0] : null);
    if (addr) { setAddress(addr); refreshKcc20State(); }
  } catch {}
}

function registerListeners() {
  const w = kcc20Provider();
  if (!w || typeof w.on !== "function") return;
  try {
    w.on("accountsChanged", (accounts) => {
      const a = Array.isArray(accounts) ? accounts[0] : accounts?.address || accounts;
      if (!a) setAddress(null);
      else { setAddress(a); refreshKcc20State(); }
    });
    w.on("disconnect", () => setAddress(null));
    w.on("stateChanged", () => refreshKcc20State());
    w.on("balanceChanged", () => refreshKcc20State());
  } catch {}
}

function withTimeout(p, ms, msg) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function ensureInit() {
  if (_initDone) return;
  if (_initStarted) return;
  _initStarted = true;
  try {
    await withTimeout(loadKcc20Sdk(), 12000, "KCC20 Wallet unreachable");
    // If the SDK is injected but not yet initialized, wait for kcc20#initialized.
    const w = kcc20Provider();
    if (w && w.isInitialized === false && typeof w.on === "function") {
      await new Promise((res) => {
        const to = setTimeout(res, 5000);
        try { w.on("kcc20#initialized", () => { clearTimeout(to); res(); }); }
        catch { clearTimeout(to); res(); }
      });
    }
    registerListeners();
    await silentRestore();
  } catch (e) {
    _error = e?.message || "KCC20 Wallet unavailable";
    emit();
  } finally {
    _initDone = true;
  }
}

// User-initiated connect. Calls w.connect() (popup or parent Connect sheet),
// then reads getState() to paint balances that match KCC20 Home.
export async function connectKcc20() {
  if (_loading) return;
  _loading = true; _error = null; emit();
  try {
    await ensureInit();
    const w = kcc20Provider();
    if (!w) throw new Error("KCC20 Wallet not detected — open TTT from KCC20 → Profile → TTT");
    let accounts;
    if (typeof w.connect === "function") {
      accounts = await withTimeout(w.connect(), 25000, "Connection timed out — KCC20 wallet did not respond");
    } else if (typeof w.request === "function") {
      accounts = await withTimeout(w.request("connect"), 25000, "Connection timed out — KCC20 wallet did not respond");
    } else {
      throw new Error("KCC20 Wallet SDK missing connect()");
    }
    const addr = Array.isArray(accounts) ? accounts[0] : (accounts?.address || accounts?.accounts?.[0] || null);
    if (!addr) throw new Error("KCC20 Wallet did not return an address");
    setAddress(addr);
    try { const state = await w.getState?.(); applyState(state); } catch {}
  } catch (e) {
    _error = e?.message || "Connection rejected";
    emit();
    throw e;
  } finally {
    _loading = false; emit();
  }
}

export async function disconnectKcc20() {
  // Clear UI immediately so the "Connect Wallet" button reappears — don't wait
  // on the wallet's disconnect ack (which can hang and strand a spinner).
  _loading = false;
  _error = null;
  _address = null;
  _kas = null; _kkdag = null; _holdings = null;
  emit();
  try { await disconnectKcc20Pwa(); } catch {}
}

export function useKcc20Wallet() {
  const [s, setS] = useState(snap());
  useEffect(() => {
    ensureInit();
    // Clear any stale loading flag left by a hung connect from a previous mount.
    if (_loading) { _loading = false; emit(); }
    const fn = (next) => setS(next);
    _subscribers.add(fn);
    setS(snap());
    // Poll getState() every 8s while the App Store is open.
    const iv = setInterval(() => { if (_address) refreshKcc20State(); }, 8000);
    return () => { _subscribers.delete(fn); clearInterval(iv); };
  }, []);
  return {
    address: s.address,
    kas: s.kas,
    kkdag: s.kkdag,
    holdings: s.holdings,
    loading: s.loading || _loading,
    error: s.error,
    connect: connectKcc20,
    disconnect: disconnectKcc20,
    refreshState: refreshKcc20State,
  };
}

export function shortKaspaAddress(addr) {
  if (!addr) return "";
  const a = String(addr).replace(/^kaspa:/, "");
  if (a.length <= 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function formatKas(num) {
  if (num == null || !Number.isFinite(Number(num))) return "0.000";
  return Number(num).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}