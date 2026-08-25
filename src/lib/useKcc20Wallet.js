// Shared KCC20 wallet session for all App Store v2 apps.
// Keys never hit Base44, entities, functions, or logs. TTT only sees the address.
import { useState, useEffect } from "react";
import {
  loadKcc20Sdk,
  kcc20Provider,
  connectKcc20Pwa,
  disconnectKcc20Pwa,
} from "@/lib/kcc20Pwa";

// Module-level shared state so every component using the hook stays in sync.
let _address = null;
let _balance = null; // KAS balance (number) from the wallet
let _loading = false;
let _error = null;
let _initStarted = false;
let _initDone = false;
const _subscribers = new Set();

function snap() {
  return { address: _address, balance: _balance, loading: _loading, error: _error };
}
function emit() {
  const s = snap();
  _subscribers.forEach((fn) => { try { fn(s); } catch {} });
}

function setAddress(addr) {
  const clean = addr ? String(addr).replace(/^kaspa:/, "") : null;
  if (clean !== _address) {
    _address = clean;
    _balance = null;
    emit();
  }
}

function setBalance(b) {
  if (b !== _balance) { _balance = b; emit(); }
}

// Fetch the live KAS balance for the connected address from the parent wallet.
// SDK contract: request('getBalance', { address }) → { balanceKAS, pending, address }
export async function refreshKcc20Balance() {
  const p = kcc20Provider();
  if (!p || !_address) return null;
  try {
    let res;
    if (typeof p.request === "function") res = await p.request("getBalance", { address: _address });
    else if (typeof p.getBalance === "function") res = await p.getBalance(_address);
    const b = res?.balanceKAS ?? res?.balance ?? res?.total ?? null;
    const num = b != null ? Number(b) : null;
    setBalance(Number.isFinite(num) ? num : null);
    return num;
  } catch {
    return null;
  }
}

async function silentRestore() {
  const p = kcc20Provider();
  if (!p) return;
  try {
    let acc;
    if (typeof p.request === "function") acc = await p.request("getAccounts");
    else if (typeof p.getAccounts === "function") acc = await p.getAccounts();
    const addr = acc?.address || acc?.accounts?.[0] || (Array.isArray(acc) ? acc[0] : null);
    if (addr) {
      setAddress(addr);
      refreshKcc20Balance();
    }
  } catch {}
}

function registerListeners() {
  const p = kcc20Provider();
  if (!p || typeof p.on !== "function") return;
  try {
    p.on("accountsChanged", (accounts) => {
      const a = Array.isArray(accounts) ? accounts[0] : accounts?.address || accounts;
      if (!a) setAddress(null);
      else { setAddress(a); refreshKcc20Balance(); }
    });
    p.on("disconnect", () => { setAddress(null); });
    p.on("balanceChanged", () => refreshKcc20Balance());
  } catch {}
}

async function ensureInit() {
  if (_initDone) return;
  if (_initStarted) return;
  _initStarted = true;
  try {
    await loadKcc20Sdk();
    registerListeners();
    await silentRestore();
  } catch (e) {
    _error = e?.message || "KCC20 Wallet unavailable";
    emit();
  } finally {
    _initDone = true;
  }
}

export async function connectKcc20() {
  if (_loading) return;
  _loading = true; _error = null; emit();
  try {
    await ensureInit();
    const res = await connectKcc20Pwa();
    setAddress(res?.address || res?.accounts?.[0] || (Array.isArray(res) ? res[0] : null));
    refreshKcc20Balance();
  } catch (e) {
    _error = e?.message || "Connection rejected";
    emit();
    throw e;
  } finally {
    _loading = false; emit();
  }
}

export async function disconnectKcc20() {
  try { await disconnectKcc20Pwa(); } catch {}
  setAddress(null);
}

export function useKcc20Wallet() {
  const [s, setS] = useState(snap());
  useEffect(() => {
    ensureInit();
    const fn = (next) => setS(next);
    _subscribers.add(fn);
    setS(snap());
    // periodic balance refresh while connected
    const iv = setInterval(() => { if (_address) refreshKcc20Balance(); }, 20000);
    return () => { _subscribers.delete(fn); clearInterval(iv); };
  }, []);
  return {
    address: s.address,
    balance: s.balance,
    loading: s.loading || _loading,
    error: s.error,
    connect: connectKcc20,
    disconnect: disconnectKcc20,
    refreshBalance: refreshKcc20Balance,
  };
}

export function shortKaspaAddress(addr) {
  if (!addr) return "";
  const a = String(addr).replace(/^kaspa:/, "");
  if (a.length <= 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function formatKas(num) {
  if (num == null || !Number.isFinite(num)) return "0.000";
  return num.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}