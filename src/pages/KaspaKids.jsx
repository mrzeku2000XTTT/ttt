import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Rocket, TrendingUp, TrendingDown, Bot, Plus, Coins,
  LineChart, GraduationCap, Wallet, Droplets, Brain, BarChart3, ShieldCheck, ArrowRight, Info,
} from "lucide-react";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsMascot from "@/components/kaspakids/KidsMascot";
import KidsMarketChart from "@/components/kaspakids/KidsMarketChart";

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
  { icon: Wallet, color: "#8B6FF5", title: "Real Testnet Wallet", what: "On Pro you get a real Kaspa testnet wallet holding real TKAS (free test coins).", tip: "Here you practice with fake TTT — nothing to lose." },
  { icon: Droplets, color: "#FF8A6B", title: "Faucet & TKAS", what: "Pro uses TKAS from a free faucet. Never real money — just real test coins on a real network.", tip: "You'll fund your Pro wallet with one tap." },
  { icon: BarChart3, color: "#5CE1A4", title: "Bonding Curve", what: "The same math you use here: price rises as more people buy. Pro uses it too.", tip: "You already know how it works!" },
  { icon: Brain, color: "#8B6FF5", title: "AI Market Sentiment", what: "Pro's AI reads real Kaspa news + live price to decide buy/sell. Here, agents just guess.", tip: "Pro AI = real-time, real data." },
  { icon: LineChart, color: "#FF8A6B", title: "Real TradingView Charts", what: "Pro shows live professional charts and a real-time KAS price ticker.", tip: "Learn the basics here, chart like a pro there." },
  { icon: ShieldCheck, color: "#5CE1A4", title: "Risk Rules", what: "Never spend money you can't lose. Pro is testnet, but the habits you build here stick.", tip: "Finish the checklist on Pro before trading." },
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
      }
    } catch {}
    setMascot("Hi! I'm Slobby 🟣 This is the SAFE playground — fake TTT money only. Have fun!");
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ tttBalance, tokens, agents, log }));
    } catch {}
  }, [tttBalance, tokens, agents, log]);

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
    setAgents((as) => {
      const hasYou = as.some((a) => a.name === "you");
      if (!hasYou) as = [{ name: "you", emoji: "🧒", cash: 0, holdings: {} }, ...as];
      return as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [symbol]: initialSupply } } : a);
    });
    setMascot(`${emoji} ${symbol} is LIVE! You hold ${initialSupply} ${symbol}. Watch the agents trade it!`);
    pushLog({ kind: "launch", text: `🚀 ${symbol} launched · seed ${seed} TTT` });
    setLaunchForm({ name: "", symbol: "", emoji: "🚀", seed: 50 });
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
      history: [...t.history, priceAt(t.supply + qty)].slice(-40),
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
      history: [...t.history, priceAt(Math.max(0, t.supply - qty))].slice(-40),
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
              tk.history = [...tk.history, tk.price].slice(-40);
              pushLog({ kind: "buy", text: `${agent.emoji} ${agent.name} bought ${qty} ${t.symbol}` });
            } else if (action === "sell") {
              const qty = Math.min(held, Math.max(1, Math.floor(held * 0.3)));
              if (qty <= 0) return;
              const proceeds = sellProceeds(t.supply, qty);
              agent.cash += proceeds;
              agent.holdings[t.symbol] = held - qty;
              const tk = tks.find((x) => x.id === t.id);
              tk.supply = Math.max(1, tk.supply - qty); tk.reserve = Math.max(0, tk.reserve - proceeds); tk.price = priceAt(tk.supply);
              tk.history = [...tk.history, tk.price].slice(-40);
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

  return (
    <div className="relative min-h-screen bg-[#DED6F2] overflow-hidden font-body text-[#1F1B2E] pb-24">
      <SlobzBlobs />
      {/* Top bar */}
      <div className="relative z-20 sticky top-0 flex items-center justify-between px-3 sm:px-5 h-14 bg-[#DED6F2]/85 backdrop-blur-xl border-b border-[#7C5CFC]/15" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm">
          <ArrowLeft className="w-4 h-4" /> Store
        </Link>
        <div className="flex items-center gap-2 text-sm font-display font-black text-[#3D2E7C]">🟣 Slobz Playground</div>
        <div className="flex items-center gap-2">
          <button onClick={sandboxTopUp} className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#7C5CFC]/15 border border-[#7C5CFC]/40 text-[#5A4B8A] text-xs font-display font-bold">
            <Droplets className="w-3.5 h-3.5" /> +TTT
          </button>
          <Link to="/KaspaKidsDEX" className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold shadow-[0_6px_16px_rgba(249,107,76,0.35)]">
            <LineChart className="w-3.5 h-3.5" /> Pro DEX
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-[#FDFBF7] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-5 sm:p-6 mb-4 flex flex-col sm:flex-row items-center gap-5">
          <motion.img
            src={MASCOT_IMG}
            alt="Slobby the Slobz mascot"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-[24px] object-cover shadow-[0_12px_30px_rgba(124,92,252,0.3)] flex-shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#3D2E7C] tracking-tight">Slobz Trading Playground</h1>
            <p className="text-[#5A4B8A] text-sm mt-1 leading-relaxed">
              The safe place to learn crypto trading. Launch your own tokens on a bonding curve, watch friendly AI agents buy &amp; sell, and get ready for the <b>Pro DEX</b> — all with <b>fake TTT Demo money</b>. You can't lose anything here. 🎈
            </p>
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
              <span className="px-3 py-1.5 rounded-full bg-[#7C5CFC]/15 border border-[#7C5CFC]/40 text-[#5A4B8A] text-xs font-display font-extrabold">🧪 Sandbox · Fake Money</span>
              <span className="px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/40 text-green-700 text-xs font-display font-extrabold">🛡️ Zero Risk</span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-3xl font-display font-black text-[#3D2E7C]">{tttBalance.toFixed(0)}</div>
            <div className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold">TTT Demo Money</div>
          </div>
        </motion.div>

        {/* GET READY FOR PRO */}
        <div className="rounded-3xl bg-[#FDFBF7] shadow-[0_16px_40px_rgba(124,92,252,0.14)] border border-[#EBE6F8] p-5 mb-4">
          <button onClick={() => setShowReady((v) => !v)} className="w-full flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-[#7C5CFC]" />
            <h2 className="font-display font-extrabold text-lg text-[#1F1B2E] text-left">Get Ready for the Pro DEX</h2>
            <span className="ml-auto text-[#7A7290] text-xs">{showReady ? "Hide" : "Show"}</span>
          </button>
          <p className="text-xs text-[#5A4B8A] mb-3">Learn what each thing does here, then jump to Pro when you're ready. Pro uses a <b>real Kaspa testnet wallet</b> with real TKAS — still free, but real on-chain.</p>
          <AnimatePresence>
            {showReady && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {READY_CARDS.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <motion.div key={c.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl bg-[#F3EFFA] border border-[#EBE6F8] p-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: c.color + "22" }}>
                          <Icon className="w-4 h-4" style={{ color: c.color }} />
                        </div>
                        <div className="font-display font-extrabold text-sm text-[#1F1B2E]">{c.title}</div>
                        <div className="text-[11px] text-[#5A4B8A] leading-snug mt-1 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#7C5CFC]" />{c.what}</div>
                        <div className="text-[11px] text-[#7C5CFC] font-bold leading-snug mt-1.5">✓ {c.tip}</div>
                      </motion.div>
                    );
                  })}
                </div>
                <Link to="/KaspaKidsDEX" className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-sm shadow-[0_10px_24px_rgba(249,107,76,0.4)]">
                  I'm Ready — Open the Pro DEX <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Launch a token */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-[#FDFBF7] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-[#7C5CFC]" />
            <h2 className="font-display font-extrabold text-sm text-[#1F1B2E]">Launch a Token</h2>
            <span className="text-[9px] text-[#7A7290] uppercase tracking-widest ml-auto font-bold">KRC20-style · bonding curve</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={launchForm.name} onChange={(e) => setLaunchForm({ ...launchForm, name: e.target.value })} placeholder="Token Name (e.g. MoonJuice)" className="col-span-2 h-10 px-3 rounded-xl bg-[#F3EFFA] border border-[#E9E4F5] text-[#1F1B2E] text-sm placeholder:text-[#7A7290] focus:outline-none focus:border-[#7C5CFC]" />
            <input value={launchForm.symbol} onChange={(e) => setLaunchForm({ ...launchForm, symbol: e.target.value })} placeholder="Ticker (e.g. JUICE)" maxLength={6} className="h-10 px-3 rounded-xl bg-[#F3EFFA] border border-[#E9E4F5] text-[#1F1B2E] text-sm placeholder:text-[#7A7290] focus:outline-none focus:border-[#7C5CFC] uppercase" />
            <div className="flex gap-2">
              <input value={launchForm.emoji} onChange={(e) => setLaunchForm({ ...launchForm, emoji: e.target.value })} placeholder="🚀" className="w-12 h-10 px-2 rounded-xl bg-[#F3EFFA] border border-[#E9E4F5] text-[#1F1B2E] text-center text-lg focus:outline-none focus:border-[#7C5CFC]" />
              <input type="number" value={launchForm.seed} onChange={(e) => setLaunchForm({ ...launchForm, seed: e.target.value })} placeholder="Seed TTT" className="flex-1 h-10 px-3 rounded-xl bg-[#F3EFFA] border border-[#E9E4F5] text-[#1F1B2E] text-sm placeholder:text-[#7A7290] focus:outline-none focus:border-[#7C5CFC]" />
            </div>
          </div>
          <button onClick={launchToken} className="w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-[#8B6FF5] to-[#7C5CFC] text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(124,92,252,0.35)]">
            <Sparkles className="w-4 h-4" /> Launch {launchForm.symbol || "Token"}
          </button>
        </motion.div>

        {/* Agents toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-[#3D2E7C]">
            <Bot className="w-4 h-4 text-[#7C5CFC]" /> AI Agents Trading
          </div>
          <button onClick={() => setAgentsOn((v) => !v)} className={`flex items-center gap-2 h-8 px-3 rounded-full text-xs font-display font-extrabold border ${agentsOn ? "bg-green-500/20 border-green-500/50 text-green-700" : "bg-[#F3EFFA] border-[#E9E4F5] text-[#7A7290]"}`}>
            {agentsOn ? "● LIVE" : "○ Paused"}
          </button>
        </div>

        {/* Tokens grid */}
        {tokens.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#7C5CFC]/30 p-10 text-center text-[#5A4B8A] text-sm bg-[#FDFBF7]/50">
            No tokens yet. Launch your first one above! 🚀
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {tokens.map((t) => {
              const held = (agents.find((a) => a.name === "you")?.holdings || {})[t.symbol] || 0;
              const last = t.history[t.history.length - 1] || t.price;
              const first = t.history[0] || t.price;
              const change = first ? ((last - first) / first) * 100 : 0;
              const up = change >= 0;
              return (
                <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-[#FDFBF7] shadow-[0_10px_28px_rgba(124,92,252,0.14)] border border-[#E9E4F5] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-display font-black text-sm text-[#1F1B2E] truncate">{t.symbol}</div>
                      <div className="text-[10px] text-[#7A7290] truncate">{t.name}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="font-display font-black text-sm text-[#1F1B2E]">{t.price.toFixed(3)}</div>
                      <div className={`text-[10px] flex items-center justify-end gap-0.5 font-bold ${up ? "text-green-600" : "text-red-500"}`}>
                        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <KidsMarketChart data={t.history} />
                  <div className="flex items-center justify-between text-[10px] text-[#7A7290] mt-1 mb-2">
                    <span>Reserve: {t.reserve.toFixed(1)} TTT</span>
                    <span>You hold: {held}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={buyQty[t.id] ?? 1} onChange={(e) => setBuyQty({ ...buyQty, [t.id]: e.target.value })} className="w-14 h-9 px-2 rounded-lg bg-[#F3EFFA] border border-[#E9E4F5] text-[#1F1B2E] text-sm text-center focus:outline-none focus:border-[#7C5CFC]" />
                    <button onClick={() => kidBuy(t)} className="flex-1 h-9 rounded-lg bg-green-500/15 border border-green-500/40 text-green-700 text-xs font-display font-extrabold flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3" /> Buy
                    </button>
                    <button onClick={() => kidSell(t)} className="flex-1 h-9 rounded-lg bg-red-500/15 border border-red-500/40 text-red-600 text-xs font-display font-extrabold flex items-center justify-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Sell
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Agents leaderboard + log */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="rounded-2xl bg-[#FDFBF7] shadow-[0_10px_28px_rgba(124,92,252,0.14)] border border-[#E9E4F5] p-3">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-[#3D2E7C] mb-2">
              <Coins className="w-4 h-4 text-[#7C5CFC]" /> Agent Standings
            </div>
            <div className="space-y-1">
              {agents.map((a) => {
                const totalHoldings = Object.entries(a.holdings).reduce((acc, [sym, qty]) => {
                  const tk = tokens.find((t) => t.symbol === sym);
                  return acc + (tk ? qty * tk.price : 0);
                }, 0);
                const net = a.cash + totalHoldings;
                return (
                  <div key={a.name} className="flex items-center gap-2 text-xs">
                    <span>{a.emoji}</span>
                    <span className="font-display font-bold w-16 truncate text-[#1F1B2E]">{a.name === "you" ? "🧒 You" : a.name}</span>
                    <span className="text-[#7A7290] flex-1">{a.cash.toFixed(0)} · holdings {totalHoldings.toFixed(1)}</span>
                    <span className="text-[#3D2E7C] font-display font-black">≈ {net.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl bg-[#FDFBF7] shadow-[0_10px_28px_rgba(124,92,252,0.14)] border border-[#E9E4F5] p-3">
            <div className="text-sm font-display font-bold text-[#3D2E7C] mb-2">📡 Market Activity</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {log.length === 0 && <div className="text-[#7A7290] text-xs">Nothing happening yet…</div>}
              {log.map((e, i) => (
                <div key={i} className={`text-xs ${e.kind === "buy" ? "text-green-700/70" : e.kind === "sell" ? "text-red-600/70" : e.kind === "launch" ? "text-[#7C5CFC]" : "text-[#5A4B8A]"}`}>
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