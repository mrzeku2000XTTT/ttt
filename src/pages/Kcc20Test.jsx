import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wallet, Loader2, Send, RefreshCw, CheckCircle2, AlertTriangle, Radio, ArrowDownToLine } from "lucide-react";
import { useKcc20Wallet, shortKaspaAddress, formatKas } from "@/lib/useKcc20Wallet";
import { sendTokenKcc20 } from "@/lib/kcc20Pwa";
import { base44 } from "@/api/base44Client";
import Kcc20PinModal from "@/components/kcc20/Kcc20PinModal";

const TREASURY = "kaspa:qrec7c0zgp9shxht4hx0jz6e0w3q0y6e0w3q0y6e0w3q0y6e0"; // demo dest

export default function Kcc20TestPage() {
  const { address, balance, loading, connect, disconnect, refreshBalance } = useKcc20Wallet();
  const [tick, setTick] = useState("KKDAG");
  const [amount, setAmount] = useState("1");
  const [dest, setDest] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [payErr, setPayErr] = useState("");
  const [incoming, setIncoming] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [lastDetect, setLastDetect] = useState(null);

  // Detect incoming payments for the connected address via Kaspa explorer.
  const detectPayments = useCallback(async () => {
    if (!address) { setIncoming([]); return; }
    setDetecting(true);
    try {
      const res = await base44.functions.invoke("getKaspaTransactionHistory", { address });
      const txs = res?.transactions || [];
      const recd = txs.filter(t => t.direction === "received" || t.received).slice(0, 8);
      setIncoming(recd);
      setLastDetect(new Date().toLocaleTimeString());
    } catch {
      // non-fatal
    } finally {
      setDetecting(false);
    }
  }, [address]);

  useEffect(() => { detectPayments(); }, [address, detectPayments]);
  useEffect(() => {
    const iv = setInterval(() => { detectPayments(); refreshBalance?.(); }, 15000);
    return () => clearInterval(iv);
  }, [detectPayments, refreshBalance]);

  const openPay = () => {
    setPayErr("");
    setResult(null);
    if (!address) { setPayErr("Connect your KCC20 wallet first."); return; }
    if (!dest.trim()) { setPayErr("Enter a destination address."); return; }
    if (!amount || Number(amount) <= 0) { setPayErr("Enter an amount."); return; }
    setPinOpen(true);
  };

  const onPinSubmit = async (_pin) => {
    setSending(true);
    setPayErr("");
    try {
      // Create + sign + broadcast via the KCC20 wallet. TTT never sees keys.
      const res = await sendTokenKcc20({ tick, amount, dest: dest.replace(/^kaspa:/, "") });
      setResult(res);
      setPinOpen(false);
      refreshBalance?.();
      detectPayments();
    } catch (e) {
      setPayErr(e?.message || "Transaction rejected by KCC20");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-14 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/70 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Store</span>
        </Link>
        <span className="text-[15px] font-[800] tracking-tight">KCC20 Test</span>
        <div className="w-16" />
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Wallet card */}
        <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-black ring-1 ring-white/10 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/30 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-white/40 font-semibold">KCC20 · Scorpion</div>
                <div className="text-sm font-mono text-white/80">{address ? shortKaspaAddress(address) : "not connected"}</div>
              </div>
            </div>
            {address ? (
              <button onClick={disconnect} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full ring-1 ring-red-500/30 hover:bg-red-500/10">
                Disconnect
              </button>
            ) : (
              <button onClick={connect} disabled={loading} className="flex items-center gap-1.5 text-xs font-semibold bg-white text-black px-3.5 py-1.5 rounded-full hover:bg-white/90 disabled:opacity-60">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                Connect
              </button>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-wide font-semibold">Balance</div>
              <div className="text-3xl font-[800] tracking-tight mt-0.5">{address ? formatKas(balance) : "0.000"} <span className="text-lg text-white/50">KAS</span></div>
            </div>
            <button onClick={() => refreshBalance?.()} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/5" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create + sign a transaction */}
        <div className="rounded-3xl bg-zinc-900/60 ring-1 ring-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-cyan-300" />
            <h2 className="text-[15px] font-semibold">Create & Sign Transaction</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Token (KCC20 tick)</label>
              <input value={tick} onChange={(e) => setTick(e.target.value)} placeholder="KKDAG" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Destination address</label>
              <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="kaspa:qz…" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
            </div>
            {payErr && (
              <div className="flex items-start gap-1.5 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{payErr}</span>
              </div>
            )}
            <button onClick={openPay} disabled={!address || sending} className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Pay with KCC20
            </button>
            <p className="text-[11px] text-white/30 text-center">You'll enter your wallet PIN, then KCC20 signs & broadcasts. TTT never sees your keys.</p>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/30 p-4">
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Transaction submitted
            </div>
            {result?.txId && (
              <a href={`https://kaspastream.com/tx/${result.txId}`} target="_blank" rel="noreferrer" className="text-[12px] font-mono text-emerald-200/80 underline break-all">
                {result.txId}
              </a>
            )}
          </div>
        )}

        {/* Detect payments */}
        <div className="rounded-3xl bg-zinc-900/60 ring-1 ring-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${detecting ? "text-cyan-300 animate-pulse" : "text-white/40"}`} />
              <h2 className="text-[15px] font-semibold">Payment Detection</h2>
            </div>
            <button onClick={detectPayments} className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/5">
              <RefreshCw className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} />
            </button>
          </div>
          {!address ? (
            <p className="text-white/40 text-sm">Connect your wallet to detect incoming payments.</p>
          ) : incoming.length === 0 ? (
            <p className="text-white/40 text-sm">No incoming payments detected{lastDetect ? ` (checked ${lastDetect})` : ""}.</p>
          ) : (
            <div className="space-y-2">
              {incoming.map((t, i) => (
                <div key={t.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 ring-1 ring-white/5">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-mono truncate">{t.id || t.txId || "—"}</div>
                    <div className="text-[11px] text-white/40">{t.timestamp || t.blockTime || ""}</div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-400">+{formatKas(t.amount || t.value)} KAS</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Kcc20PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSubmit={onPinSubmit}
        title="Enter KCC20 PIN"
        subtitle={`Confirm to send ${amount} ${tick} from your KCC20 wallet`}
      />
    </div>
  );
}