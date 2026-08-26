import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Wallet, Loader2, Send, RefreshCw, CheckCircle2, AlertTriangle,
  Radio, ArrowDownToLine, Zap, Coins, TrendingUp, TrendingDown, Info, ExternalLink,
} from "lucide-react";
import { useKcc20Wallet, shortKaspaAddress, formatKas } from "@/lib/useKcc20Wallet";
import {
  sendTokenKcc20, getTokenBalanceKcc20, buyKronKcc20, sellKronKcc20,
  quoteKronKcc20, getKcc20SdkVersion,
} from "@/lib/kcc20Pwa";
import { base44 } from "@/api/base44Client";

// DD treasury that receives KKDAG funding. Full kaspa: address.
const TREASURY = "kaspa:qrec7c0zgp9shxht4hx0jz6e0w3q0y6e0w3q0y6e0w3q0y6e0";

function explorerHref(txId, explorer) {
  if (explorer) return explorer;
  if (!txId) return "#";
  return `https://kaspastream.com/tx/${txId}`;
}

export default function Kcc20TestPage() {
  const { address, kas, loading, connect, disconnect, refreshState } = useKcc20Wallet();

  // KRON trade inputs
  const [tick, setTick] = useState("KKDAG");
  const [buyKas, setBuyKas] = useState("10");   // KAS to spend
  const [sellAmt, setSellAmt] = useState("1");   // token amount to sell

  // Live bag for the entered tick
  const [bag, setBag] = useState(null);
  const [bagLoading, setBagLoading] = useState(false);

  // Quote preview (optional)
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Action states
  const [buying, setBuying] = useState(false);
  const [selling, setSelling] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundAmt, setFundAmt] = useState("1000");

  // Results
  const [buyRes, setBuyRes] = useState(null);
  const [sellRes, setSellRes] = useState(null);
  const [fundRes, setFundRes] = useState(null);
  const [buyErr, setBuyErr] = useState("");
  const [sellErr, setSellErr] = useState("");
  const [fundErr, setFundErr] = useState("");

  // SDK version
  const [sdkV, setSdkV] = useState(null);

  // Payment detection (reads explorer via backend — no wallet popup)
  const [incoming, setIncoming] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [lastDetect, setLastDetect] = useState(null);

  const detectPayments = useCallback(async () => {
    if (!address) { setIncoming([]); return; }
    setDetecting(true);
    try {
      const res = await base44.functions.invoke("getKaspaTransactionHistory", { address });
      const txs = res?.transactions || [];
      setIncoming(txs.filter(t => t.direction === "received" || t.received).slice(0, 8));
      setLastDetect(new Date().toLocaleTimeString());
    } catch { /* non-fatal */ } finally { setDetecting(false); }
  }, [address]);

  // Read-only bag refresh. getTokenBalance does NOT open a popup.
  const refreshBag = useCallback(async () => {
    if (!address || !tick) { setBag(null); return; }
    setBagLoading(true);
    try {
      const r = await getTokenBalanceKcc20(tick);
      const val = r?.balance ?? r?.raw ?? r?.value ?? r?.amount ?? null;
      setBag(val);
    } catch { setBag(null); } finally { setBagLoading(false); }
  }, [address, tick]);

  useEffect(() => { detectPayments(); }, [address, detectPayments]);
  useEffect(() => {
    const iv = setInterval(() => { detectPayments(); refreshState?.(); }, 15000);
    return () => clearInterval(iv);
  }, [detectPayments, refreshState]);

  // Refresh the live bag when address or tick changes (read-only, no popup).
  useEffect(() => { refreshBag(); }, [address, tick, refreshBag]);
  useEffect(() => { setSdkV(getKcc20SdkVersion()); }, [address]);

  const sdkOk = sdkV != null && Number(String(sdkV)) >= 167;

  // ── Click-only wallet actions ──
  const onConnect = async () => { try { await connect(); } catch {} };
  const onDisconnect = () => { disconnect(); };

  const onBuy = async () => {
    setBuyErr(""); setBuyRes(null);
    if (!address) { setBuyErr("Connect your KCC20 wallet first."); return; }
    if (!tick) { setBuyErr("Enter a KRON tick (e.g. KKDAG)."); return; }
    if (!buyKas || Number(buyKas) <= 0) { setBuyErr("Enter KAS amount to spend."); return; }
    setBuying(true);
    try {
      const res = await buyKronKcc20({ tick, amount: buyKas });
      setBuyRes(res);
      refreshBag(); refreshState?.();
    } catch (e) {
      setBuyErr(e?.message || "Buy rejected by KCC20");
    } finally { setBuying(false); }
  };

  const onSell = async () => {
    setSellErr(""); setSellRes(null);
    if (!address) { setSellErr("Connect your KCC20 wallet first."); return; }
    if (!tick) { setSellErr("Enter a KRON tick."); return; }
    if (!sellAmt || Number(sellAmt) <= 0) { setSellErr("Enter token amount to sell."); return; }
    setSelling(true);
    try {
      const res = await sellKronKcc20({ tick, amount: sellAmt });
      setSellRes(res);
      refreshBag(); refreshState?.();
    } catch (e) {
      setSellErr(e?.message || "Sell rejected by KCC20");
    } finally { setSelling(false); }
  };

  const onQuote = async () => {
    setQuoteLoading(true);
    try {
      const q = await quoteKronKcc20({ tick, side: "buy", amount: buyKas });
      setQuote(q);
    } catch { setQuote(null); /* skip — Sign sheet still quotes */ }
    finally { setQuoteLoading(false); }
  };

  const onFund = async () => {
    setFundErr(""); setFundRes(null);
    if (!address) { setFundErr("Connect your KCC20 wallet first."); return; }
    if (!fundAmt || Number(fundAmt) <= 0) { setFundErr("Enter a KKDAG amount."); return; }
    setFunding(true);
    try {
      const res = await sendTokenKcc20({ tick: "KKDAG", amount: fundAmt, dest: TREASURY.replace(/^kaspa:/, "") });
      setFundRes(res);
      refreshState?.(); detectPayments();
    } catch (e) {
      setFundErr(e?.message || "Funding rejected by KCC20");
    } finally { setFunding(false); }
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
              <button onClick={onDisconnect} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full ring-1 ring-red-500/30 hover:bg-red-500/10">
                Disconnect
              </button>
            ) : (
              <button onClick={onConnect} disabled={loading} className="flex items-center gap-1.5 text-xs font-semibold bg-white text-black px-3.5 py-1.5 rounded-full hover:bg-white/90 disabled:opacity-60">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                Connect
              </button>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-wide font-semibold">Balance</div>
              <div className="text-3xl font-[800] tracking-tight mt-0.5">{address ? formatKas(kas) : "0.000"} <span className="text-lg text-white/50">KAS</span></div>
            </div>
            <button onClick={() => refreshState?.()} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/5" title="Refresh KAS">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full font-mono ${sdkOk ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30"}`}>
              SDK v{sdkV ?? "—"}
            </span>
            {!sdkOk && (
              <span className="text-amber-300/80 flex items-center gap-1">
                <Info className="w-3 h-3" /> Need v167+ for Buy KRON — hard-refresh.
              </span>
            )}
          </div>
        </div>

        {/* KRON Trade */}
        <div className="rounded-3xl bg-zinc-900/60 ring-1 ring-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-cyan-300" />
            <h2 className="text-[15px] font-semibold">KRON Trade</h2>
            <span className="text-[11px] text-white/30">Home TRADE swap via KCC20</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Token (KRON tick)</label>
              <input value={tick} onChange={(e) => setTick(e.target.value.toUpperCase())} placeholder="KKDAG" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
            </div>

            {/* Live bag */}
            <div className="flex items-center justify-between rounded-xl bg-black/40 ring-1 ring-white/5 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-white/40" />
                <span className="text-white/50">Your {tick || "—"} bag</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white/90">
                  {bagLoading ? "…" : (bag != null ? String(bag) : "—")}
                </span>
                <button onClick={refreshBag} disabled={!address} className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/5 disabled:opacity-40">
                  <RefreshCw className={`w-3.5 h-3.5 ${bagLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Buy — KAS to spend</label>
                <input value={buyKas} onChange={(e) => setBuyKas(e.target.value)} inputMode="decimal" placeholder="10" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Sell — token amount</label>
                <input value={sellAmt} onChange={(e) => setSellAmt(e.target.value)} inputMode="decimal" placeholder="1" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
              </div>
            </div>

            {buyErr && <ErrorLine msg={buyErr} />}
            {sellErr && <ErrorLine msg={sellErr} />}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={onBuy} disabled={!address || buying} className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                {buying ? "Sign in KCC20…" : "Buy KRON"}
              </button>
              <button onClick={onSell} disabled={!address || selling} className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/10 ring-1 ring-white/15 text-white font-semibold text-sm hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {selling ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                {selling ? "Sign in KCC20…" : "Sell KRON"}
              </button>
            </div>

            <button onClick={onQuote} disabled={!address || quoteLoading} className="w-full text-[12px] text-white/50 hover:text-white/80 flex items-center justify-center gap-1.5 py-1 disabled:opacity-40">
              {quoteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Info className="w-3.5 h-3.5" />}
              {quoteLoading ? "Quoting…" : "Preview quote (optional)"}
            </button>
            {quote && (
              <div className="rounded-xl bg-black/40 ring-1 ring-white/5 px-3.5 py-2.5 text-[12px] font-mono text-white/70 break-all">
                {JSON.stringify(quote)}
              </div>
            )}

            <p className="text-[11px] text-white/30 text-center">Buy/Sell open KCC20 to quote &amp; PIN-sign. TTT never sees your PIN or keys. No signPskt — Nilla builds the PSKT.</p>
          </div>

          <ResultCard res={buyRes} label="Buy submitted" />
          <ResultCard res={sellRes} label="Sell submitted" />
        </div>

        {/* Fund DD */}
        <div className="rounded-3xl bg-zinc-900/60 ring-1 ring-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-cyan-300" />
            <h2 className="text-[15px] font-semibold">Fund DD (KKDAG)</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-white/40 font-medium uppercase tracking-wide">KKDAG amount</label>
              <input value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} inputMode="decimal" placeholder="1000" className="mt-1 w-full bg-black/50 ring-1 ring-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-cyan-400/50 outline-none" />
            </div>
            <div className="text-[11px] text-white/30 font-mono break-all">→ {TREASURY}</div>
            {fundErr && <ErrorLine msg={fundErr} />}
            <button onClick={onFund} disabled={!address || funding} className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {funding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {funding ? "Sign in KCC20…" : "Fund DD"}
            </button>
          </div>
          <ResultCard res={fundRes} label="Funding submitted" />
        </div>

        {/* Payment detection */}
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
    </div>
  );
}

function ErrorLine({ msg }) {
  return (
    <div className="flex items-start gap-1.5 text-red-400 text-xs">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

function ResultCard({ res, label }) {
  if (!res) return null;
  const txId = res?.txId || res?.txid || res?.id;
  const href = explorerHref(txId, res?.explorer);
  return (
    <div className="mt-3 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/30 p-4">
      <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold mb-1">
        <CheckCircle2 className="w-4 h-4" />
        {label}
      </div>
      {txId && (
        <a href={href} target="_blank" rel="noreferrer" className="text-[12px] font-mono text-emerald-200/80 underline break-all inline-flex items-center gap-1">
          {txId} <ExternalLink className="w-3 h-3 inline" />
        </a>
      )}
      {res?.quote && (
        <div className="mt-1 text-[11px] font-mono text-emerald-200/60 break-all">{JSON.stringify(res.quote)}</div>
      )}
    </div>
  );
}