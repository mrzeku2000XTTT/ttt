import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Wallet, X, Check, Loader2, Link2, Unlink, Plus, Sparkles, Shield, ExternalLink, AlertCircle, Download, ArrowDownToLine, Copy, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { verifyStoredPin, hashPin, storePinHash, getStoredPinHash } from "@/components/wallet/walletLock";
import { generateWallet, isValidKaspaAddress, getWallet } from "@/lib/localKaspaWallet";
import DDLogo from "@/components/dd/DDLogo";
import {
  loadKcc20Sdk,
  connectKcc20Pwa,
  disconnectKcc20Pwa,
  isKcc20Detected,
  isInWalletIframe,
  isEmbeddedKcc20,
  sendTokenKcc20,
  getTokenBalanceKcc20,
  getNetworkKcc20,
  KCC20_APP,
  KCC20_ORIGIN,
} from "@/lib/kcc20Pwa";

const CONN_KEY = "dd_wallet_connected"; // sessionStorage — address when connected this session
const KCC20_KEY = "dd_kcc20_connected"; // localStorage — connected KCC20 scorpion address
const KCC20_VIA_KEY = "dd_kcc20_via"; // localStorage — "pwa" | "paste"
const HIDE_KCC20_KEY = "dd_hide_kcc20"; // localStorage — hide KCC20 token holdings toggle

// KKDAG treasury — users send real KKDAG tokens here via the parent KCC20 wallet.
const KKDAG_TREASURY = "kaspa:qq5yhvly6338dspa9mm24g8q6chvy6v0jww3k4dgqywh0lju5mmm5pj334ews";

// Token metadata — mirrors the KCC20 wallet's tokenColor registry
const TOKENS = {
  KAS:   { color: "#49eacb", letter: "K", name: "Kaspa" },
  KKDAG: { color: "#7aa2f7", letter: "D", name: "DD Agent Credit" },
  KRON:  { color: "#d4b07a", letter: "R", name: "KRON" },
};
function TokenLogo({ ticker, size = 22 }) {
  const t = TOKENS[ticker] || { color: "#9ece6a", letter: (ticker || "?")[0], name: ticker };
  return (
    <span className="inline-flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, background: t.color, fontSize: size * 0.5 }}>
      {t.letter}
    </span>
  );
}

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
function getKcc20Via() { try { return localStorage.getItem(KCC20_VIA_KEY); } catch { return null; } }
function setKcc20Via(v) { try { localStorage.setItem(KCC20_VIA_KEY, v); } catch {} }
function clearKcc20Via() { try { localStorage.removeItem(KCC20_VIA_KEY); } catch {} }

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
  const [kcc20Via, setKcc20Via] = useState(getKcc20Via());
  const [kcc20Input, setKcc20Input] = useState("");
  const [kcc20Detected, setKcc20Detected] = useState(isKcc20Detected());
  const [kcc20Busy, setKcc20Busy] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [exportedKey, setExportedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [kkdagBalance, setKkdagBalance] = useState(null);
  const [walletKkdag, setWalletKkdag] = useState(null); // live KKDAG from parent wallet
  const [fundAmount, setFundAmount] = useState("10");
  const [fundingStage, setFundingStage] = useState("idle"); // idle | signing | credited | error
  const [fundingMsg, setFundingMsg] = useState("");
  const [lastDeposit, setLastDeposit] = useState(null); // { amount, txid } | null
  const [hideKcc20, setHideKcc20] = useState(() => { try { return localStorage.getItem(HIDE_KCC20_KEY) === "1"; } catch { return false; } });
  const [copiedTreasury, setCopiedTreasury] = useState(false);
  const refreshTimer = useRef(null);

  // initial connect state
  useEffect(() => {
    const c = getConnected();
    if (c) { setAddress(c); setStage("connected"); refreshBalance(c); }
    setKcc20Addr(getKcc20());
    setKcc20Via(getKcc20Via());
  }, []);

  // Auto-refresh balance every 15s while connected (live balance at all times)
  useEffect(() => {
    if (!address) return;
    refreshBalance(address);
    refreshKkdag();
    refreshWalletKkdag();
    refreshTimer.current = setInterval(() => { refreshBalance(address); refreshKkdag(); refreshWalletKkdag(); }, 15000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [address]);

  const refreshBalance = (addr) => {
    if (!addr) return;
    base44.functions.invoke("getKaspaBalance", { address: addr })
      .then((res) => res?.data?.success && setBalance(res.data.balanceKAS))
      .catch(() => {});
  };

  // KKDAG credit balance — off-chain ledger in DDKKDAGWallet entity.
  // Admins get infinite credits (shown as ∞); non-admins see their real balance.
  const refreshKkdag = async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      if (me?.role === "admin") { setKkdagBalance(Infinity); return; }
      if (!me?.email) { setKkdagBalance(null); return; }
      const rows = await base44.entities.DDKKDAGWallet.filter({ user_email: me.email });
      setKkdagBalance(rows && rows[0] ? (rows[0].balance || 0) : 0);
    } catch { setKkdagBalance(null); }
  };

  // Live KKDAG balance from the parent KCC20 wallet (not an off-chain grant).
  const refreshWalletKkdag = async () => {
    if (!isEmbeddedKcc20()) { setWalletKkdag(null); return; }
    try {
      const bag = await getTokenBalanceKcc20("KKDAG");
      setWalletKkdag(bag?.balance ?? bag?.raw ?? null);
    } catch { setWalletKkdag(null); }
  };

  // Fund DD credits with REAL KKDAG — parent wallet signs the on-chain transfer.
  const fundWithKkdag = async () => {
    setErr("");
    const amt = parseFloat(fundAmount);
    if (!amt || amt <= 0) { setErr("Enter a valid KKDAG amount"); return; }
    if (!isEmbeddedKcc20()) { setErr("Open TTT from the KCC20 Wallet so the parent can sign."); return; }

    // Mainnet check
    try {
      const net = await getNetworkKcc20();
      if (net && net !== "kaspa_mainnet") { setErr("Switch to Kaspa Mainnet in the KCC20 wallet (not TN10)."); return; }
    } catch {}

    setFundingStage("signing");
    setFundingMsg("Sign in KCC20 Wallet…");
    setLastDeposit(null);
    try {
      const paid = await sendTokenKcc20({ tick: "KKDAG", amount: amt, dest: KKDAG_TREASURY });
      const txId = paid?.txId;
      if (!txId) throw new Error("No txId returned from wallet");
      const from = paid?.from || kcc20Addr || "";

      // Credit via backend (idempotent by txId)
      const me = await base44.auth.me().catch(() => null);
      if (!me?.email) throw new Error("Log in to receive DD credits");
      const res = await base44.functions.invoke("ddCreditKkdagDeposit", {
        txId, amount: amt, from, dest: KKDAG_TREASURY, user_email: me.email, tick: "KKDAG",
      });
      const d = res?.data;
      if (d?.credited > 0) {
        await refreshKkdag();
        await refreshWalletKkdag();
        setLastDeposit({ amount: d.credited, txid: txId });
        setFundingStage("credited");
        setFundingMsg(`Credited ${d.credited.toLocaleString()} KKDAG`);
      } else {
        // Already credited (idempotent replay)
        setFundingStage("credited");
        setFundingMsg(d?.message || "Already credited");
      }
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (/Buy KKDAG/i.test(msg)) setFundingMsg("Buy KKDAG on Home → Tokens first");
      else if (/reject|declin|denied|cancel/i.test(msg)) setFundingMsg("Transaction declined");
      else setFundingMsg(msg || "Funding failed");
      setFundingStage("error");
    }
  };

  const resetFunding = () => { setFundingStage("idle"); setFundingMsg(""); setLastDeposit(null); };

  const toggleHideKcc20 = () => {
    const next = !hideKcc20;
    setHideKcc20(next);
    try { localStorage.setItem(HIDE_KCC20_KEY, next ? "1" : "0"); } catch {}
  };

  const copyTreasury = () => {
    try { navigator.clipboard.writeText(KKDAG_TREASURY); setCopiedTreasury(true); setTimeout(() => setCopiedTreasury(false), 2000); } catch {}
  };

  const exportKeys = () => {
    const w = getWallet();
    if (!w?.privateKey) { setExportedKey(null); return; }
    setExportedKey({ address: w.address, privateKey: w.privateKey });
    setShowKeys(true);
  };

  const copyKey = () => {
    if (!exportedKey?.privateKey) return;
    try { navigator.clipboard.writeText(exportedKey.privateKey); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const openModal = () => {
    const c = getConnected();
    if (c) { setAddress(c); setStage("connected"); refreshBalance(c); refreshKkdag(); }
    else {
      const t = readTTT();
      setStage(t.address && t.pk ? (getStoredPinHash() ? "pin" : "setup") : "connect");
      refreshKkdag();
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

  // Run when entering the kcc20 stage: detect window.kcc20 and warm up the SDK.
  useEffect(() => {
    if (stage !== "kcc20") return;
    setErr("");
    const probe = () => setKcc20Detected(isKcc20Detected());
    probe();
    if (!isKcc20Detected()) {
      let cancelled = false;
      loadKcc20Sdk()
        .then(() => { if (!cancelled) setKcc20Detected(true); })
        .catch(() => { if (!cancelled) setKcc20Detected(false); });
      return () => { cancelled = true; };
    }
  }, [stage]);

  const connectKcc20PwaLive = async () => {
    setErr(""); setKcc20Busy(true);
    try {
      const { address } = await connectKcc20Pwa();
      setKcc20(address); setKcc20Addr(address); setKcc20Via("pwa");
      setStage("connected");
    } catch (e) {
      const msg = String(e?.message || e || "");
      if (/popup|blocked/i.test(msg)) setErr("Allow popups for tttz.xyz, then try again.");
      else if (/reject|declin|denied/i.test(msg)) setErr("Connection declined in KCC20 Wallet.");
      else setErr(msg || "Could not connect KCC20 Wallet.");
    } finally { setKcc20Busy(false); }
  };

  const linkKcc20Paste = () => {
    const v = kcc20Input.trim();
    if (!isValidKaspaAddress(v)) { setErr("Enter a valid Kaspa address"); return; }
    setKcc20(v); setKcc20Addr(v); setKcc20Via("paste");
    setErr(""); setStage("connected");
  };

  const unlinkKcc20 = async () => {
    if (getKcc20Via() === "pwa") { try { await disconnectKcc20Pwa(); } catch {} }
    clearKcc20(); clearKcc20Via();
    setKcc20Addr(null); setKcc20Via(null); setKcc20Input("");
    setStage("connected");
  };

  // Fund TTT wallet from external KCC20 wallet — copies address, opens KCC20
  const fundFromKcc20 = () => {
    if (!address) return;
    try { navigator.clipboard.writeText(address); } catch {}
    if (isInWalletIframe()) {
      // Already inside KCC20 — just copy address and alert user to send
      setErr("Address copied — use your KCC20 wallet to send KAS to this address.");
      setTimeout(() => setErr(""), 4000);
    } else {
      window.open(KCC20_APP, "_blank", "noopener");
    }
  };

  const short = (a) => a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "";

  return (
    <>
      {address ? (
        <button onClick={openModal} className="flex items-center gap-1.5 h-9 pl-1.5 pr-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition whitespace-nowrap flex-shrink-0">
          <DDLogo size={24} showWord={false} animate={false} />
          <div className="leading-tight text-left hidden sm:block">
            <p className="text-xs font-semibold text-neutral-900">{balance !== null ? `${balance.toFixed(2)} KAS` : "TTT Wallet"}</p>
            <p className="text-[10px] text-neutral-400">{short(address)}</p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        </button>
      ) : (
        <button onClick={openModal} className="flex items-center justify-center gap-1.5 h-9 px-2 sm:px-3 rounded-xl bg-neutral-900 text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition whitespace-nowrap flex-shrink-0">
          <Wallet className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">Connect TTT Wallet</span>
          <span className="hidden sm:inline lg:hidden">Connect Wallet</span>
        </button>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4" onClick={() => setOpen(false)}>
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm p-5 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DDLogo size={32} showWord={false} animate={false} />
                <h3 className="font-semibold text-neutral-900">TTT Wallet</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-900"><X className="w-4 h-4" /></button>
            </div>

            {stage === "connect" && (
              <div className="space-y-3">
                {isInWalletIframe() ? (
                  <>
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-amber-700">Running inside the KCC20 wallet frame — your main TTT wallet isn't visible here (browser storage isolation). Create a fresh local wallet below, then fund it from your KCC20 wallet.</p>
                    </div>
                    <p className="text-sm text-neutral-500">Create a new local-only TTT wallet. Keys stay on this device — export them anytime from Settings so you never lose access.</p>
                    <button onClick={doCreate} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Create new TTT wallet
                    </button>
                    <button onClick={() => setStage("pin")} className="w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300">I already have a wallet on this device</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-neutral-500">Create a new TTT wallet or connect an existing one. Keys stay on this device — export them anytime from Settings.</p>
                    <button onClick={doCreate} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Create new TTT wallet
                    </button>
                    <button onClick={() => setStage("pin")} className="w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300">I already have a TTT wallet</button>
                    <button onClick={() => setStage("kcc20")} className="w-full h-11 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 flex items-center justify-center gap-2">
                      <Link2 className="w-4 h-4" /> Connect external KCC20 wallet
                    </button>
                  </>
                )}
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
                  className="w-full h-12 text-center tracking-[0.5em] text-lg bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-neutral-400"
                />
                {err && <p className="text-xs text-red-500">{err}</p>}
                <button onClick={submitPin} disabled={busy || pin.length !== 6} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40">
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
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-neutral-400">Balance</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live" />
                  </div>
                  <p className="text-lg font-bold text-neutral-900">{balance !== null ? `${balance.toFixed(4)} KAS` : "—"}</p>
                  <p className="text-[11px] text-neutral-400 mt-1 break-all">{address}</p>
                </div>

                {/* KKDAG credit balance — DD agent compute credits */}
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TokenLogo ticker="KKDAG" size={20} />
                      <p className="text-[11px] text-neutral-400">KKDAG credits</p>
                    </div>
                    <button onClick={toggleHideKcc20} className="text-[10px] text-neutral-400 hover:text-neutral-700 underline">
                      {hideKcc20 ? "Show holdings" : "Hide holdings"}
                    </button>
                  </div>
                  <p className="text-lg font-bold text-neutral-900 mt-1">
                    {kkdagBalance === null ? "—" : kkdagBalance === Infinity ? "∞ KKDAG" : `${kkdagBalance.toLocaleString()} KKDAG`}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {kkdagBalance === Infinity ? "Admin — unlimited DD compute" : "DD agent compute credits"}
                  </p>

                  {/* Live wallet KKDAG from parent */}
                  {isEmbeddedKcc20() && !hideKcc20 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      <span className="text-[10px] text-neutral-400">Wallet KKDAG</span>
                      <span className="text-[10px] font-medium text-neutral-700">{walletKkdag ?? "—"}</span>
                    </div>
                  )}

                  {kkdagBalance !== Infinity && kkdagBalance !== null && (
                    <div className="mt-2">
                      {isEmbeddedKcc20() ? (
                        fundingStage === "idle" || fundingStage === "error" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <input type="number" min="1" step="1" value={fundAmount}
                                onChange={(e) => { setFundAmount(e.target.value); setFundingStage("idle"); setFundingMsg(""); }}
                                className="flex-1 h-9 px-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-blue-400"
                                placeholder="Amount" />
                              <button onClick={fundWithKkdag}
                                className="h-9 px-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-100 flex items-center gap-1 flex-shrink-0">
                                <Plus className="w-3.5 h-3.5" /> Fund with KKDAG
                              </button>
                            </div>
                            {fundingStage === "error" && fundingMsg && (
                              <p className="text-[10px] text-red-500">{fundingMsg}</p>
                            )}
                            {err && <p className="text-[10px] text-red-500">{err}</p>}
                          </div>
                        ) : fundingStage === "signing" ? (
                          <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <p className="text-[11px] text-blue-700 font-medium">{fundingMsg}</p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <p className="text-[11px] text-emerald-700 font-medium">{fundingMsg}</p>
                            </div>
                            {lastDeposit?.txid && (
                              <a href={`https://kaspa.stream/transactions/${lastDeposit.txid}`} target="_blank" rel="noreferrer"
                                 className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 underline">
                                <ExternalLink className="w-3 h-3" /> {lastDeposit.txid.slice(0, 12)}…
                              </a>
                            )}
                            <button onClick={resetFunding} className="text-[10px] text-neutral-500 hover:text-neutral-800 underline">Done</button>
                          </div>
                        )
                      ) : (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                          <p className="text-[10px] text-amber-700">Open TTT from the KCC20 Wallet (TTT icon) so the parent wallet can sign your KKDAG funding.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* KCC20 token holdings — KRON + KKDAG logos, toggleable */}
                {!hideKcc20 && (
                  <div className="rounded-xl border border-neutral-200 p-3">
                    <p className="text-[11px] text-neutral-400 mb-2">KCC20 holdings</p>
                    <div className="flex items-center gap-2">
                      <TokenLogo ticker="KRON" size={24} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900">KRON</p>
                        <p className="text-[10px] text-neutral-400">Kaspa DEX token</p>
                      </div>
                      <span className="text-xs text-neutral-400">—</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <TokenLogo ticker="KKDAG" size={24} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900">KKDAG</p>
                        <p className="text-[10px] text-neutral-400">DD agent credit</p>
                      </div>
                      <span className="text-xs text-neutral-400">{walletKkdag ?? (kkdagBalance === Infinity ? "∞" : kkdagBalance ?? "—")}</span>
                    </div>
                  </div>
                )}

                {/* KKDAG treasury — where KKDAG transfers are sent */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3 h-3 text-neutral-500" />
                    <p className="text-[11px] font-medium text-neutral-600">KKDAG treasury</p>
                  </div>
                  <p className="text-[10px] text-neutral-400 break-all">{KKDAG_TREASURY}</p>
                  <button onClick={copyTreasury} className="text-[10px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 mt-1">
                    {copiedTreasury ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy address</>}
                  </button>
                </div>

                {/* Fund from KCC20 — triggers real KKDAG transfer via parent wallet */}
                {isInWalletIframe() && (
                  <div className="space-y-2">
                    {fundingStage === "idle" || fundingStage === "error" ? (
                      <div className="flex items-center gap-1.5">
                        <input type="number" min="1" step="1" value={fundAmount}
                          onChange={(e) => { setFundAmount(e.target.value); setFundingStage("idle"); setFundingMsg(""); }}
                          className="flex-1 h-10 px-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-violet-400"
                          placeholder="KKDAG amount" />
                        <button onClick={fundWithKkdag}
                          className="h-10 px-3 rounded-xl bg-violet-600 border border-violet-600 text-sm font-medium text-white hover:bg-violet-700 flex items-center gap-1.5 flex-shrink-0">
                          <ArrowDownToLine className="w-4 h-4" /> Fund from KCC20
                        </button>
                      </div>
                    ) : fundingStage === "signing" ? (
                      <div className="w-full h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                        <span className="text-sm text-violet-700 font-medium">{fundingMsg}</span>
                      </div>
                    ) : (
                      <div className="w-full rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-emerald-700 font-medium">{fundingMsg}</span>
                        </div>
                        {lastDeposit?.txid && (
                          <a href={`https://kaspa.stream/transactions/${lastDeposit.txid}`} target="_blank" rel="noreferrer"
                             className="text-[11px] text-violet-600 hover:text-violet-800 flex items-center gap-1 underline">
                            <ExternalLink className="w-3 h-3" /> {lastDeposit.txid.slice(0, 12)}…
                          </a>
                        )}
                        <button onClick={resetFunding} className="text-[11px] text-neutral-500 hover:text-neutral-800 underline">Done</button>
                      </div>
                    )}
                    {fundingStage === "error" && fundingMsg && (
                      <p className="text-[11px] text-red-500">{fundingMsg}</p>
                    )}
                  </div>
                )}

                {/* Export keys */}
                <button onClick={exportKeys} className="w-full h-10 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Export keys
                </button>
                {showKeys && exportedKey && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-amber-700 font-medium">Store this private key safely. Anyone with it controls your funds. You'll need it to recover this wallet on another device.</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowKeys(!showKeys)} className="text-[11px] text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                        {showKeys ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                      </button>
                      <button onClick={copyKey} className="text-[11px] text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                        {copied ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    {showKeys && (
                      <p className="text-[10px] font-mono text-neutral-800 break-all bg-white border border-neutral-200 rounded-lg p-2 select-all">{exportedKey.privateKey}</p>
                    )}
                    <p className="text-[10px] text-neutral-400 break-all">Address: {exportedKey.address}</p>
                  </div>
                )}

                {/* KCC20 Scorpion external wallet */}
                {kcc20Addr ? (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-neutral-700" />
                      <span className="text-sm font-semibold text-neutral-800">
                        {kcc20Via === "pwa" ? "KCC20 PWA connected" : "KCC20 linked (read-only)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1 break-all">{kcc20Addr}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={unlinkKcc20} className="text-[11px] text-neutral-600 hover:underline">Unlink</button>
                      {!isInWalletIframe() && (
                        <a href={KCC20_APP} target="_blank" rel="noreferrer" className="text-[11px] text-neutral-600 hover:underline flex items-center gap-1">
                          Open wallet <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  isInWalletIframe() && (
                    <button onClick={connectKcc20PwaLive} className="w-full h-10 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 flex items-center justify-center gap-2">
                      <Link2 className="w-4 h-4" /> Link KCC20 wallet
                    </button>
                  )
                )}

                <button onClick={disconnect} className="w-full h-10 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-2">
                  <Unlink className="w-4 h-4" /> Disconnect wallet
                </button>
              </div>
            )}

            {stage === "kcc20" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-neutral-700" /><h4 className="font-semibold text-neutral-900 text-sm">Connect KCC20 wallet</h4></div>

                {/* Detect chip */}
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${kcc20Detected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-500"}`}>
                  <span className={`w-2 h-2 rounded-full ${kcc20Detected ? "bg-emerald-500" : "bg-neutral-400 animate-pulse"}`} />
                  {kcc20Detected ? `Detected · ${KCC20_ORIGIN.replace("https://", "")}` : "Loading KCC20 sdk…"}
                </div>

                <p className="text-sm text-neutral-500">Connect the hosted KCC20 wallet PWA. A popup opens to {KCC20_ORIGIN.replace("https://", "")} — approve there. Keys never enter TTT.</p>

                {err && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{err}</span>
                  </div>
                )}

                <button onClick={connectKcc20PwaLive} disabled={kcc20Busy} className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 flex items-center justify-center gap-2">
                  {kcc20Busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  {kcc20Busy ? "Connecting…" : "Sign with KCC20 wallet"}
                </button>

                {!isInWalletIframe() && (
                  <a href={KCC20_APP} target="_blank" rel="noreferrer" className="w-full h-10 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-neutral-300 flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Open KCC20 wallet
                  </a>
                )}

                <div className="pt-1">
                  <p className="text-[11px] text-neutral-400 mb-1.5">Or paste an address as read-only (cannot sign):</p>
                  <input value={kcc20Input} onChange={(e) => { setKcc20Input(e.target.value); setErr(""); }} placeholder="kaspa:qz… (your KCC20 address)" className="w-full h-11 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-violet-400" />
                  <button onClick={linkKcc20Paste} disabled={!kcc20Input.trim()} className="w-full h-10 mt-2 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-violet-300 disabled:opacity-40">Link address only</button>
                </div>

                <button onClick={() => setStage("connected")} className="w-full text-xs text-neutral-400 hover:text-neutral-700">Back</button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
              <Shield className="w-3 h-3" /> Keys & PIN stay on this device
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}