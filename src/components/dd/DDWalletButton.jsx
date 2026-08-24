import React, { useState, useEffect } from "react";
import { Wallet, X, Check, Loader2, Link2, Unlink, Plus, Sparkles, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { verifyStoredPin, hashPin, storePinHash, getStoredPinHash } from "@/components/wallet/walletLock";
import { generateWallet, isValidKaspaAddress } from "@/lib/localKaspaWallet";

const CONN_KEY = "dd_wallet_connected"; // sessionStorage — address when connected this session
const KCC20_KEY = "dd_kcc20_connected"; // localStorage — connected KCC20 scorpion address

function readTTT() {
  // Matches the wallet the feed tipping flow uses — instant connect if present.
  const address = localStorage.getItem("ttt_wallet_address");
  const pk = localStorage.getItem("ttt_wallet_pk");
  const local = (() => { try { return JSON.parse(localStorage.getItem("ttt_local_kaspa_wallet") || "null"); } catch { return null; } })();
  return {
    address: address || local?.address || null,
    pk: pk || local?.privateKey || null,
  };
}
function writeTTT(address, pk) {
  try { localStorage.setItem("ttt_wallet_address", address); localStorage.setItem("ttt_wallet_pk", pk); } catch {}
}
function getConnected() { try { return sessionStorage.getItem(CONN_KEY); } catch { return null; } }
function setConnected(a) { try { sessionStorage.setItem(CONN_KEY, a); } catch {} }
function clearConn() { try { sessionStorage.removeItem(CONN_KEY); } catch {} }
function getKcc20() { try { return localStorage.getItem(KCC20_KEY); } catch { return null; } }
function setKcc20(a) { try { localStorage.setItem(KCC20_KEY, a); } catch {} }
function clearKcc20() { try { localStorage.removeItem(KCC20_KEY); } catch {} }

export default function DDWalletButton() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("connect"); // connect | pin | setup | confirm | connected | kcc20
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [kcc20Addr, setKcc20Addr] = useState(getKcc20());
  const [kcc20Input, setKcc20Input] = useState("");

  // initial connect state
  useEffect(() => {
    const c = getConnected();
    if (c) { setAddress(c); setStage("connected"); refreshBalance(c); }
    setKcc20Addr(getKcc20());
  }, []);

  const refreshBalance = (addr) => {
    if (!addr) return;
    base44.functions.invoke("getKaspaBalance", { address: addr })
      .then((res) => res?.data?.success && setBalance(res.data.balanceKAS))
      .catch(() => {});
  };

  const openModal = () => {
    const c = getConnected();
    if (c) { setAddress(c); setStage("connected"); refreshBalance(c); }
    else {
      const t = readTTT();
      setStage(t.address && t.pk ? (getStoredPinHash() ? "pin" : "setup") : "connect");
    }
    setErr(""); setPin(""); setFirstPin(""); setOpen(true);
  };

  const doCreate = () => {
    setErr("");
    const w = generateWallet(); // creates a fresh Kaspa mainnet wallet, no funds needed
    writeTTT(w.address, w.privateKey);
    setStage("setup");
  };

  const submitPin = async () => {
    setErr(""); setBusy(true);
    try {
      if (stage === "pin") {
        if (await verifyStoredPin(pin)) finishConnect();
        else setErr("Incorrect PIN — try again.");
      } else if (stage === "setup") {
        if (pin.length !== 6) { setErr("PIN must be 6 digits"); return; }
        setFirstPin(pin); setPin(""); setStage("confirm");
      } else if (stage === "confirm") {
        if (pin !== firstPin) { setErr("PINs do not match"); setFirstPin(""); setPin(""); setStage("setup"); return; }
        storePinHash(await hashPin(pin));
        finishConnect();
      }
    } finally { setBusy(false); }
  };

  const finishConnect = () => {
    const t = readTTT();
    if (!t.address) { setErr("No wallet found."); setStage("connect"); return; }
    setConnected(t.address);
    setAddress(t.address);
    setStage("connected");
    refreshBalance(t.address);
  };

  const disconnect = () => {
    clearConn(); setAddress(null); setBalance(null); setOpen(false);
  };

  const connectKcc20 = () => {
    const v = kcc20Input.trim();
    if (!isValidKaspaAddress(v)) { setErr("Enter a valid Kaspa address"); return; }
    setKcc20(v); setKcc20Addr(v); setErr(""); setStage("connected");
  };

  const short = (a) => a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "";

  return (
    <>
      {address ? (
        <button onClick={openModal} className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl bg-white border border-neutral-200 hover:border-violet-300 transition">
          <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold">TT</div>
          <div className="leading-tight text-left">
            <p className="text-xs font-semibold text-neutral-900">{balance !== null ? `${balance.toFixed(2)} KAS` : "TTT Wallet"}</p>
            <p className="text-[10px] text-neutral-400">{short(address)}</p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>
      ) : (
        <button onClick={openModal} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-neutral-900 text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition whitespace-nowrap flex-shrink-0">
          <Wallet className="w-4 h-4 flex-shrink-0" /> <span className="hidden sm:inline">Connect TTT Wallet</span><span className="sm:hidden">Connect Wallet</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4" onClick={() => setOpen(false)}>
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
                <h3 className="font-semibold text-neutral-900">TTT Wallet</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-900"><X className="w-4 h-4" /></button>
            </div>

            {stage === "connect" && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-500">Connect your TTT wallet to use it across DD. No funds needed to connect — signing is local and on-device.</p>
                <button onClick={doCreate} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800">Create new TTT wallet</button>
                <button onClick={() => setStage("pin")} className="w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-violet-300">I already have a wallet</button>
                <p className="text-[11px] text-neutral-400 text-center">Tip: the wallet you use to tip on the TTT feed connects instantly here.</p>
              </div>
            )}

            {(stage === "pin" || stage === "setup" || stage === "confirm") && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-900">
                  {stage === "pin" ? "Enter your wallet PIN to connect" : stage === "setup" ? "Create a 6-digit wallet PIN" : "Confirm your PIN"}
                </p>
                <input
                  type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submitPin()}
                  placeholder="••••••"
                  className="w-full h-12 text-center tracking-[0.5em] text-lg bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-violet-400"
                />
                {err && <p className="text-xs text-red-500">{err}</p>}
                <button onClick={submitPin} disabled={busy || pin.length !== 6} className="w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : stage === "pin" ? "Connect" : "Continue"}
                </button>
                {stage === "pin" && (
                  <p className="text-[11px] text-neutral-400 text-center">No funds are moved — your PIN only unlocks local signing on this device.</p>
                )}
              </div>
            )}

            {stage === "connected" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">TTT wallet connected</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <p className="text-[11px] text-neutral-400">Balance</p>
                  <p className="text-lg font-bold text-neutral-900">{balance !== null ? `${balance.toFixed(4)} KAS` : "—"}</p>
                  <p className="text-[11px] text-neutral-400 mt-1 break-all">{address}</p>
                </div>

                {/* KCC20 Scorpion external wallet */}
                {kcc20Addr ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-violet-600" /><span className="text-sm font-semibold text-violet-800">KCC20 Scorpion linked</span></div>
                    <p className="text-[11px] text-violet-700 mt-1 break-all">{kcc20Addr}</p>
                    <button onClick={() => { clearKcc20(); setKcc20Addr(null); setStage("kcc20"); }} className="text-[11px] text-violet-600 hover:underline mt-1">Unlink</button>
                  </div>
                ) : (
                  <button onClick={() => { setStage("kcc20"); setErr(""); }} className="w-full h-10 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-violet-300 flex items-center justify-center gap-2">
                    <Link2 className="w-4 h-4" /> Connect KCC20 Scorpion wallet
                  </button>
                )}

                <a href="/KCC20" target="_blank" rel="noreferrer" className="w-full h-10 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-neutral-300 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Open KCC20 wallet app
                </a>

                <button onClick={disconnect} className="w-full h-10 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-2">
                  <Unlink className="w-4 h-4" /> Disconnect wallet
                </button>
              </div>
            )}

            {stage === "kcc20" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-violet-600" /><h4 className="font-semibold text-neutral-900 text-sm">Connect KCC20 Scorpion wallet</h4></div>
                <p className="text-sm text-neutral-500">Link your external KCC20 Scorpion wallet so DD can request signed transactions from it — the same way Kasware connects to websites.</p>
                <input value={kcc20Input} onChange={(e) => { setKcc20Input(e.target.value); setErr(""); }} placeholder="kaspa:qz… (your KCC20 address)" className="w-full h-11 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-violet-400" />
                {err && <p className="text-xs text-red-500">{err}</p>}
                <button onClick={connectKcc20} disabled={!kcc20Input.trim()} className="w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40">Link wallet</button>
                <a href="/KCC20" target="_blank" rel="noreferrer" className="block text-center text-xs text-violet-600 hover:underline">Don't have one? Open the KCC20 wallet app →</a>
                <button onClick={() => setStage("connected")} className="w-full text-xs text-neutral-400 hover:text-neutral-700">Back</button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
              <Shield className="w-3 h-3" /> Keys & PIN stay on this device
            </div>
          </div>
        </div>
      )}
    </>
  );
}