import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Radio, TrendingUp, TrendingDown, Wallet, RefreshCw, ExternalLink,
  Copy, Check, Eye, EyeOff, Brain, Loader2, Zap, Send, Coins, Activity, LineChart as LineChartIcon,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsTradingViewChart from "@/components/kaspakids/KidsTradingViewChart";
import KidsMarketSentiment from "@/components/kaspakids/KidsMarketSentiment";
import KidsAcademy from "@/components/kaspakids/KidsAcademy";

const MASCOT_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const TESTNET_FAUCET_URL = "https://faucet.kaspanet.io/";
const WALLET_LS = "kaspakids_dex_wallet_v1";

export default function KaspaKidsDEXPage() {
  const [wallet, setWallet] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [realBalance, setRealBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(0);
  const [priceSrc, setPriceSrc] = useState("");
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [liveTxs, setLiveTxs] = useState([]);

  const [sentiment, setSentiment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [autoFollow, setAutoFollow] = useState(false);
  const [aiLog, setAiLog] = useState([]);

  const [sendForm, setSendForm] = useState({ to: "", amount: "0.1" });
  const [sending, setSending] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [chartSymbol, setChartSymbol] = useState("KASPAUSD");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WALLET_LS);
      if (raw) {
        const w = JSON.parse(raw);
        setWallet(w);
        fetchBalance(w.address);
      }
    } catch {}
  }, []);

  const pushLog = useCallback((text) => {
    setAiLog((l) => [{ text, t: Date.now() }, ...l].slice(0, 30));
  }, []);

  // ---- REAL TESTNET WALLET ----
  const generateWallet = async () => {
    setGenerating(true);
    pushLog("🪄 Generating real Kaspa testnet wallet…");
    try {
      const w = await base44.functions.invoke("createKaspaWallet", { wordCount: 12 });
      const wd = w.data || w;
      if (!wd?.address) throw new Error("No address returned");
      const conv = await base44.functions.invoke("slobzTestnetSend", { action: "convert", address: wd.address });
      const cd = conv.data || conv;
      if (!cd?.testnetAddress) throw new Error("Testnet conversion failed");
      const newWallet = { address: wd.address, testnetAddress: cd.testnetAddress, mnemonic: wd.mnemonic, privateKey: wd.privateKey };
      setWallet(newWallet);
      try { localStorage.setItem(WALLET_LS, JSON.stringify(newWallet)); } catch {}
      setRealBalance(0);
      pushLog("🪪 Real testnet wallet ready: " + cd.testnetAddress.slice(0, 18) + "…");
      pushLog("💧 Fund it from the faucet, then Refresh to see real TKAS.");
      fetchBalance(wd.address);
    } catch (e) {
      pushLog("⚠️ Wallet creation failed: " + (e?.message || "unknown"));
    } finally {
      setGenerating(false);
    }
  };

  const fetchBalance = useCallback(async (addr) => {
    const address = addr || wallet?.address;
    if (!address) return;
    setBalanceLoading(true);
    try {
      const res = await base44.functions.invoke("slobzTestnetSend", { action: "balance", address });
      const d = res.data || res;
      if (d?.balanceTkas !== undefined) {
        setRealBalance(d.balanceTkas || 0);
        if (d.testnetAddress) setWallet((w) => w ? { ...w, testnetAddress: d.testnetAddress } : w);
      }
    } catch { setRealBalance(0); }
    finally { setBalanceLoading(false); }
  }, [wallet]);

  const fundWallet = () => {
    if (!wallet?.testnetAddress) return;
    navigator.clipboard?.writeText(wallet.testnetAddress).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    pushLog("💧 Opened faucet — address copied. Paste it, get free TKAS, then Refresh.");
    window.open(TESTNET_FAUCET_URL, "_blank", "noopener");
  };
  const copyAddress = () => {
    if (!wallet?.testnetAddress) return;
    navigator.clipboard?.writeText(wallet.testnetAddress).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  // ---- REAL-TIME PRICE ----
  const fetchPrice = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getKaspaPrice", {});
      const d = res.data || res;
      if (d?.success && d.price) {
        setPrice(d.price); setChange24h(d.change24h || 0); setPriceSrc(d.source || "");
        setLastPriceUpdate(new Date().toLocaleTimeString());
      }
    } catch {}
  }, []);
  const fetchLiveTxs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getLiveKaspaTransactions", {});
      const d = res.data || res;
      const list = Array.isArray(d) ? d : d?.transactions || d?.data || [];
      if (Array.isArray(list)) setLiveTxs(list.slice(0, 6));
    } catch {}
  }, []);

  useEffect(() => {
    fetchPrice(); fetchLiveTxs();
    const p = setInterval(fetchPrice, 20000);
    const t = setInterval(fetchLiveTxs, 20000);
    return () => { clearInterval(p); clearInterval(t); };
  }, [fetchPrice, fetchLiveTxs]);

  // ---- REAL AI MARKET ANALYSIS ----
  const analyzeMarket = async () => {
    setAnalyzing(true);
    try {
      const prompt = `You are Slobby AI, a kid-friendly crypto trading coach for Kaspa (KAS).
Current REAL Kaspa price: $${price ?? "unknown"}. 24h change: ${change24h?.toFixed(2) ?? 0}%. Source: ${priceSrc}.
Analyze the REAL-TIME Kaspa market using live news and price action. Decide if a trader should BUY, SELL, or HOLD real TKAS now.
Keep it simple, warm, educational (12-year-old level). This is NOT financial advice — it's a testnet learning game.
Return a sentiment score (-100 bearish to +100 bullish), an action, a confidence %, a one-sentence kid reason, and a one-sentence news summary.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt, add_context_from_internet: true, model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
            score: { type: "number" }, action: { type: "string", enum: ["buy", "sell", "hold"] },
            confidence: { type: "number" }, reason: { type: "string" }, news_summary: { type: "string" },
          },
          required: ["sentiment", "score", "action", "reason"],
        },
      });
      const s = res.data || res;
      setSentiment(s); setLastRun(new Date().toLocaleTimeString());
      pushLog(`🧠 AI: ${s.action?.toUpperCase()} · ${s.sentiment} (${s.score > 0 ? "+" : ""}${s.score})`);
      if (autoFollow) executeAiTrade(s);
    } catch { pushLog("⚠️ AI analysis failed — try again"); }
    finally { setAnalyzing(false); }
  };

  // ---- REAL ON-CHAIN AI TRADE (testnet self-send = verifiable, safe) ----
  const executeAiTrade = async (s) => {
    if (!wallet || !s || s.action === "hold") return;
    if ((realBalance ?? 0) <= 0) { pushLog("🤖 AI: no TKAS to trade — fund the wallet first 💧"); return; }
    const amt = Math.min(0.1, Math.max(0.01, Number(realBalance) * 0.05)).toFixed(4);
    pushLog(`🤖 AI wants to ${s.action.toUpperCase()} — executing real testnet trade…`);
    await sendTkas(wallet.testnetAddress, amt, true);
  };

  // ---- REAL TESTNET TKAS SEND ----
  const sendTkas = async (toOverride, amountOverride, fromAi = false) => {
    if (!wallet) return;
    const to = (toOverride || sendForm.to || wallet.testnetAddress).trim();
    const amount = amountOverride || sendForm.amount;
    if (!to || !amount) { pushLog("⚠️ Enter a destination address and amount"); return; }
    setSending(true);
    try {
      const res = await base44.functions.invoke("slobzTestnetSend", {
        action: "send", mnemonic: wallet.mnemonic, fromAddress: wallet.address, toAddress: to, amountKas: String(amount),
      });
      const d = res.data || res;
      if (!d?.success) throw new Error(d?.error || "send failed");
      setLastTx(d.txId);
      pushLog(`${fromAi ? "🤖 AI" : "📤 You"} sent ${amount} TKAS · tx ${String(d.txId).slice(0, 14)}…`);
      setTimeout(() => fetchBalance(wallet.address), 4000);
    } catch (e) {
      pushLog("⚠️ Send failed: " + (e?.message || "unknown") + " (fund the wallet first)");
    } finally { setSending(false); }
  };

  // ---- Welcome / wallet creation screen ----
  if (!wallet) {
    return (
      <div className="relative min-h-screen bg-[#14101f] overflow-hidden font-body flex items-center justify-center px-5">
        <SlobzBlobs />
        <div className="relative z-10 max-w-md w-full text-center text-[#EDE9F7]">
          <motion.img src={MASCOT_IMG} alt="Slobby" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 rounded-[28px] object-cover shadow-[0_16px_40px_rgba(124,92,252,0.4)] mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B6FF5]/20 border border-[#8B6FF5]/40 text-[#8B6FF5] text-[10px] font-display font-extrabold tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4] animate-pulse" /> PRO · REAL TESTNET
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight mb-2">Slobz Pro DEX</h1>
          <p className="text-[#B9A8F5] text-sm mb-6 leading-relaxed">
            The real terminal. You'll get a <b>real Kaspa testnet wallet</b> with real <b>TKAS</b> (free test coins), live TradingView charts, real AI market sentiment, and an AI that can execute <b>real on-chain testnet trades</b>. Still free — but real.
          </p>
          <button onClick={generateWallet} disabled={generating}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-lg shadow-[0_12px_28px_rgba(249,107,76,0.4)] disabled:opacity-60">
            {generating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Making your wallet…</> : <><Wallet className="w-5 h-5" /> Create My Real Testnet Wallet</>}
          </button>
          <Link to="/KaspaKids" className="inline-flex items-center gap-1.5 mt-4 text-[#7A7290] hover:text-[#EDE9F7] text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to the safe Playground first
          </Link>
          <div className="mt-6 max-h-32 overflow-y-auto text-left space-y-1">
            {aiLog.map((e, i) => <div key={i} className="text-[11px] text-[#7A7290]">{e.text}</div>)}
          </div>
        </div>
      </div>
    );
  }

  const priceUp = change24h >= 0;

  return (
    <div className="relative h-screen overflow-hidden bg-[#14101f] text-[#EDE9F7] font-body flex flex-col">
      <SlobzBlobs />
      {/* TOP BAR */}
      <div className="relative z-20 flex items-center gap-3 h-14 px-3 sm:px-5 border-b border-[#2d2542] bg-[#14101f]/85 backdrop-blur-xl flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/KaspaKids" className="flex items-center gap-1.5 text-[#B9A8F5] hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Exit</span>
        </Link>
        <div className="flex items-center gap-2 font-display font-black text-[#8B6FF5]">🟣 <span className="hidden sm:inline">Slobz Pro DEX</span></div>
        {/* Live KAS ticker */}
        <div className="flex items-center gap-2 ml-1 sm:ml-3 px-3 py-1.5 rounded-xl bg-[#1f1a2e] border border-[#2d2542]">
          <Radio className="w-3.5 h-3.5 text-[#5CE1A4] animate-pulse" />
          <span className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold">KAS</span>
          <span className="font-display font-black text-sm text-white">${price ? price.toFixed(5) : "…"}</span>
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${priceUp ? "text-green-400" : "text-red-400"}`}>
            {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(change24h).toFixed(2)}%
          </span>
        </div>
        {/* Real TKAS balance */}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => fetchBalance()} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1f1a2e] border border-[#2d2542] text-[#B9A8F5] text-xs font-display font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{realBalance ?? 0}</span> <span className="text-[10px] text-[#7A7290]">TKAS</span>
          </button>
          <button onClick={fundWallet} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold">
            <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Fund</span>
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr_330px] gap-2 p-2 overflow-hidden">
        {/* LEFT: wallet + academy */}
        <div className="hidden lg:flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide">
          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-[#8B6FF5]" />
              <span className="font-display font-bold text-sm">Real Testnet Wallet</span>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-[#5CE1A4] font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4] animate-pulse" /> TN-10</span>
            </div>
            <div className="font-mono text-[10px] text-[#B9A8F5] break-all leading-snug">{wallet.testnetAddress}</div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <div className="text-2xl font-display font-black text-white">{realBalance ?? 0}</div>
                <div className="text-[9px] text-[#7A7290] uppercase tracking-widest font-bold">TKAS · real on-chain</div>
              </div>
              <button onClick={copyAddress} className="h-8 w-8 rounded-lg bg-[#241E33] border border-[#3d3258] flex items-center justify-center text-[#B9A8F5]">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => setShowSeed((s) => !s)} className="mt-2 flex items-center gap-1 text-[10px] text-[#7A7290] hover:text-[#EDE9F7]">
              {showSeed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSeed ? "Hide" : "Reveal"} seed
            </button>
            {showSeed && <div className="mt-2 p-3 rounded-xl bg-[#0f0a1a] border border-red-500/30 text-[10px] font-mono text-red-200/70 break-all">{wallet.mnemonic}</div>}
          </div>
          <KidsAcademy />
        </div>

        {/* CENTER: chart + AI strip + real trade terminal */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-[#2d2542] bg-[#1f1a2e]">
            <div className="flex items-center gap-2 px-3 h-9 border-b border-[#2d2542] bg-[#1f1a2e]">
              <LineChartIcon className="w-3.5 h-3.5 text-[#8B6FF5]" />
              <span className="text-xs font-display font-bold">KASPAUSD · Live</span>
              <span className="ml-auto text-[9px] text-[#7A7290]">Powered by TradingView</span>
            </div>
            <div className="h-[calc(100%-2.25rem)]">
              <KidsTradingViewChart symbol={chartSymbol} theme="dark" />
            </div>
          </div>

          {/* AI signal strip */}
          <div className="rounded-2xl bg-gradient-to-r from-[#241E33] to-[#1f1a2e] border border-[#8B6FF5]/30 p-3 flex items-center gap-3 flex-shrink-0">
            <Brain className="w-5 h-5 text-[#8B6FF5] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold">Slobby AI Signal · Real Market</div>
              <div className="text-sm text-[#EDE9F7] font-bold truncate">
                {sentiment ? `${sentiment.action?.toUpperCase()} · ${sentiment.reason}` : "Run an AI analysis to get a real-time buy/sell signal"}
              </div>
            </div>
            <button onClick={() => { setAutoFollow((v) => !v); pushLog(autoFollow ? "🔕 Auto-trade AI off" : "🔔 Auto-trade AI on — real testnet txs"); }}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-display font-extrabold border ${autoFollow ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-[#1f1a2e] border-[#2d2542] text-[#7A7290]"}`}>
              <Zap className="w-3.5 h-3.5" /> Auto
            </button>
            <button onClick={analyzeMarket} disabled={analyzing} className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#8B6FF5] to-[#7C5CFC] text-white text-xs font-display font-extrabold flex items-center gap-1.5 disabled:opacity-60">
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />} Analyze
            </button>
          </div>

          {/* Real TKAS trade terminal */}
          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-3 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-[#FF8A6B]" />
              <span className="font-display font-bold text-sm">Real Testnet Trade</span>
              <span className="text-[9px] text-[#5CE1A4] uppercase tracking-widest font-bold">On-chain · TKAS</span>
            </div>
            <div className="grid grid-cols-[1fr_100px_auto] gap-2">
              <input value={sendForm.to} onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })} placeholder="Destination kaspa: / kaspatest: address" className="h-10 px-3 rounded-xl bg-[#241E33] border border-[#3d3258] text-[#EDE9F7] text-xs font-mono placeholder:text-[#5A4B8A] focus:outline-none focus:border-[#8B6FF5] col-span-3 sm:col-span-1" />
              <input type="number" value={sendForm.amount} onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })} placeholder="TKAS" className="h-10 px-3 rounded-xl bg-[#241E33] border border-[#3d3258] text-[#EDE9F7] text-sm text-center focus:outline-none focus:border-[#8B6FF5]" />
              <button onClick={() => sendTkas()} disabled={sending} className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#8B6FF5] to-[#7C5CFC] text-white text-xs font-display font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-60">
                {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
              </button>
            </div>
            <button onClick={() => setSendForm({ ...sendForm, to: wallet.testnetAddress })} className="mt-1.5 text-[10px] text-[#7A7290] hover:text-[#8B6FF5]">Use my own address (safe self-send)</button>
            {lastTx && <div className="mt-2 text-[10px] font-mono text-[#5CE1A4] break-all">✓ last tx: {lastTx}</div>}
          </div>
        </div>

        {/* RIGHT: sentiment + AI log + live txs */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide min-h-0">
          <KidsMarketSentiment sentiment={sentiment} loading={analyzing} onAnalyze={analyzeMarket} lastRun={lastRun} />

          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-3">
            <div className="flex items-center gap-2 mb-2"><Coins className="w-4 h-4 text-[#8B6FF5]" /><span className="font-display font-bold text-sm">AI Activity Log</span></div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {aiLog.length === 0 && <div className="text-[11px] text-[#7A7290]">No activity yet.</div>}
              {aiLog.map((e, i) => <div key={i} className="text-[11px] text-[#B9A8F5] leading-snug">{e.text}</div>)}
            </div>
          </div>

          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-3">
            <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-[#5CE1A4]" /><span className="font-display font-bold text-sm">Live Kaspa Network</span></div>
            <div className="space-y-1.5">
              {liveTxs.length === 0 && <div className="text-[11px] text-[#7A7290]">Loading live txs…</div>}
              {liveTxs.map((tx, i) => {
                const amt = tx?.transaction?.outputs?.[0]?.amount ?? tx?.amount ?? tx?.value;
                const id = tx?.transaction?.transactionId || tx?.transactionId || tx?.hash || "—" + i;
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4] animate-pulse" />
                    <span className="font-mono text-[#B9A8F5] truncate flex-1">{String(id).slice(0, 14)}…</span>
                    {amt && <span className="text-[#7A7290]">{(Number(amt) / 1e8).toFixed(2)} KAS</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}