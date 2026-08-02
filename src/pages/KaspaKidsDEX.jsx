import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Bot, Brain, TrendingUp, TrendingDown, Activity, Zap, Wallet,
  RefreshCw, Radio, AlertTriangle, Plus, Minus, LineChart as LineChartIcon, Coins,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsTradingViewChart from "@/components/kaspakids/KidsTradingViewChart";
import KidsMarketSentiment from "@/components/kaspakids/KidsMarketSentiment";
import KidsAcademy from "@/components/kaspakids/KidsAcademy";

const LS_KEY = "kaspakids_dex_v1";

// Quadratic bonding curve (KRON-style)
const A = 0.0005;
const B = 0.5;
const priceAt = (s) => A * s * s + B;
const buyCost = (s, qty) => (A / 3) * (Math.pow(s + qty, 3) - Math.pow(s, 3)) + B * qty;
const sellProceeds = (s, qty) => (A / 3) * (Math.pow(s, 3) - Math.pow(s - qty, 3)) + B * qty;

const AGENTS = [
  { name: "Pixel", emoji: "🟣", cash: 200, holdings: {} },
  { name: "Nova", emoji: "🌟", cash: 200, holdings: {} },
  { name: "Ziggy", emoji: "⚡", cash: 200, holdings: {} },
  { name: "Mochi", emoji: "🍡", cash: 200, holdings: {} },
];

export default function KaspaKidsDEXPage() {
  // real market
  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(0);
  const [priceSrc, setPriceSrc] = useState("");
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [liveTxs, setLiveTxs] = useState([]);

  // AI sentiment
  const [sentiment, setSentiment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [autoFollow, setAutoFollow] = useState(false);
  const [aiLog, setAiLog] = useState([]);

  // sandbox market
  const [playBalance, setPlayBalance] = useState(1000);
  const [slobz, setSlobz] = useState({ supply: 1000, reserve: 500, price: priceAt(1000), history: [priceAt(1000)] });
  const [agents, setAgents] = useState(() => AGENTS.map((a) => ({ ...a, holdings: {} })));
  const [agentsOn, setAgentsOn] = useState(true);
  const [qty, setQty] = useState(5);
  const [myHolding, setMyHolding] = useState(0);
  const [chartSymbol, setChartSymbol] = useState("KASPAUSD");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.slobz) setSlobz(s.slobz);
        if (typeof s.playBalance === "number") setPlayBalance(s.playBalance);
        if (s.agents) setAgents(s.agents);
        if (typeof s.myHolding === "number") setMyHolding(s.myHolding);
        if (s.aiLog) setAiLog(s.aiLog);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ slobz, playBalance, agents, myHolding, aiLog: aiLog.slice(0, 30) }));
    } catch {}
  }, [slobz, playBalance, agents, myHolding, aiLog]);

  // ---- REAL-TIME PRICE (every 20s) ----
  const fetchPrice = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getKaspaPrice", {});
      const d = res.data || res;
      if (d?.success && d.price) {
        setPrice(d.price);
        setChange24h(d.change24h || 0);
        setPriceSrc(d.source || "");
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
    fetchPrice();
    fetchLiveTxs();
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
Analyze the REAL-TIME Kaspa market using live news and price action. Decide if a young trader should BUY, SELL, or HOLD the practice token SLOBZ.
Keep it simple, warm, and educational (12-year-old reading level). This is NOT financial advice — just a learning game.
Return a sentiment score from -100 (max bearish) to +100 (max bullish), an action, a confidence %, a one-sentence kid reason, and a one-sentence news summary.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
            score: { type: "number" },
            action: { type: "string", enum: ["buy", "sell", "hold"] },
            confidence: { type: "number" },
            reason: { type: "string" },
            news_summary: { type: "string" },
          },
          required: ["sentiment", "score", "action", "reason"],
        },
      });
      const s = res.data || res;
      setSentiment(s);
      setLastRun(new Date().toLocaleTimeString());
      pushAiLog(`🧠 AI: ${s.action?.toUpperCase()} · ${s.sentiment} (${s.score > 0 ? "+" : ""}${s.score})`);
      if (autoFollow) executeAi(s);
    } catch (e) {
      pushAiLog("⚠️ AI analysis failed — try again");
    } finally {
      setAnalyzing(false);
    }
  };

  const pushAiLog = useCallback((text) => {
    setAiLog((l) => [{ text, t: Date.now() }, ...l].slice(0, 30));
  }, []);

  // ---- REAL AI BUY/SELL EXECUTION ----
  const executeAi = (s) => {
    if (!s || s.action === "hold") return;
    const q = Math.max(1, Math.round(Number(qty) || 3));
    if (s.action === "buy") kidBuy(q, true);
    else if (s.action === "sell") kidSell(q, true);
  };

  // ---- BONDING CURVE TRADING ----
  const kidBuy = (overrideQty, fromAi = false) => {
    const q = Math.max(1, Number(overrideQty ?? qty));
    const cost = buyCost(slobz.supply, q);
    if (playBalance < cost) {
      pushAiLog(fromAi ? "🤖 AI: not enough play tKAS to buy" : "Not enough play tKAS — top up!");
      return;
    }
    setPlayBalance((b) => b - cost);
    const ns = slobz.supply + q;
    setSlobz({ supply: ns, reserve: slobz.reserve + cost, price: priceAt(ns), history: [...slobz.history, priceAt(ns)].slice(-60) });
    setMyHolding((h) => h + q);
    pushAiLog((fromAi ? "🤖 AI BOUGHT " : "🧒 You bought ") + `${q} SLOBZ for ${cost.toFixed(2)} play tKAS`);
  };

  const kidSell = (overrideQty, fromAi = false) => {
    const q = Math.max(1, Number(overrideQty ?? qty));
    if (myHolding < q) {
      pushAiLog(fromAi ? "🤖 AI: nothing to sell" : "You don't own that many SLOBZ");
      return;
    }
    const proceeds = sellProceeds(slobz.supply, q);
    setPlayBalance((b) => b + proceeds);
    const ns = Math.max(1, slobz.supply - q);
    setSlobz({ supply: ns, reserve: Math.max(0, slobz.reserve - proceeds), price: priceAt(ns), history: [...slobz.history, priceAt(ns)].slice(-60) });
    setMyHolding((h) => h - q);
    pushAiLog((fromAi ? "🤖 AI SOLD " : "🧒 You sold ") + `${q} SLOBZ for ${proceeds.toFixed(2)} play tKAS`);
  };

  // ---- AI AGENT TRADING LOOP (momentum + sentiment bias) ----
  useEffect(() => {
    if (!agentsOn) return;
    const tick = setInterval(() => {
      setAgents((cur) => {
        let working = cur.map((a) => ({ ...a, holdings: { ...a.holdings } }));
        setSlobz((tok) => {
          const last = tok.history[tok.history.length - 1] ?? tok.price;
          const prev = tok.history[tok.history.length - 4] ?? tok.history[0] ?? tok.price;
          const momentum = (last - prev) / (prev || 1);
          const bias = (sentiment?.score ?? 0) / 200; // -0.5..0.5
          let supply = tok.supply, reserve = tok.reserve;
          const history = [...tok.history];
          working.forEach((agent) => {
            const held = agent.holdings["SLOBZ"] || 0;
            const r = Math.random();
            const buyProb = Math.min(0.8, 0.4 + momentum * 20 + bias);
            const sellProb = Math.min(0.8, 0.4 - momentum * 20 - bias);
            if (agent.cash > 5 && r < buyProb) {
              const q = Math.max(1, Math.floor((agent.cash * 0.12) / Math.max(priceAt(supply), 0.1)));
              if (q > 0) {
                const cost = buyCost(supply, q);
                if (agent.cash >= cost) {
                  agent.cash -= cost; agent.holdings["SLOBZ"] = held + q;
                  supply += q; reserve += cost;
                  history.push(priceAt(supply));
                }
              }
            } else if (held > 0 && r < sellProb + 0.1) {
              const q = Math.min(held, Math.max(1, Math.floor(held * 0.3)));
              const proceeds = sellProceeds(supply, q);
              agent.cash += proceeds; agent.holdings["SLOBZ"] = held - q;
              supply = Math.max(1, supply - q); reserve = Math.max(0, reserve - proceeds);
              history.push(priceAt(supply));
            }
          });
          return { supply, reserve, price: priceAt(supply), history: history.slice(-60) };
        });
        return working;
      });
    }, 3500);
    return () => clearInterval(tick);
  }, [agentsOn, sentiment]);

  const priceUp = change24h >= 0;

  return (
    <div className="relative h-screen overflow-hidden bg-[#14101f] text-[#EDE9F7] font-body flex flex-col">
      <SlobzBlobs />
      {/* ── TOP BAR ── */}
      <div className="relative z-20 flex items-center gap-3 h-14 px-3 sm:px-5 border-b border-[#2d2542] bg-[#14101f]/85 backdrop-blur-xl flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/KaspaKids" className="flex items-center gap-1.5 text-[#B9A8F5] hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Exit</span>
        </Link>
        <div className="flex items-center gap-2 font-display font-black text-[#8B6FF5]">
          🟣 <span className="hidden sm:inline">Slobz DEX</span>
        </div>

        {/* Live KAS ticker */}
        <div className="flex items-center gap-2 ml-1 sm:ml-3 px-3 py-1.5 rounded-xl bg-[#1f1a2e] border border-[#2d2542]">
          <Radio className="w-3.5 h-3.5 text-[#5CE1A4] animate-pulse" />
          <span className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold">KAS</span>
          <span className="font-display font-black text-sm text-white">${price ? price.toFixed(5) : "…"}</span>
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${priceUp ? "text-green-400" : "text-red-400"}`}>
            {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(change24h).toFixed(2)}%
          </span>
          {lastPriceUpdate && <span className="hidden md:inline text-[9px] text-[#7A7290]">{lastPriceUpdate}</span>}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setChartSymbol("KASPAUSD")} className={`hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-display font-bold border ${chartSymbol === "KASPAUSD" ? "bg-[#8B6FF5]/20 border-[#8B6FF5] text-[#8B6FF5]" : "bg-[#1f1a2e] border-[#2d2542] text-[#7A7290]"}`}>
            <LineChartIcon className="w-3.5 h-3.5" /> KAS Chart
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold">
            <Wallet className="w-3.5 h-3.5" /> {playBalance.toFixed(1)}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr_330px] gap-2 p-2 overflow-hidden">
        {/* LEFT: academy + market info */}
        <div className="hidden lg:flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide">
          <KidsAcademy />
          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#5CE1A4]" />
              <span className="font-display font-bold text-sm text-[#EDE9F7]">Live Kaspa Network</span>
            </div>
            <div className="space-y-1.5">
              {liveTxs.length === 0 && <div className="text-[11px] text-[#7A7290]">Loading live txs…</div>}
              {liveTxs.map((tx, i) => {
                const amt = tx?.transaction?.outputs?.[0]?.amount ?? tx?.amount ?? tx?.value;
                const id = (tx?.transaction?.transactionId || tx?.transactionId || tx?.hash || "—" + i);
                return (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4]" />
                    <span className="font-mono text-[#B9A8F5] truncate flex-1">{String(id).slice(0, 14)}…</span>
                    {amt && <span className="text-[#7A7290]">{(Number(amt) / 1e8).toFixed(2)} KAS</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: chart + AI strip + trade panel */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-[#2d2542] bg-[#1f1a2e]">
            <KidsTradingViewChart symbol={chartSymbol} theme="dark" />
          </div>

          {/* AI signal strip */}
          <div className="rounded-2xl bg-gradient-to-r from-[#241E33] to-[#1f1a2e] border border-[#8B6FF5]/30 p-3 flex items-center gap-3 flex-shrink-0">
            <Brain className="w-5 h-5 text-[#8B6FF5] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold">Slobby AI Signal</div>
              <div className="text-sm text-[#EDE9F7] font-bold truncate">
                {sentiment ? `${sentiment.action?.toUpperCase()} · ${sentiment.reason}` : "Run an AI analysis to get a real-time signal"}
              </div>
            </div>
            <button
              onClick={() => { setAutoFollow((v) => !v); pushAiLog(autoFollow ? "🔕 Auto-follow AI off" : "🔔 Auto-follow AI on"); }}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-display font-extrabold border ${autoFollow ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-[#1f1a2e] border-[#2d2542] text-[#7A7290]"}`}
            >
              <Zap className="w-3.5 h-3.5" /> Auto
            </button>
            <button onClick={() => kidBuy(qty)} className="h-9 px-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-display font-extrabold">Buy</button>
            <button onClick={() => kidSell(qty)} className="h-9 px-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-display font-extrabold">Sell</button>
          </div>

          {/* Trade panel */}
          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟣</span>
                <span className="font-display font-black text-sm">SLOBZ</span>
                <span className="text-[10px] text-[#7A7290]">bonding curve</span>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-sm">${slobz.price.toFixed(3)}</div>
                <div className="text-[9px] text-[#7A7290]">You hold {myHolding}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#241E33] rounded-xl border border-[#2d2542]">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center text-[#B9A8F5]"><Minus className="w-4 h-4" /></button>
                <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-12 h-9 bg-transparent text-center text-sm font-bold focus:outline-none" />
                <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 flex items-center justify-center text-[#B9A8F5]"><Plus className="w-4 h-4" /></button>
              </div>
              <button onClick={() => kidBuy()} className="flex-1 h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-display font-extrabold flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Buy · {buyCost(slobz.supply, qty).toFixed(2)}
              </button>
              <button onClick={() => kidSell()} className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-display font-extrabold flex items-center justify-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Sell · {sellProceeds(slobz.supply, qty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: sentiment + AI log + agents */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide min-h-0">
          <KidsMarketSentiment sentiment={sentiment} loading={analyzing} onAnalyze={analyzeMarket} lastRun={lastRun} />

          {/* AI log */}
          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-[#8B6FF5]" />
              <span className="font-display font-bold text-sm">AI Activity</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {aiLog.length === 0 && <div className="text-[11px] text-[#7A7290]">No activity yet.</div>}
              {aiLog.map((e, i) => (
                <div key={i} className="text-[11px] text-[#B9A8F5] leading-snug">{e.text}</div>
              ))}
            </div>
          </div>

          {/* Agent standings */}
          <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#FF8A6B]" />
                <span className="font-display font-bold text-sm">AI Agents</span>
              </div>
              <button onClick={() => setAgentsOn((v) => !v)} className={`text-[10px] font-display font-extrabold px-2 py-1 rounded-full border ${agentsOn ? "bg-green-500/20 border-green-500/40 text-green-400" : "border-[#3d3258] text-[#7A7290]"}`}>
                {agentsOn ? "● LIVE" : "○ PAUSED"}
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span>🧒</span><span className="font-bold w-14">You</span>
                <span className="text-[#7A7290] flex-1 text-[10px]">{playBalance.toFixed(0)} + {myHolding} SLOBZ</span>
                <span className="font-display font-black text-green-400">{(playBalance + myHolding * slobz.price).toFixed(0)}</span>
              </div>
              {agents.map((a) => {
                const held = a.holdings["SLOBZ"] || 0;
                const net = a.cash + held * slobz.price;
                return (
                  <div key={a.name} className="flex items-center gap-2 text-xs">
                    <span>{a.emoji}</span><span className="font-bold w-14 truncate">{a.name}</span>
                    <span className="text-[#7A7290] flex-1 text-[10px]">{a.cash.toFixed(0)} + {held} SLOBZ</span>
                    <span className="font-display font-black text-[#EDE9F7]">{net.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* mobile: academy accessible via bottom hint */}
      <div className="lg:hidden absolute bottom-2 left-2 right-2 z-20">
        <div className="rounded-xl bg-[#1f1a2e]/90 border border-[#2d2542] px-3 py-2 flex items-center gap-2 text-[10px] text-[#7A7290]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FF8A6B] flex-shrink-0" />
          Practice mode — play money only. Open on desktop for the full Academy + live network feed.
        </div>
      </div>
    </div>
  );
}