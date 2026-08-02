import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Rocket, TrendingUp, TrendingDown, Bot, Plus, Coins,
  LineChart, GraduationCap, Wallet, Droplets, Brain, BarChart3, ShieldCheck, ArrowRight, Info, Radio,
  Users, DoorOpen, RefreshCw, UserPlus, X, Eye, EyeOff,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsMascot from "@/components/kaspakids/KidsMascot";
import KidsMarketChart from "@/components/kaspakids/KidsMarketChart";
import KidsSLBZChart from "@/components/kaspakids/KidsSLBZChart";
import KidsChartAcademy from "@/components/kaspakids/KidsChartAcademy";
import KidsAgentCard from "@/components/kaspakids/KidsAgentCard";

const MASCOT_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const LS_KEY = "kaspakids_state_v4";

// Agent pool — each has an independent strategy so they DON'T just copy the user
const AGENT_POOL = [
  { name: "Pixel", emoji: "🟣", strategy: "momentum" },
  { name: "Nova", emoji: "🌟", strategy: "contrarian" },
  { name: "Ziggy", emoji: "⚡", strategy: "scalper" },
  { name: "Mochi", emoji: "🍡", strategy: "holder" },
  { name: "Bolt", emoji: "🔵", strategy: "momentum" },
  { name: "Pip", emoji: "🟡", strategy: "scalper" },
  { name: "Echo", emoji: "🩵", strategy: "contrarian" },
  { name: "Tofu", emoji: "🤍", strategy: "holder" },
  { name: "Comet", emoji: "☄️", strategy: "momentum" },
  { name: "Gummy", emoji: "🐻", strategy: "whale" },
  { name: "Pickle", emoji: "🥒", strategy: "contrarian" },
  { name: "Bubo", emoji: "🦉", strategy: "whale" },
];
const STARTER_AGENTS = ["Pixel", "Nova", "Ziggy", "Mochi"];

// Quadratic bonding curve (KRON-style)
const A = 0.0005;
const B = 0.5;
const priceAt = (supply) => A * supply * supply + B;
const buyCost = (s, qty) => (A / 3) * (Math.pow(s + qty, 3) - Math.pow(s, 3)) + B * qty;
const sellProceeds = (s, qty) => (A / 3) * (Math.pow(s, 3) - Math.pow(s - qty, 3)) + B * qty;

const momentumOf = (history) => {
  if (!history || history.length < 2) return 0;
  const last = history[history.length - 1];
  const prev = history[Math.max(0, history.length - 4)];
  return (last - prev) / (prev || 1);
};

// Independent strategy decision — agents act on their own logic, NOT the user's last move
function decideAction(agent, token, rng) {
  const m = momentumOf(token.history);
  const held = agent.holdings[token.symbol] || 0;
  const price = token.price || 0.1;
  const buyQtyFor = (frac) => Math.max(1, Math.floor((agent.cash * frac) / price));
  switch (agent.strategy) {
    case "momentum":
      if (m > 0.001 && rng < 0.5) return { action: "buy", qty: buyQtyFor(0.12) };
      if (m < -0.001 && rng < 0.5 && held > 0) return { action: "sell", qty: Math.max(1, Math.floor(held * 0.4)) };
      if (rng < 0.12) return { action: "buy", qty: 1 };
      return null;
    case "contrarian":
      if (m < -0.001 && rng < 0.5) return { action: "buy", qty: buyQtyFor(0.1) };
      if (m > 0.002 && rng < 0.5 && held > 0) return { action: "sell", qty: Math.max(1, Math.floor(held * 0.5)) };
      if (rng < 0.12) return { action: "buy", qty: 1 };
      return null;
    case "holder":
      if (rng < 0.3) return { action: "buy", qty: buyQtyFor(0.08) };
      if (rng < 0.04 && held > 2) return { action: "sell", qty: Math.max(1, Math.floor(held * 0.1)) };
      return null;
    case "scalper":
      if (rng < 0.35) return { action: "buy", qty: Math.max(1, Math.floor((agent.cash * 0.05) / price)) };
      if (rng < 0.5 && held > 0) return { action: "sell", qty: Math.max(1, Math.floor(held * 0.3)) };
      return null;
    case "whale":
      if (rng < 0.15 && agent.cash > price * 3) return { action: "buy", qty: buyQtyFor(0.3) };
      if (rng < 0.12 && held > 0) return { action: "sell", qty: Math.max(1, Math.floor(held * 0.4)) };
      return null;
    default:
      return null;
  }
}

const READY_CARDS = [
  { icon: Wallet, color: "#7C4DFF", title: "Real Testnet Wallet", what: "On Pro you get a real Kaspa testnet wallet with real TKAS (free test coins).", tip: "Here you practice with fake TTT — nothing to lose." },
  { icon: Droplets, color: "#FF8A6B", title: "Faucet & TKAS", what: "Pro uses TKAS from a free faucet. Never real money — just real test coins.", tip: "You'll fund your Pro wallet with one tap." },
  { icon: BarChart3, color: "#4CAF50", title: "Bonding Curve", what: "The same math you use here: price rises as more people buy. Pro uses it too.", tip: "You already know how it works!" },
  { icon: Brain, color: "#7C4DFF", title: "AI Sentiment", what: "Pro's AI reads real Kaspa news + live price to decide buy/sell. Here, agents guess.", tip: "Pro AI = real-time, real data." },
  { icon: LineChart, color: "#FF8A6B", title: "Real Charts", what: "Pro shows live TradingView charts + a real KAS price ticker.", tip: "Learn the basics here, chart like a pro there." },
  { icon: ShieldCheck, color: "#4CAF50", title: "Risk Rules", what: "Never spend money you can't lose. Pro is testnet, but habits stick.", tip: "Finish the checklist on Pro before trading." },
];

// collapsible card wrapper so any widget can be hidden
function Card({ title, icon: Icon, open, onToggle, children, right, bodyClass }) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3">
      <button onClick={onToggle} className="w-full flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#7C4DFF]" />}
        <span className="font-display font-extrabold text-sm text-[#1F1B2E]">{title}</span>
        {right}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-[#7f7f7f]">
          {open ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className={bodyClass || "mt-2"}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KaspaKidsPage() {
  const [tttBalance, setTttBalance] = useState(1000);
  const [tokens, setTokens] = useState([]);
  const [agents, setAgents] = useState(() => STARTER_AGENTS.map((n) => { const p = AGENT_POOL.find((a) => a.name === n); return { ...p, cash: 300, holdings: {} }; }));
  const [log, setLog] = useState([]);
  const [mascot, setMascot] = useState("");
  const [agentsOn, setAgentsOn] = useState(true);
  const [autoJoin, setAutoJoin] = useState(true);
  const [launchForm, setLaunchForm] = useState({ name: "", symbol: "", emoji: "🚀", seed: 50, supply: 100 });
  const [buyQty, setBuyQty] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);

  // widget visibility
  const [showReady, setShowReady] = useState(true);
  const [showLaunch, setShowLaunch] = useState(true);
  const [showAcademy, setShowAcademy] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showAgentsPanel, setShowAgentsPanel] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  // public demos
  const [showDemos, setShowDemos] = useState(false);
  const [demos, setDemos] = useState([]);
  const [loadingDemos, setLoadingDemos] = useState(false);
  const [sharing, setSharing] = useState(false);

  // refs for the agent tick loop (avoid stale closures / nested setState)
  const tokensRef = useRef(tokens); useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  const agentsRef = useRef(agents); useEffect(() => { agentsRef.current = agents; }, [agents]);
  const agentsOnRef = useRef(agentsOn); useEffect(() => { agentsOnRef.current = agentsOn; }, [agentsOn]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setTttBalance(s.tttBalance ?? 1000);
        setTokens(s.tokens || []);
        setAgents(() => (s.agents || STARTER_AGENTS.map((n) => { const p = AGENT_POOL.find((a) => a.name === n); return { ...p, cash: 300, holdings: {} }; })).map((a) => a.strategy ? a : { ...a, strategy: (AGENT_POOL.find((p) => p.name === a.name) || {}).strategy || "momentum" }));
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
    const supply = Math.max(10, Math.min(5000, Number(launchForm.supply) || 100)); // scarcity set at launch
    if (!name || !symbol) { setMascot("Give your token a name and a ticker! 🏷️"); return; }
    if (tttBalance < seed) { setMascot("Not enough TTT to seed that. Tap +TTT for more Demo money! 💧"); return; }
    if (tokens.find((t) => t.symbol === symbol)) { setMascot("A token with that ticker already exists!"); return; }

    const token = {
      id: Date.now().toString(), name, symbol, emoji,
      supply, reserve: seed, price: priceAt(supply), // lower supply = scarcer = pricier
      history: [priceAt(supply)], creator: "you", maxSupply: supply,
    };
    setTttBalance((b) => b - seed);
    setTokens((ts) => [token, ...ts]);
    setSelectedId(token.id);
    setAgents((as) => {
      let next = as.some((a) => a.name === "you") ? as : [{ name: "you", emoji: "🧒", cash: 0, holdings: {} }, ...as];
      return next.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [symbol]: supply } } : a);
    });
    setMascot(`${emoji} ${symbol} is LIVE! Supply ${supply} (scarce!) — you hold all ${supply}. Watch the agents trade it!`);
    pushLog({ kind: "launch", text: `🚀 ${symbol} launched · supply ${supply} · seed ${seed} TTT` });
    setLaunchForm({ name: "", symbol: "", emoji: "🚀", seed: 50, supply: 100 });
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
      price: priceAt(t.supply + qty), history: [...t.history, priceAt(t.supply + qty)].slice(-60),
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
      ...t, supply: Math.max(0, t.supply - qty), reserve: Math.max(0, t.reserve - proceeds),
      price: priceAt(Math.max(0, t.supply - qty)), history: [...t.history, priceAt(Math.max(0, t.supply - qty))].slice(-60),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [token.symbol]: Math.max(0, held - qty) } } : a));
    pushLog({ kind: "sell", text: `🧒 You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} TTT` });
    setMascot(`You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} TTT!`);
  };

  // ---- Agent trading loop (clean, ref-based, independent strategies) ----
  useEffect(() => {
    const id = setInterval(() => {
      if (!agentsOnRef.current) return;
      const curTokens = tokensRef.current;
      const curAgents = agentsRef.current;
      if (!curTokens.length) return;
      const newTokens = curTokens.map((t) => ({ ...t, history: [...t.history] }));
      const newAgents = curAgents.map((a) => ({ ...a, holdings: { ...a.holdings } }));
      const newLogs = [];

      newAgents.forEach((agent) => {
        if (agent.name === "you") return;
        const t = newTokens[Math.floor(Math.random() * newTokens.length)];
        if (!t) return;
        const decision = decideAction(agent, t, Math.random());
        if (!decision) return;
        const { action, qty } = decision;
        if (action === "buy") {
          const cost = buyCost(t.supply, qty);
          if (agent.cash < cost) return;
          agent.cash -= cost;
          agent.holdings[t.symbol] = (agent.holdings[t.symbol] || 0) + qty;
          t.supply += qty; t.reserve += cost; t.price = priceAt(t.supply);
          t.history = [...t.history, t.price].slice(-60);
          newLogs.push({ kind: "buy", text: `${agent.emoji} ${agent.name} bought ${qty} ${t.symbol}` });
        } else if (action === "sell") {
          const held = agent.holdings[t.symbol] || 0;
          if (held < qty) return;
          const proceeds = sellProceeds(t.supply, qty);
          agent.cash += proceeds;
          agent.holdings[t.symbol] = held - qty;
          t.supply = Math.max(1, t.supply - qty); t.reserve = Math.max(0, t.reserve - proceeds); t.price = priceAt(t.supply);
          t.history = [...t.history, t.price].slice(-60);
          newLogs.push({ kind: "sell", text: `${agent.emoji} ${agent.name} sold ${qty} ${t.symbol}` });
        }
      });

      if (newLogs.length) {
        setTokens(newTokens);
        setAgents(newAgents);
        setLog((l) => [...newLogs.reverse(), ...l].slice(0, 40));
      }
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // ---- Auto agent join / exit (random) ----
  useEffect(() => {
    if (!autoJoin) return;
    const id = setInterval(() => {
      setAgents((cur) => {
        const nonYou = cur.filter((a) => a.name !== "you");
        const roll = Math.random();
        // 45% join a new agent, 35% remove an existing one, 20% nothing
        if (roll < 0.45 && nonYou.length < 8) {
          const used = new Set(cur.map((a) => a.name));
          const avail = AGENT_POOL.filter((p) => !used.has(p.name));
          if (!avail.length) return cur;
          const pick = avail[Math.floor(Math.random() * avail.length)];
          const newcomer = { ...pick, cash: 200 + Math.floor(Math.random() * 200), holdings: {} };
          setLog((l) => [{ kind: "system", text: `🚪 ${pick.emoji} ${pick.name} joined the sandbox!`, t: Date.now() }, ...l].slice(0, 40));
          const youIdx = cur.findIndex((a) => a.name === "you");
          const arr = [...cur];
          arr.splice(youIdx >= 0 ? youIdx + 1 : 0, 0, newcomer);
          return arr;
        }
        if (roll < 0.8 && nonYou.length > 2) {
          const victim = nonYou[Math.floor(Math.random() * nonYou.length)];
          setLog((l) => [{ kind: "system", text: `🚪 ${victim.emoji} ${victim.name} left the sandbox`, t: Date.now() }, ...l].slice(0, 40));
          return cur.filter((a) => a.name !== victim.name);
        }
        return cur;
      });
    }, 9000 + Math.random() * 8000);
    return () => clearInterval(id);
  }, [autoJoin]);

  const addAgentManual = () => {
    setAgents((cur) => {
      const used = new Set(cur.map((a) => a.name));
      const avail = AGENT_POOL.filter((p) => !used.has(p.name));
      if (!avail.length) { setMascot("No more agents available to add! 🐥"); return cur; }
      const pick = avail[Math.floor(Math.random() * avail.length)];
      setMascot(`${pick.emoji} ${pick.name} joined the sandbox!`);
      pushLog({ kind: "system", text: `🚪 ${pick.emoji} ${pick.name} joined the sandbox!` });
      const youIdx = cur.findIndex((a) => a.name === "you");
      const arr = [...cur];
      arr.splice(youIdx >= 0 ? youIdx + 1 : 0, 0, { ...pick, cash: 300, holdings: {} });
      return arr;
    });
  };

  const removeAgentManual = (name) => {
    setAgents((cur) => cur.filter((a) => a.name !== name));
    pushLog({ kind: "system", text: `🚪 ${name} left the sandbox` });
  };

  // ---- Public demos: share & join ----
  const loadDemos = async () => {
    setLoadingDemos(true);
    try {
      const list = await base44.entities.KaspaKidsDemo.list("-created_date", 24);
      setDemos(list || []);
    } catch (e) {
      setDemos([]);
    } finally {
      setLoadingDemos(false);
    }
  };

  const shareDemo = async () => {
    setSharing(true);
    try {
      const code = Math.random().toString(36).slice(2, 6).toUpperCase();
      const snapshot = {
        tttBalance,
        tokens,
        agents: agents.map((a) => ({ name: a.name, emoji: a.emoji, strategy: a.strategy, cash: a.cash, holdings: a.holdings })),
        log: log.slice(0, 20),
      };
      await base44.entities.KaspaKidsDemo.create({
        room_name: `${tokens.length} token(s) · ${agents.filter((a) => a.name !== "you").length} agents`,
        creator_name: "a kid",
        code,
        snapshot,
      });
      setMascot(`Demo shared! Code ${code} 🎉 Friends can join it from "Join a Demo".`);
      loadDemos();
    } catch (e) {
      setMascot("Couldn't share the demo right now — try again!");
    } finally {
      setSharing(false);
    }
  };

  const joinDemo = (d) => {
    const s = d.snapshot || {};
    setTttBalance(s.tttBalance ?? 1000);
    setTokens(s.tokens || []);
    setAgents(() => (s.agents && s.agents.length ? s.agents.map((a) => a.strategy ? a : { ...a, strategy: "momentum" }) : STARTER_AGENTS.map((n) => { const p = AGENT_POOL.find((x) => x.name === n); return { ...p, cash: 300, holdings: {} }; })));
    setLog(s.log || []);
    if (s.tokens?.length) setSelectedId(s.tokens[0].id);
    setShowDemos(false);
    setMascot(`Joined "${d.room_name}" (code ${d.code})! It's your sandbox now — keep playing!`);
  };

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
          <button onClick={() => { setShowDemos(true); loadDemos(); }} className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/70 border border-[#7C4DFF]/20 text-[#5A4B8A] text-xs font-display font-bold">
            <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Demos</span>
          </button>
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
        {/* LEFT: get ready + launch + academy */}
        <div className="flex flex-col gap-2 pr-1 scrollbar-hide order-3 lg:order-none lg:overflow-y-auto">
          <Card title="Get Ready for Pro" icon={GraduationCap} open={showReady} onToggle={() => setShowReady((v) => !v)}>
            <div className="space-y-2">
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
              <Link to="/KaspaKidsDEX" className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-xs shadow-[0_8px_20px_rgba(249,107,76,0.35)]">
                I'm Ready — Open Pro <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          <Card title="Launch a Token" icon={Rocket} open={showLaunch} onToggle={() => setShowLaunch((v) => !v)} right={<span className="text-[9px] text-[#7f7f7f] uppercase tracking-widest font-bold ml-1">Bonding curve</span>}>
            <div className="grid grid-cols-2 gap-2">
              <input value={launchForm.name} onChange={(e) => setLaunchForm({ ...launchForm, name: e.target.value })} placeholder="Token Name" className="col-span-2 h-9 px-3 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF]" />
              <input value={launchForm.symbol} onChange={(e) => setLaunchForm({ ...launchForm, symbol: e.target.value })} placeholder="Ticker" maxLength={6} className="h-9 px-3 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF] uppercase" />
              <div className="flex gap-1.5">
                <input value={launchForm.emoji} onChange={(e) => setLaunchForm({ ...launchForm, emoji: e.target.value })} placeholder="🚀" className="w-10 h-9 px-1 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-center text-base focus:outline-none focus:border-[#7C4DFF]" />
                <input type="number" value={launchForm.seed} onChange={(e) => setLaunchForm({ ...launchForm, seed: e.target.value })} placeholder="Seed TTT" className="flex-1 h-9 px-2 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF]" />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#7f7f7f]">Supply (scarcity!) — lower = pricier</label>
                <input type="number" value={launchForm.supply} onChange={(e) => setLaunchForm({ ...launchForm, supply: e.target.value })} placeholder="100" className="w-full h-9 px-2 mt-1 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] text-[#1F1B2E] text-xs focus:outline-none focus:border-[#7C4DFF]" />
                <div className="text-[9px] text-[#7C4DFF] font-bold mt-1">Launch price ≈ {priceAt(Math.max(10, Number(launchForm.supply) || 100)).toFixed(2)} TTT per token</div>
              </div>
            </div>
            <button onClick={launchToken} className="w-full mt-2 h-10 rounded-xl bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0] text-white font-display font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(124,77,255,0.3)]">
              <Sparkles className="w-3.5 h-3.5" /> Launch {launchForm.symbol || "Token"}
            </button>
          </Card>

          <Card title="Chart Academy" icon={GraduationCap} open={showAcademy} onToggle={() => setShowAcademy((v) => !v)} bodyClass="">
            <KidsChartAcademy />
          </Card>
        </div>

        {/* CENTER: chart + active token */}
        <div className="flex flex-col gap-2 min-h-0 order-1 lg:order-none">
          <Card title={selected ? `${selected.symbol} · Live Sandbox Chart` : "SLBZ · Live Sandbox Chart"} icon={LineChart} open={showChart} onToggle={() => setShowChart((v) => !v)} right={<span className="text-[9px] text-[#7f7f7f] ml-1 hidden sm:inline">TradingView-style</span>} bodyClass="">
            <div className="h-[55vh] lg:h-[52vh] min-h-0">
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
          </Card>

          <Card title={selected ? `${selected.emoji} ${selected.symbol} · Trade` : "Active Token"} icon={Coins} open={showActive} onToggle={() => setShowActive((v) => !v)} bodyClass="">
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
                <button onClick={() => setShowLaunch(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0] text-white text-xs font-display font-extrabold">
                  <Rocket className="w-3.5 h-3.5" /> Launch a Token
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: agents + activity */}
        <div className="flex flex-col gap-2 pr-1 scrollbar-hide min-h-0 order-2 lg:order-none lg:overflow-y-auto">
          <Card title={`AI Agents`} icon={Bot} open={showAgentsPanel} onToggle={() => setShowAgentsPanel((v) => !v)} right={<span className="text-[#7C4DFF] font-black ml-1">{agents.filter((a) => a.name !== "you").length}</span>} bodyClass="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <button onClick={() => setAgentsOn((v) => !v)} className={`flex items-center gap-1 h-7 px-2.5 rounded-full text-[10px] font-display font-extrabold border ${agentsOn ? "bg-[#4CAF50]/20 border-[#4CAF50]/50 text-[#2e7d32]" : "bg-[#f3eefa] border-[#e6d9fb] text-[#7f7f7f]"}`}>
                {agentsOn ? "● LIVE" : "○ PAUSED"}
              </button>
              <button onClick={() => setAutoJoin((v) => !v)} className={`flex items-center gap-1 h-7 px-2.5 rounded-full text-[10px] font-display font-extrabold border ${autoJoin ? "bg-[#7C4DFF]/20 border-[#7C4DFF]/50 text-[#3D2E7C]" : "bg-[#f3eefa] border-[#e6d9fb] text-[#7f7f7f]"}`}>
                <DoorOpen className="w-3 h-3" /> {autoJoin ? "AUTO JOIN" : "STATIC"}
              </button>
              <button onClick={addAgentManual} className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[10px] font-display font-extrabold border bg-[#f3eefa] border-[#e6d9fb] text-[#5A4B8A]">
                <UserPlus className="w-3 h-3" /> Add
              </button>
            </div>
            {agents.map((a) => (
              <KidsAgentCard key={a.name} agent={a} token={selected} tokens={tokens} expanded={expandedAgent === a.name} onToggle={() => setExpandedAgent((v) => v === a.name ? null : a.name)} />
            ))}
            <div className="text-[9px] text-[#7f7f7f] mt-1 flex items-center gap-1"><Info className="w-2.5 h-2.5 text-[#7C4DFF]" /> Tap an agent to see their sentiment + reason. Each plays their own style — not yours!</div>
          </Card>

          <Card title="Market Activity" icon={Coins} open={showActivity} onToggle={() => setShowActivity((v) => !v)} bodyClass="">
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {log.length === 0 && <div className="text-[#7f7f7f] text-xs">Nothing happening yet…</div>}
              {log.map((e, i) => (
                <div key={i} className={`text-[11px] ${e.kind === "buy" ? "text-[#2e7d32]" : e.kind === "sell" ? "text-[#c62828]" : e.kind === "launch" ? "text-[#7C4DFF]" : "text-[#5A4B8A]"}`}>
                  {e.text}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* PUBLIC DEMOS MODAL */}
      <AnimatePresence>
        {showDemos && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDemos(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-10 bottom-10 sm:w-[460px] z-[71] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#e6d9fb]">
              <div className="flex items-center gap-2 px-4 h-12 border-b border-[#e6d9fb] flex-shrink-0">
                <Users className="w-4 h-4 text-[#7C4DFF]" />
                <span className="font-display font-extrabold text-sm text-[#1F1B2E]">Sandbox Demos</span>
                <button onClick={() => setShowDemos(false)} className="ml-auto text-[#7f7f7f]"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 border-b border-[#e6d9fb]">
                <button onClick={shareDemo} disabled={sharing} className="w-full h-10 rounded-xl bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0] text-white font-display font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(124,77,255,0.3)] disabled:opacity-60">
                  {sharing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sharing…</> : <><DoorOpen className="w-3.5 h-3.5" /> Share My Sandbox</>}
                </button>
                <div className="text-[10px] text-[#7f7f7f] mt-1.5 text-center">Friends can see your tokens & agents, then load it to play along!</div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7f7f7f]">Public Demos</span>
                  <button onClick={loadDemos} className="flex items-center gap-1 text-[10px] text-[#7C4DFF] font-bold"><RefreshCw className={`w-3 h-3 ${loadingDemos ? "animate-spin" : ""}`} /> Refresh</button>
                </div>
                {loadingDemos && <div className="text-center text-[#7f7f7f] text-xs py-6">Loading demos…</div>}
                {!loadingDemos && demos.length === 0 && <div className="text-center text-[#7f7f7f] text-xs py-6">No demos shared yet. Be the first!</div>}
                {!loadingDemos && demos.map((d) => (
                  <div key={d.id} className="rounded-xl border border-[#e6d9fb] bg-[#f3eefa] p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎮</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-extrabold text-xs text-[#1F1B2E] truncate">{d.room_name}</div>
                        <div className="text-[10px] text-[#7f7f7f]">code <span className="font-mono font-bold text-[#7C4DFF]">{d.code}</span> · {new Date(d.created_date).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => joinDemo(d)} className="h-8 px-3 rounded-full bg-[#7C4DFF] text-white text-[11px] font-display font-extrabold flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" /> Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <KidsMascot message={mascot} />
    </div>
  );
}