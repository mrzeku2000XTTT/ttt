import React, { useState, useEffect } from "react";
import { Wallet, Check, Loader2, Link2, AlertCircle, Shield, Sparkles, ArrowRight } from "lucide-react";
import { generateWallet } from "@/lib/localKaspaWallet";
import { verifyStoredPin, hashPin, storePinHash, getStoredPinHash } from "@/components/wallet/walletLock";
import {
  loadKcc20Sdk,
  connectKcc20Pwa,
  isKcc20Detected,
  isInWalletIframe,
  KCC20_APP,
} from "@/lib/kcc20Pwa";

const CONN_KEY = "dd_wallet_connected";
const KCC20_KEY = "dd_kcc20_connected";
const KCC20_VIA_KEY = "dd_kcc20_via";

function writeTTT(address, pk) {
  try {
    localStorage.setItem("ttt_wallet_address", address);
    localStorage.setItem("ttt_wallet_pk", pk);
  } catch {}
}
function readTTT() {
  const address = localStorage.getItem("ttt_wallet_address");
  const pk = localStorage.getItem("ttt_wallet_pk");
  const local = (() => { try { return JSON.parse(localStorage.getItem("ttt_local_kaspa_wallet") || "null"); } catch { return null; } })();
  return { address: address || local?.address || null, pk: pk || local?.privateKey || null };
}
function setConnected(a) { try { sessionStorage.setItem(CONN_KEY, a); } catch {} }
function setKcc20(a) { try { localStorage.setItem(KCC20_KEY, a); } catch {} }
function setKcc20Via(v) { try { localStorage.setItem(KCC20_VIA_KEY, v); } catch {} }

/**
 * DDWalletSetup — wallet onboarding card.
 * Lets the user create a new TTT wallet, import an existing one, connect an
 * external KCC20 wallet, or skip. Calls onDone() when the user is ready to
 * continue (whether they connected a wallet or chose to skip).
 */
export default function DDWalletSetup({ onDone }) {
  const [mode, setMode] = useState("choose"); // choose | create | import | kcc20
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [kcc20Busy, setKcc20Busy] = useState(false);
  const [kcc20Detected, setKcc20Detected] = useState(isKcc20Detected());
  const [done, setDone] = useState(false);

  // Pre-fill: if a wallet already exists locally, show "import" as default
  useEffect(() => {
    const t = readTTT();
    if (t.address && t.pk) setMode("import");
  }, []);

  const doCreate = () => {
    setErr("");
    const w = generateWallet();
    writeTTT(w.address, w.privateKey);
    setMode("create");
  };

  const submitPin = async () => {
    setErr(""); setBusy(true);
    try {
      if (mode === "import") {
        if (await verifyStoredPin(pin)) finishConnect();
        else setErr("Incorrect PIN — try again.");
      } else if (mode === "create") {
        if (pin.length !== 6) { setErr("PIN must be 6 digits"); return; }
        setFirstPin(pin); setPin(""); setMode("confirm");
      } else if (mode === "confirm") {
        if (pin !== firstPin) { setErr("PINs do not match"); setFirstPin(""); setPin(""); setMode("create"); return; }
        storePinHash(await hashPin(pin));
        finishConnect();
      }
    } finally { setBusy(false); }
  };

  const finishConnect = () => {
    const t = readTTT();
    if (!t.address) { setErr("No wallet found."); setMode("choose"); return; }
    setConnected(t.address);
    setDone(true);
    setTimeout(() => onDone?.(), 600);
  };

  const connectKcc20Live = async () => {
    setErr(""); setKcc20Busy(true);
    try {
      const { address } = await connectKcc20Pwa();
      setKcc20(address); setKcc20Via("pwa");
      setDone(true);
      setTimeout(() => onDone?.(), 600);
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (/popup|blocked/i.test(msg)) setErr("Allow popups for this site, then try again.");
      else if (/reject|declin|denied/i.test(msg)) setErr("Connection declined in KCC20 Wallet.");
      else setErr(msg || "Could not connect KCC20 Wallet.");
    } finally { setKcc20Busy(false); }
  };

  // Warm up KCC20 SDK when entering that mode
  useEffect(() => {
    if (mode !== "kcc20") return;
    setErr("");
    if (!isKcc20Detected()) {
      let cancelled = false;
      loadKcc20Sdk()
        .then(() => { if (!cancelled) setKcc20Detected(true); })
        .catch(() => { if (!cancelled) setKcc20Detected(false); });
      return () => { cancelled = true; };
    }
  }, [mode]);

  const short = (a) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "");

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-neutral-900">Wallet ready</p>
        <p className="text-xs text-neutral-500 mt-1">Continuing to your setup…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Choose mode */}
      {mode === "choose" && (
        <div className="space-y-3">
          {isInWalletIframe() && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">Running inside the KCC20 wallet frame — your main TTT wallet isn't visible here. Create a fresh local wallet, then fund it from KCC20. Export your keys from Settings so you never lose access.</p>
            </div>
          )}
          <button onClick={doCreate} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4" /> Create new TTT wallet
          </button>
          <button onClick={() => setMode("import")} className="w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300">
            I already have a wallet on this device
          </button>
          <button onClick={() => setMode("kcc20")} className="w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 flex items-center justify-center gap-2">
            <Link2 className="w-4 h-4" /> Connect external KCC20 wallet
          </button>
          <button onClick={() => onDone?.()} className="w-full text-sm text-neutral-400 hover:text-neutral-600 pt-1">
            Skip for now
          </button>
        </div>
      )}

      {/* Create PIN (new wallet) */}
      {(mode === "create" || mode === "confirm") && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-900">
            {mode === "create" ? "Create a 6-digit wallet PIN" : "Confirm your PIN"}
          </p>
          <p className="text-xs text-neutral-500">This PIN encrypts your wallet keys on this device. You'll need it to sign transactions.</p>
          <input
            type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            placeholder="••••••"
            className="w-full h-12 text-center tracking-[0.5em] text-lg bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-neutral-400"
          />
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button onClick={submitPin} disabled={busy || pin.length !== 6} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Continue"}
          </button>
          <button onClick={() => setMode("choose")} className="w-full text-xs text-neutral-400 hover:text-neutral-600">Back</button>
        </div>
      )}

      {/* Import (existing wallet, enter PIN) */}
      {mode === "import" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-900">Enter your wallet PIN to connect</p>
          <p className="text-xs text-neutral-500">We found a wallet on this device. Enter your PIN to unlock it.</p>
          <input
            type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            placeholder="••••••"
            className="w-full h-12 text-center tracking-[0.5em] text-lg bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-neutral-400"
          />
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button onClick={submitPin} disabled={busy || pin.length !== 6} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Connect wallet"}
          </button>
          <button onClick={() => setMode("choose")} className="w-full text-xs text-neutral-400 hover:text-neutral-600">Back</button>
        </div>
      )}

      {/* KCC20 external wallet */}
      {mode === "kcc20" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-neutral-700" />
            <h4 className="font-semibold text-neutral-900 text-sm">Connect KCC20 wallet</h4>
          </div>

          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${kcc20Detected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-500"}`}>
            <span className={`w-2 h-2 rounded-full ${kcc20Detected ? "bg-emerald-500" : "bg-neutral-400 animate-pulse"}`} />
            {kcc20Detected ? "KCC20 SDK ready" : "Loading KCC20 SDK…"}
          </div>

          <p className="text-xs text-neutral-500">A popup opens to the KCC20 wallet — approve there. Your keys never enter TTT.</p>

          {err && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{err}</span>
            </div>
          )}

          <button onClick={connectKcc20Live} disabled={kcc20Busy} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 flex items-center justify-center gap-2">
            {kcc20Busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {kcc20Busy ? "Connecting…" : "Sign with KCC20 wallet"}
          </button>

          {!isInWalletIframe() && (
            <a href={KCC20_APP} target="_blank" rel="noreferrer" className="w-full h-10 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-neutral-300 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Open KCC20 wallet app
            </a>
          )}

          <button onClick={() => onDone?.()} className="w-full text-sm text-neutral-400 hover:text-neutral-600 pt-1">
            Skip for now
          </button>
          <button onClick={() => setMode("choose")} className="w-full text-xs text-neutral-400 hover:text-neutral-600">Back</button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
        <Shield className="w-3 h-3" /> Keys & PIN stay on this device
      </div>
    </div>
  );
}