import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Rocket, TrendingUp, TrendingDown, Bot, Plus, Coins,
  LineChart, GraduationCap, Wallet, Droplets, Brain, BarChart3, ShieldCheck, ArrowRight, Info, Radio,
} from "lucide-react";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsMascot from "@/components/kaspakids/KidsMascot";
import KidsMarketChart from "@/components/kaspakids/KidsMarketChart";
import KidsSLBZChart from "@/components/kaspakids/KidsSLBZChart";
import KidsChartAcademy from "@/components/kaspakids/KidsChartAcademy";

const MASCOT_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const LS_KEY = "kaspakids_state_v3";

const AGENTS = [
  { name: "Pixel", emoji: "🟣", cash: 300, holdings: {} },
  { name: "Nova", emoji: "🌟", cash: 300, holdings: {} },
  { name: "Ziggy", emoji: "⚡", cash: 300, holdings: {} },
  { name: "Mochi", emoji: "🍡", cash: 300, holdings: {} },
];

// Quadratic bonding curve (KRON-style) — same math the Pro DEX uses
const A = 0.0005;
const B = 0.5;
const priceAt = (supply) => A * supply * supply + B;
const buyCost = (s, qty) => (A / 3) * (Math.pow(s + qty, 3) - Math.pow(s, 3)) + B * qty;
const sellProceeds = (s, qty) => (A / 3) * (Math.pow(s, 3) - Math.pow(s - qty, 3)) + B * qty;

const READY_CARDS = [
  { icon: Wallet, color: "#7C4DFF", title: "Real Testnet Wallet", what: "On Pro you get a real Kaspa testnet wallet with real TKAS (free test coins).", tip: "Here you practice with fake TTT — nothing to lose." },
  { icon: Droplets, color: "#FF8A6B", title: "Faucet & TKAS", what: "Pro uses TKAS from a free faucet. Never real money — just real test coins.", tip: "You'll fund your Pro wallet with one tap." },
  { icon: BarChart3, color: "#4CAF50", title: "Bonding Curve", what: "The same math you use here: price rises as more people buy. Pro uses it too.", tip: "You already know how it works!" },
  { icon: Brain, color: "#7C4DFF", title: "AI Sentiment", what: "Pro's AI reads real Kaspa news + live price to decide buy/sell. Here, agents guess.", tip: "Pro AI = real-time, real data." },
  { icon: LineChart, color: "#FF8A6B", title: "Real Charts", what: "Pro shows live TradingView charts + a real KAS price ticker.", tip: "Learn the basics here, chart like a pro there." },
  { icon: ShieldCheck, color: "#4CAF50", title: "Risk Rules", what: "Never spend money you can't lose. Pro is testnet, but habits stick.", tip: "Finish the checklist on Pro before trading." },
];

export default function KaspaKidsPage() {
  const [tttBalance, setTttBalance] = useState(1000); // TTT Demo money (fake)
  const [tokens, setTokens] = useState([]);
  const [agents, setAgents] = useState(() => AGENTS.map((a) => ({ ...a, holdings: {} })));
  const [log, setLog] = useState([]);
  const [mascot, setMascot] = useState("");
  const [agentsOn, setAgentsOn] = useState(true);
  const [launchForm, setLaunchForm] = useState({ name: "", symbol: "", emoji: "🚀", seed: 50 });
  const [buyQty, setBuyQty] = useState({});
  const [showReady, setShowReady] = useState(true);
  const [showLaunch, setShowLaunch] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const tickRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setTttBalance(s.tttBalance ?? 1000);
        setTokens(s.tokens || []);
        setAgents(s.agents || AGENTS.map((a) => ({ ...a, holdings: {} })));
        setLog(s.log || []);
        if (s.tokens?.length) setSelectedId(s.tokens[0].id);
      }
    } catch {}
    setMascot("Hi! I'm Slobby 🟣 This is the SAFE playground — fake TTT money only. Have fun!");
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ tttBalance, tokens, agents, log })); } catch {}
  }, [tttBalance, tokens, agents, log]);

  useEffect(() => { if (!selectedId && tokens.length) setSelectedId(tokens[0].id); }, [tokens, selectedId]);

  const pushLog = useCallback((entry) => {
    setLog((l) => [{ ...entry, t: Date.now() }, ...l].slice(0, 40));
  }, []);

  const sandboxTopUp = () => {
    setTttBalance((b) => b + 500);
    setMascot("💧 +500 TTT Demo money! (Fake — just for practice.)");
    pushLog({ kind: "system", text: "Sandbox top-up: +500 TTT" });
  };

  const launchToken = () => {
    const name = launchForm.name.trim();
    const symbol = launchForm.symbol.trim().toUpperCase();
    const emoji = launchForm.emoji || "🚀";
    const seed = Math.max(10, Number(launchForm.seed) || 50);
    if (!name || !symbol) { setMascot("Give your token a name and a ticker! 🏷️"); return; }
    if (tttBalance < seed) { setMascot("Not enough TTT to seed that. Tap +TTT for more Demo money! 💧"); return; }
    if (tokens.find((t) => t.symbol === symbol)) { setMascot("A token with that ticker already exists!"); return; }

    const initialSupply = 20;
    const token = {
      id: Date.now().toString(), name, symbol, emoji,
      supply: initialSupply, reserve: seed, price: priceAt(initialSupply),
      history: [priceAt(initialSupply)], creator: "you",
    };
    setTttBalance((b) => b - seed);
    setTokens((ts) => [token, ...ts]);
    setSelectedId(token.id);
    setAgents((as) => {
      const hasYou = as.some((a) => a.name === "you");
      if (!hasYou) as = [{ name: "you", emoji: "🧒", cash: 0, holdings: {} }, ...as];
      return as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [symbol]: initialSupply } } : a);
    });
    setMascot(`${emoji} ${symbol} is LIVE! You hold ${initialSupply} ${symbol}. Watch the agents trade it!`);
    pushLog({ kind: "launch", text: `🚀 ${symbol} launched · seed ${seed} TTT` });
    setLaunchForm({ name: "", symbol: "", emoji: "🚀", seed: 50 });
    setShowLaunch(false);
  };

  const kidBuy = (token) => {
    const qty = Number(buyQty[token.id] || 1);
    if (qty <= 0) return;
    const cost = buyCost(token.supply, qty);
    if (tttBalance < cost) { setMascot("Not enough TTT to buy that many! 💸"); return; }
    setTttBalance((b) => b - cost);
    setTokens((ts) => ts.map((t) => t.id === token.id ? {
      ...t, supply: t.supply + qty, reserve: t.reserve + cost,
      price: priceAt(t.supply + qty),
      history: [...t.history, priceAt(t.supply + qty)].slice(-60),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [token.symbol]: (a.holdings[token.symbol] || 0) + qty } } : a));
    pushLog({ kind: "buy", text: `🧒 You bought ${qty} ${token.symbol} for ${cost.toFixed(2)} TTT` });
    setMascot(`You bought ${qty} ${token.symbol}! Price went up 📈`);
  };

  const kidSell = (token) => {
    const qty = Number(buyQty[token.id] || 1);
    if (qty <= 0) return;
    const held = (agents.find((a) => a.name === "you")?.holdings || {})[token.symbol] || 0;
    if (held < qty) { setMascot("You don't own that many to sell! 🧸"); return; }
    const proceeds = sellProceeds(token.supply, qty);
    setTttBalance((b) => b + proceeds);
    setTokens((ts) => ts.map((t) => t.id === token.id ? {
      ...t, supply: t.supply - qty, reserve: Math.max(0, t.reserve - proceeds),
      price: priceAt(Math.max(0, t.supply - qty)),
      history: [...t.history, priceAt(Math.max(0, t.supply - qty))].slice(-60),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [token.symbol]: Math.max(0, held - qty) } } : a));
    pushLog({ kind: "sell", text: `🧒 You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} TTT` });
    setMascot(`You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} TTT!`);
  };

  // AI agent trading loop (sandbox)
  useEffect(() => {
    if (!agentsOn || tokens.length === 0) return;
    tickRef.current = setInterval(() => {
      setAgents((curAgents) => {
        let working = curAgents.map((a) => ({ ...a, holdings: { ...a.holdings } }));
        setTokens((curTokens) => {
          if (curTokens.length === 0) return curTokens;
          let tks = curTokens.map((t) => ({ ...t, history: [...t.history] }));
          working.forEach((agent) => {
            if (agent.name === "you") return;
            const t = tks[Math.floor(Math.random() * tks.length)];
            if (!t) return;
            const last = t.history.length >= 2 ? t.history[t.history.length - 1] : t.price;
            const prev = t.history.length >= 3 ? t.history[t.history.length - 3] : t.history[0] || t.price;
            const momentum = (last - prev) / (prev || 1);
            const held = agent.holdings[t.symbol] || 0;
            const r = Math.random();
            let action = null;
            if (momentum > 0.001 && r < 0.6 && agent.cash > 0) action = "buy";
            else if (momentum < -0.001 && r < 0.6 && held > 0) action = "sell";
            else if (r < 0.2 && agent.cash > 5) action = "buy";
            else if (r < 0.3 && held > 0) action = "sell";

            if (action === "buy") {
              const qty = Math.max(1, Math.floor((agent.cash * 0.1) / Math.max(t.price, 0.1)));
              if (qty <= 0) return;
              const cost = buyCost(t.supply, qty);
              if (agent.cash < cost) return;
              agent.cash -= cost;
              agent.holdings[t.symbol] = (agent.holdings[t.symbol] || 0) + qty;
              const tk = tks.find((x) => x.id === t.id);
              tk.supply += qty; tk.reserve += cost; tk.price = priceAt(tk.supply);
              tk.history = [...tk.history, tk.price].slice(-60);
              pushLog({ kind: "buy", text: `${agent.emoji} ${agent.name} bought ${qty} ${t.symbol}` });
            } else if (action === "sell") {
              const qty = Math.min(held, Math.max(1, Math.floor(held * 0.3)));
              if (qty <= 0) return;
              const proceeds = sellProceeds(t.supply, qty);
              agent.cash += proceeds;
              agent.holdings[t.symbol] = held - qty;
              const tk = tks.find((x) => x.id === t.id);
              tk.supply = Math.max(1, tk.supply - qty); tk.reserve = Math.max(0, tk.reserve - proceeds); tk.price = priceAt(tk.supply);
              tk.history = [...tk.history, tk.price].slice(-60);
              pushLog({ kind: "sell", text: `${agent.emoji} ${agent.name} sold ${qty} ${t.symbol}` });
            }
          });
          return tks;
        });
        return working;
      });
    }, 3500);
    return () => clearInterval(tickRef.current);
  }, [agentsOn, tokens.length]);

  const selected = tokens.find((t) => t.id === selectedId) || tokens[0] || null;
  const myHolding = selected ? (agents.find((a) => a.name === "you")?.holdings || {})[selected.symbol] || 0 : 0;

  return (
    <div className="relative min-h-screen lg:h-screen bg-[#e0d7f5] font-body text-[#1F1B2E] flex flex-col lg:overflow-hidden">
      <SlobzBlobs />
      {/* TOP BAR */}
      <div className="relative z-20 flex items-center gap-3 h-14 px-3 sm:px-5 border-b border-[#7C4DFF]/15 bg-[#e0d7f5]/85 backdrop-blur-xl flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Store</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-display font-black text-[#3D2E7C]">🟣 <span className="hidden sm:inline">Slobz Playground</span></div>
        <div className="flex items-center gap-2 ml-1 px-3 py-1.5 rounded-xl bg-white/70 border border-[#7C4DFF]/20">
          <Radio className="w-3.5 h-3.5 text-[#4CAF50] animate-pulse" />
          <span className="text-[10px] text-[#7f7f7f] uppercase tracking-widest font-bold">TTT Demo</span>
          <span className="font-display font-black text-sm text-[#3D2E7C]">{tttBalance.toFixed(0)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={sandboxTopUp} className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/70 border border-[#7C4DFF]/20 text-[#5A4B8A] text-xs font-display font-bold">
            <Droplets className="w-3.5 h-3.5" /> +TTT
          </button>
          <Link to="/KaspaKidsDEX" className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold shadow-[0_6px_16px_rgba(249,107,76,0.35)]">
            <LineChart className="w-3.5 h-3.5" /> Pro DEX
          </Link>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="relative z-10 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-2 p-2 pb-28 lg:pb-2 overflow-y-auto lg:overflow-hidden">
        {/* LEFT: get ready + launch */}
        <div className="flex flex-col gap-2 pr-1 scrollbar-hide order-3 lg:order-none lg:overflow-y-auto">
          {/* Get Ready for Pro */}
          <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3">
            <button onClick={() => setShowReady((v) => !v)} className="w-full flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#7C4DFF]" />
              <span className="font-display font-extrabold text-sm text-[#1F1B2E]">Get Ready for Pro</span>
              <span className="ml-auto text-[10px] text-[#7f7f7f]">{showReady ? "Hide" : "Show"}</span>
            </button>
            <AnimatePresence>
              {showReady && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-2 mt-2">
                    {READY_CARDS.map((c) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.title} className="rounded-xl bg-[#f3eefa] border border-[#e6d9fb] p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.color + "22" }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                            </div>
                            <div className="font-display font-extrabold text-xs text-[#1F1B2E]">{c.title}</div>
                          </div>
                          <div className="text-[10px] text-[#5A4B8A] leading-snug flex items-start gap-1"><Info className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 text-[#7C4DFF]" />{c.what}</div>
                          <div className="text-[10px] text-[#7C4DFF] font-bold mt-1">✓ {c.tip}</div>
                        </div>
                      );
                    })}
                  </div>
                  <Link to="/KaspaKidsDEX" className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-xs shadow-[0_8px_20px_rgba(249,107,76,0.35)]">
                    I'm Ready — Open Pro <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Launch a token */}
          <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3">
            <button onClick={() => setShowLaunch((v) => !v)} className="w-full flex items-center gap-2 mb-1">
              <Rocket className="w-4 h-4 text-[#7C4DFF]" />
              <span className="font-display font-extrabold text-sm text-[#1F1B2E]">Launch a Token</span>
              <span className="ml-auto text-[9px] text-[#7f7f7f] uppercase tracking-widest font-bold">Bonding curve</span>
            </button>
            <AnimatePresence>
              {showLaunch && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input value={launchForm.name} onChange={(e) => setLaunchForm({ ...launchForm, name: e.target.value })} placeholder="Token Name" className="col-span-2 h-9 px-3 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF]" />
                    <input value={launchForm.symbol} onChange={(e) => setLaunchForm({ ...launchForm, symbol: e.target.value })} placeholder="Ticker" maxLength={6} className="h-9 px-3 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF] uppercase" />
                    <div className="flex gap-1.5">
                      <input value={launchForm.emoji} onChange={(e) => setLaunchForm({ ...launchForm, emoji: e.target.value })} placeholder="🚀" className="w-10 h-9 px-1 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-center text-base focus:outline-none focus:border-[#7C4DFF]" />
                      <input type="number" value={launchForm.seed} onChange={(e) => setLaunchForm({ ...launchForm, seed: e.target.value })} placeholder="Seed" className="flex-1 h-9 px-2 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF]" />
                    </div>
                  </div>
                  <button onClick={launchToken} className="w-full mt-2 h-10 rounded-xl bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0] text-white font-display font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(124,77,255,0.3)]">
                    <Sparkles className="w-3.5 h-3.5" /> Launch {launchForm.symbol || "Token"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {!showLaunch && <div className="text-[10px] text-[#7f7f7f] mt-1">Tap to create your own KRC20-style token.</div>}
          </div>
          <KidsChartAcademy />
        </div>

        {/* CENTER: chart + active token */}
        <div className="flex flex-col gap-2 min-h-0 order-1 lg:order-none">
          {/* Real market chart (for learning to read charts) */}
          <div className="h-[55vh] lg:h-auto lg:flex-1 min-h-0 rounded-2xl overflow-hidden border border-white bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)]">
            <div className="flex items-center gap-2 px-3 h-9 border-b border-[#e6d9fb] bg-white">
              <LineChart className="w-3.5 h-3.5 text-[#7C4DFF]" />
              <span className="text-xs font-display font-bold text-[#1F1B2E]">{selected ? `${selected.symbol} · Live Sandbox Chart` : "SLBZ · Live Sandbox Chart"}</span>
              <span className="ml-auto text-[9px] text-[#7f7f7f]">Draw tools & call patterns like TradingView</span>
            </div>
            <div className="h-[calc(100%-2.25rem)]">
              {selected ? <KidsSLBZChart token={selected} /> : (
                <div className="h-full flex items-center justify-center text-center px-6">
                  <div>
                    <Rocket className="w-6 h-6 text-[#7C4DFF] mx-auto mb-2" />
                    <div className="text-sm text-[#5A4B8A] font-display font-bold">Launch a token to see its live chart</div>
                    <div className="text-[10px] text-[#7f7f7f] mt-1">Then use the tools to call patterns like a real trader.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active sandbox token + buy/sell */}
          <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3 flex-shrink-0">
            {selected ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{selected.emoji}</span>
                  <div>
                    <div className="font-display font-black text-sm text-[#1F1B2E]">{selected.symbol}</div>
                    <div className="text-[10px] text-[#7f7f7f]">{selected.name}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-display font-black text-sm text-[#1F1B2E]">{selected.price.toFixed(3)} <span className="text-[10px] text-[#7f7f7f]">TTT</span></div>
                    <div className="text-[10px] text-[#7f7f7f]">You hold {myHolding} · supply {selected.supply} · reserve {selected.reserve.toFixed(1)}</div>
                  </div>
                </div>
                <div className="h-16 mb-2"><KidsMarketChart data={selected.history} /></div>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={buyQty[selected.id] ?? 1} onChange={(e) => setBuyQty({ ...buyQty, [selected.id]: e.target.value })} className="w-14 h-9 px-2 rounded-lg bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-sm text-center focus:outline-none focus:border-[#7C4DFF]" />
                  <button onClick={() => kidBuy(selected)} className="flex-1 h-9 rounded-lg bg-[#4CAF50] hover:bg-[#43a047] text-white text-xs font-display font-extrabold flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Buy · {buyCost(selected.supply, Number(buyQty[selected.id] || 1)).toFixed(2)}
                  </button>
                  <button onClick={() => kidSell(selected)} className="flex-1 h-9 rounded-lg bg-[#e54848] hover:bg-[#d33838] text-white text-xs font-display font-extrabold flex items-center justify-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Sell · {sellProceeds(selected.supply, Number(buyQty[selected.id] || 1)).toFixed(2)}
                  </button>
                </div>
                {/* token pills */}
                {tokens.length > 1 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
                    {tokens.map((t) => (
                      <button key={t.id} onClick={() => setSelectedId(t.id)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display font-bold whitespace-nowrap border ${t.id === selectedId ? "bg-[#7C4DFF] text-white border-[#7C4DFF]" : "bg-[#f3eefa] text-[#5A4B8A] border-[#e6d9fb]"}`}>
                        {t.emoji} {t.symbol}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-[#5A4B8A] mb-2">No tokens yet — launch your first one!</div>
                <button onClick={() => { setShowLaunch(true); if (window.matchMedia('(max-width: 1023px)').matches) setShowLaunch(true); }} className="lg:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0] text-white text-xs font-display font-extrabold">
                  <Rocket className="w-3.5 h-3.5" /> Launch a Token
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: agents + activity */}
        <div className="flex flex-col gap-2 pr-1 scrollbar-hide min-h-0 order-2 lg:order-none lg:overflow-y-auto">
          <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#7C4DFF]" />
                <span className="font-display font-bold text-sm text-[#1F1B2E]">AI Agents <span className="text-[#7C4DFF]">{agents.filter((a) => a.name !== "you").length}</span> trading</span>
              </div>
              <button onClick={() => setAgentsOn((v) => !v)} className={`flex items-center gap-1 h-7 px-2.5 rounded-full text-[10px] font-display font-extrabold border ${agentsOn ? "bg-[#4CAF50]/20 border-[#4CAF50]/50 text-[#2e7d32]" : "bg-[#f3eefa] border-[#e6d9fb] text-[#7f7f7f]"}`}>
                {agentsOn ? "● LIVE" : "○ PAUSED"}
              </button>
            </div>
            <div className="space-y-1.5">
              {agents.map((a) => {
                const totalHoldings = Object.entries(a.holdings).reduce((acc, [sym, qty]) => {
                  const tk = tokens.find((t) => t.symbol === sym);
                  return acc + (tk ? qty * tk.price : 0);
                }, 0);
                const net = a.cash + totalHoldings;
                return (
                  <div key={a.name} className="flex items-center gap-2 text-xs">
                    <span className="text-base">{a.emoji}</span>
                    <span className="font-display font-bold w-16 truncate text-[#1F1B2E]">{a.name === "you" ? "🧒 You" : a.name}</span>
                    <span className="text-[#7f7f7f] flex-1 text-[10px]">{a.cash.toFixed(0)} · {totalHoldings.toFixed(1)}</span>
                    <span className="text-[#3D2E7C] font-display font-black">≈ {net.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3">
            <div className="flex items-center gap-2 mb-2"><Coins className="w-4 h-4 text-[#7C4DFF]" /><span className="font-display font-bold text-sm text-[#1F1B2E]">Market Activity</span></div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {log.length === 0 && <div className="text-[#7f7f7f] text-xs">Nothing happening yet…</div>}
              {log.map((e, i) => (
                <div key={i} className={`text-[11px] ${e.kind === "buy" ? "text-[#2e7d32]" : e.kind === "sell" ? "text-[#c62828]" : e.kind === "launch" ? "text-[#7C4DFF]" : "text-[#5A4B8A]"}`}>
                  {e.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <KidsMascot message={mascot} />
    </div>
  );
}