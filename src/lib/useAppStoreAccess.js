// App Store v2 access gate. A user connects Scorpion (KCC20), self-sends KAS
// to their own address (paying the Kaspa miner fee), and we off-chain verify
// that self-send via the verifyAppStoreAccess backend function. On success we
// grant a 30-minute window stored locally (keyed by wallet address).
//
// Module-level state (mirrors useKcc20Wallet) so every component using the hook
// stays in sync — verify in one gate, every other gate/button sees `valid`.
import { useState, useEffect, useRef, useCallback } from "react";
import { useKcc20Wallet } from "@/lib/useKcc20Wallet";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "ttt_appstore_access_v1";
const WINDOW_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 24; // ~3.2 min at 8s polling

function loadAccess() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}
function saveAccess(a) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); } catch {} }
function clearAccess() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

let _access = loadAccess();
let _verifying = false;
let _verifyError = null;
let _pollIv = null;
const _subs = new Set();

function emit() {
  const s = { access: _access, verifying: _verifying, verifyError: _verifyError };
  _subs.forEach((fn) => { try { fn(s); } catch {} });
}
function setAccess(a) {
  _access = a;
  if (a) saveAccess(a); else clearAccess();
  emit();
}
function stopPoll() {
  if (_pollIv) { clearInterval(_pollIv); _pollIv = null; }
}

export function useAppStoreAccess() {
  const kcc = useKcc20Wallet();
  const address = kcc.address;
  const [snap, setSnap] = useState({ access: _access, verifying: _verifying, verifyError: _verifyError });
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const fn = (s) => setSnap(s);
    _subs.add(fn);
    setSnap({ access: _access, verifying: _verifying, verifyError: _verifyError });
    return () => _subs.delete(fn);
  }, []);

  const valid = !!(address && snap.access && snap.access.address === address && snap.access.grantedUntil > Date.now());

  // Countdown — invalidate when the window expires.
  useEffect(() => {
    if (!valid) { setRemaining(0); return; }
    const tick = () => {
      const r = snap.access.grantedUntil - Date.now();
      if (r <= 0) { setAccess(null); setRemaining(0); return; }
      setRemaining(r);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [valid, snap.access]);

  // If the wallet disconnects (user closed Scorpion / switched account) while
  // we're polling for the self-send, stop the spinner and tell them to reconnect.
  useEffect(() => {
    if (!address && _verifying) {
      stopPoll();
      _verifying = false;
      _verifyError = "Wallet closed — reconnect Scorpion to continue.";
      emit();
    }
  }, [address]);

  const cancelVerify = useCallback(() => {
    stopPoll();
    _verifying = false;
    _verifyError = null;
    emit();
  }, []);

  const verify = useCallback(async () => {
    if (!address || _verifying) return;
    stopPoll();
    _verifying = true;
    _verifyError = null;
    emit();
    const sinceTs = Date.now() - 5 * 60 * 1000;
    let attempts = 0;

    const attempt = async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke("verifyAppStoreAccess", { address, sinceTs });
        const d = res?.data || res;
        if (d?.verified) {
          setAccess({
            address,
            grantedUntil: d.grantedUntil || (Date.now() + WINDOW_MS),
            txId: d.transaction?.id,
            amount: d.transaction?.amount,
          });
          _verifying = false;
          _verifyError = null;
          emit();
          return true;
        }
      } catch (e) {
        _verifyError = e?.message || "Verification failed — retrying…";
        emit();
      }
      if (attempts >= MAX_ATTEMPTS) {
        _verifying = false;
        _verifyError = "No self-send detected yet. Send KAS to yourself in Scorpion, then tap verify again.";
        emit();
        return true;
      }
      return false;
    };

    const done = await attempt();
    if (done) return;
    _pollIv = setInterval(async () => {
      const stop = await attempt();
      if (stop) stopPoll();
    }, 8000);
  }, [address]);

  useEffect(() => () => stopPoll(), []);

  return {
    address,
    connect: kcc.connect,
    disconnect: kcc.disconnect,
    loading: kcc.loading,
    walletError: kcc.error,
    valid,
    remaining,
    verifying: snap.verifying,
    verifyError: snap.verifyError,
    verify,
    cancelVerify,
    access: snap.access,
  };
}

export function formatRemaining(ms) {
  if (!ms || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}