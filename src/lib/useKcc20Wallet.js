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
let _loading = false;
let _error = null;
let _initStarted = false;
let _initDone = false;
const _subscribers = new Set();

function emit() {
  const snap = { address: _address, loading: _loading, error: _error };
  _subscribers.forEach((fn) => {
    try { fn(snap); } catch {}
  });
}

function setAddress(addr) {
  const clean = addr ? String(addr).replace(/^kaspa:/, "") : null;
  if (clean !== _address) {
    _address = clean;
    emit();
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
    if (addr) setAddress(addr);
  } catch {}
}

function registerListeners() {
  const p = kcc20Provider();
  if (!p || typeof p.on !== "function") return;
  try {
    p.on("accountsChanged", (accounts) => {
      const a = Array.isArray(accounts) ? accounts[0] : accounts?.address || accounts;
      if (!a) setAddress(null);
      else setAddress(a);
    });
    p.on("disconnect", () => { setAddress(null); });
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
  // Each component subscribes via its own state slice; React handles re-render.
  const [snap, setSnap] = useState({ address: _address, loading: _loading, error: _error });
  useEffect(() => {
    ensureInit();
    const fn = (s) => setSnap(s);
    _subscribers.add(fn);
    // Always reflect latest module state on mount
    setSnap({ address: _address, loading: _loading, error: _error });
    return () => { _subscribers.delete(fn); };
  }, []);
  return {
    address: snap.address,
    loading: snap.loading || _loading,
    error: snap.error,
    connect: connectKcc20,
    disconnect: disconnectKcc20,
  };
}

export function shortKaspaAddress(addr) {
  if (!addr) return "";
  const a = String(addr).replace(/^kaspa:/, "");
  if (a.length <= 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}