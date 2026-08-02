import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Wallet, Sparkles, Rocket, TrendingUp, TrendingDown, Bot, Droplets, Plus, Coins, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsMascot from "@/components/kaspakids/KidsMascot";
import KidsMarketChart from "@/components/kaspakids/KidsMarketChart";

const LS_KEY = "kaspakids_state_v1";
const AGENTS = [
  { name: "Pixel", emoji: "🟣", cash: 300, holdings: {} },
  { name: "Nova", emoji: "🌟", cash: 300, holdings: {} },
  { name: "Ziggy", emoji: "⚡", cash: 300, holdings: {} },
  { name: "Mochi", emoji: "🍡", cash: 300, holdings: {} },
];

// Quadratic bonding curve: price(tkas/token) = a*s^2 + b
const A = 0.0005;
const B = 0.5;
const priceAt = (supply) => A * supply * supply + B;
// cost to buy qty tokens starting at supply s (minting new)
const buyCost = (s, qty) => (A / 3) * (Math.pow(s + qty, 3) - Math.pow(s, 3)) + B * qty;
// proceeds from selling qty tokens back to supply s (burning)
const sellProceeds = (s, qty) => (A / 3) * (Math.pow(s, 3) - Math.pow(s - qty, 3)) + B * qty;

export default function KaspaKidsPage() {
  const [wallet, setWallet] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [balance, setBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [agents, setAgents] = useState(AGENTS.map((a) => ({ ...a, holdings: {} })));
  const [log, setLog] = useState([]);
  const [mascot, setMascot] = useState("");
  const [agentsOn, setAgentsOn] = useState(true);
  const [launchForm, setLaunchForm] = useState({ name: "", symbol: "", emoji: "🚀", seed: 50 });
  const [buyQty, setBuyQty] = useState({});
  const tickRef = useRef(null);

  // Load persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setWallet(s.wallet || null);
        setBalance(s.balance || 0);
        setTokens(s.tokens || []);
        setAgents(s.agents || AGENTS.map((a) => ({ ...a, holdings: {} })));
        setLog(s.log || []);
      }
    } catch {}
    setMascot("Hi! I'm Slobby 🟣 Let's learn to trade together!");
  }, []);

  const persist = useCallback((partial) => {
    try {
      const cur = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      localStorage.setItem(LS_KEY, JSON.stringify({ ...cur, ...partial }));
    } catch {}
  }, []);

  useEffect(() => { persist({ wallet, balance, tokens, agents, log }); }, [wallet, balance, tokens, agents, log]);

  const pushLog = useCallback((entry) => {
    setLog((l) => [{ ...entry, t: Date.now() }, ...l].slice(0, 40));
  }, []);

  // Wallet generation
  const generateWallet = async () => {
    setGenerating(true);
    setMascot("Making your very own Kaspa wallet… hold tight! 🪄");
    try {
      const res = await base44.functions.invoke("createKaspaWallet", { wordCount: 12 });
      const w = res.data || res;
      if (!w?.address) throw new Error("No address returned");
      setWallet({ address: w.address, mnemonic: w.mnemonic });
      setBalance(1000);
      setMascot("Done! I gave you 1000 tKAS to play with. Tap the Faucet if you need more! 💧");
      pushLog({ kind: "system", text: "Wallet created · 1000 tKAS granted" });
    } catch (e) {
      setMascot("Oops, couldn't make a wallet: " + (e?.message || "unknown"));
    } finally {
      setGenerating(false);
    }
  };

  const faucet = () => {
    setBalance((b) => b + 500);
    setMascot("💧 +500 tKAS from the faucet! Spend it wisely.");
    pushLog({ kind: "system", text: "Faucet: +500 tKAS" });
  };

  // Launch a token (kid seeds reserve, gets premine)
  const launchToken = () => {
    const name = launchForm.name.trim();
    const symbol = launchForm.symbol.trim().toUpperCase();
    const emoji = launchForm.emoji || "🚀";
    const seed = Math.max(10, Number(launchForm.seed) || 50);
    if (!name || !symbol) { setMascot("Give your token a name and a ticker! 🏷️"); return; }
    if (balance < seed) { setMascot("Not enough tKAS to seed that token. Use the faucet! 💧"); return; }
    if (tokens.find((t) => t.symbol === symbol)) { setMascot("A token with that ticker already exists!"); return; }

    const initialSupply = 20;
    const token = {
      id: Date.now().toString(),
      name, symbol, emoji,
      supply: initialSupply,
      reserve: seed,
      price: priceAt(initialSupply),
      history: [priceAt(initialSupply)],
      creator: "you",
    };
    setBalance((b) => b - seed);
    setTokens((ts) => [token, ...ts]);
    // kid gets the premine
    setAgents((as) => as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [symbol]: initialSupply } } : a));
    // ensure "you" agent exists for holdings tracking
    setAgents((as) => as.some((a) => a.name === "you") ? as : [{ name: "you", emoji: "🧒", cash: 0, holdings: { [symbol]: initialSupply } }, ...as]);
    setMascot(`${emoji} ${symbol} is LIVE! You hold ${initialSupply} ${symbol}. Watch the agents trade it!`);
    pushLog({ kind: "launch", text: `🚀 ${symbol} launched · seed ${seed} tKAS` });
    setLaunchForm({ name: "", symbol: "", emoji: "🚀", seed: 50 });
  };

  // Kid buy/sell
  const kidBuy = (token) => {
    const qty = Number(buyQty[token.id] || 1);
    if (qty <= 0) return;
    const cost = buyCost(token.supply, qty);
    if (balance < cost) { setMascot("Not enough tKAS to buy that many! 💸"); return; }
    setBalance((b) => b - cost);
    setTokens((ts) => ts.map((t) => t.id === token.id ? {
      ...t,
      supply: t.supply + qty,
      reserve: t.reserve + cost,
      price: priceAt(t.supply + qty),
      history: [...t.history, priceAt(t.supply + qty)].slice(-40),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? {
      ...a,
      holdings: { ...a.holdings, [token.symbol]: (a.holdings[token.symbol] || 0) + qty },
    } : a));
    pushLog({ kind: "buy", text: `🧒 You bought ${qty} ${token.symbol} for ${cost.toFixed(2)} tKAS` });
    setMascot(`You bought ${qty} ${token.symbol}! Price just went up 📈`);
  };

  const kidSell = (token) => {
    const qty = Number(buyQty[token.id] || 1);
    if (qty <= 0) return;
    const held = (agents.find((a) => a.name === "you")?.holdings || {})[token.symbol] || 0;
    if (held < qty) { setMascot("You don't own that many to sell! 🧸"); return; }
    const proceeds = sellProceeds(token.supply, qty);
    setBalance((b) => b + proceeds);
    setTokens((ts) => ts.map((t) => t.id === token.id ? {
      ...t,
      supply: t.supply - qty,
      reserve: Math.max(0, t.reserve - proceeds),
      price: priceAt(Math.max(0, t.supply - qty)),
      history: [...t.history, priceAt(Math.max(0, t.supply - qty))].slice(-40),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? {
      ...a,
      holdings: { ...a.holdings, [token.symbol]: Math.max(0, held - qty) },
    } : a));
    pushLog({ kind: "sell", text: `🧒 You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} tKAS` });
    setMascot(`You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} tKAS!`);
  };

  // Agent trading loop
  useEffect(() => {
    if (!agentsOn || tokens.length === 0) return;
    tickRef.current = setInterval(() => {
      setAgents((curAgents) => {
        let working = curAgents.map((a) => ({ ...a, holdings: { ...a.holdings } }));
        setTokens((curTokens) => {
          if (curTokens.length === 0) return curTokens;
          let tks = curTokens.map((t) => ({ ...t, history: [...t.history] }));
          const events = [];
          working.forEach((agent) => {
            if (agent.name === "you") return;
            // pick a random token
            const t = tks[Math.floor(Math.random() * tks.length)];
            if (!t) return;
            const last = t.history.length >= 2 ? t.history[t.history.length - 1] : t.price;
            const prev = t.history.length >= 3 ? t.history[t.history.length - 3] : t.price;
            const momentum = (last - prev) / (prev || 1);
            const held = agent.holdings[t.symbol] || 0;
            const r = Math.random();
            // trend-follow with some randomness
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
              events.push({ kind: "buy", text: `${agent.emoji} ${agent.name} bought ${qty} ${t.symbol}` });
            } else if (action === "sell") {
              const qty = Math.min(held, Math.max(1, Math.floor(held * 0.3)));
              if (qty <= 0) return;
              const proceeds = sellProceeds(t.supply, qty);
              agent.cash += proceeds;
              agent.holdings[t.symbol] = held - qty;
              const tk = tks.find((x) => x.id === t.id);
              tk.supply = Math.max(1, tk.supply - qty); tk.reserve = Math.max(0, tk.reserve - proceeds); tk.price = priceAt(tk.supply);
              tk.history = [...tk.history, tk.price].slice(-40);
              events.push({ kind: "sell", text: `${agent.emoji} ${agent.name} sold ${qty} ${t.symbol}` });
            }
          });
          if (events.length) pushLog(events[0]);
          return tks;
        });
        return working;
      });
    }, 3500);
    return () => clearInterval(tickRef.current);
  }, [agentsOn, tokens.length]);

  if (!wallet) {
    return (
      <div className="relative min-h-screen bg-[#1a1230] overflow-hidden text-white">
        <SlobzBlobs />
        <div className="relative z-10 max-w-md mx-auto px-5 pt-20 pb-32 text-center">
          <Link to="/AppStoreV2" className="absolute top-5 left-5 flex items-center gap-2 text-white/60 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-7xl mb-4">🟣</motion.div>
          <h1 className="text-3xl font-[900] tracking-tight mb-2">Slobz Trading Playground</h1>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Learn how crypto trading works — make a real Kaspa wallet, launch your own tokens (like KRON, but for kids!), and watch friendly AI agents buy & sell. No real money. Just fun. 🎈
          </p>
          <button
            onClick={generateWallet}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-r from-[#9B84F6] to-[#7C5CFC] text-white font-bold text-lg shadow-xl shadow-purple-500/40 disabled:opacity-60"
          >
            {generating ? <><Bot className="w-5 h-5 animate-spin" /> Making your wallet…</> : <><Wallet className="w-5 h-5" /> Create My Kaspa Wallet</>}
          </button>
          <p className="text-white/30 text-[10px] mt-4">Powered by real Kaspa wallet generation · testnet tKAS · bonding curves</p>
        </div>
        <KidsMascot message={mascot} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1a1230] overflow-hidden text-white pb-24">
      <SlobzBlobs />
      {/* Top bar */}
      <div className="relative z-20 sticky top-0 flex items-center justify-between px-3 sm:px-5 h-14 bg-[#1a1230]/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Store
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold">🟣 Slobz Trading</div>
        <button onClick={faucet} className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#9B84F6]/30 border border-[#9B84F6]/50 text-[#c9bcff] text-xs font-bold">
          <Droplets className="w-3.5 h-3.5" /> Faucet
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        {/* Wallet + balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
          <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest mb-1">
            <Wallet className="w-3 h-3" /> My Kaspa Wallet
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-white/70 truncate">{wallet.address}</div>
              <div className="text-[10px] text-white/40">Testnet · keep your seed phrase secret 🤫</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-[900] text-[#c9bcff]">{balance.toFixed(2)}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">tKAS</div>
            </div>
          </div>
          <button onClick={() => setShowSeed((s) => !s)} className="mt-2 flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70">
            {showSeed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSeed ? "Hide" : "Reveal"} seed phrase
          </button>
          {showSeed && (
            <div className="mt-2 p-3 rounded-lg bg-black/40 border border-red-500/30 text-[10px] font-mono text-red-200/80 break-all">
              {wallet.mnemonic}
            </div>
          )}
        </motion.div>

        {/* Launch a token */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-gradient-to-br from-[#9B84F6]/20 to-[#7C5CFC]/10 border border-[#9B84F6]/40 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-4 h-4 text-[#c9bcff]" />
            <h2 className="font-bold text-sm">Launch a Token</h2>
            <span className="text-[9px] text-white/40 uppercase tracking-widest ml-auto">KRC20-style · bonding curve</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={launchForm.name} onChange={(e) => setLaunchForm({ ...launchForm, name: e.target.value })} placeholder="Token Name (e.g. MoonJuice)" className="col-span-2 h-10 px-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#9B84F6]" />
            <input value={launchForm.symbol} onChange={(e) => setLaunchForm({ ...launchForm, symbol: e.target.value })} placeholder="Ticker (e.g. JUICE)" maxLength={6} className="h-10 px-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#9B84F6] uppercase" />
            <div className="flex gap-2">
              <input value={launchForm.emoji} onChange={(e) => setLaunchForm({ ...launchForm, emoji: e.target.value })} placeholder="🚀" className="w-12 h-10 px-2 rounded-xl bg-black/30 border border-white/10 text-white text-center text-lg focus:outline-none focus:border-[#9B84F6]" />
              <input type="number" value={launchForm.seed} onChange={(e) => setLaunchForm({ ...launchForm, seed: e.target.value })} placeholder="Seed tKAS" className="flex-1 h-10 px-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#9B84F6]" />
            </div>
          </div>
          <button onClick={launchToken} className="w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-[#9B84F6] to-[#7C5CFC] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/40">
            <Sparkles className="w-4 h-4" /> Launch {launchForm.symbol || "Token"}
          </button>
        </motion.div>

        {/* Agents toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white/80">
            <Bot className="w-4 h-4 text-[#c9bcff]" /> AI Agents Trading
          </div>
          <button
            onClick={() => setAgentsOn((v) => !v)}
            className={`flex items-center gap-2 h-8 px-3 rounded-full text-xs font-bold border ${agentsOn ? "bg-green-500/20 border-green-400/50 text-green-300" : "bg-white/5 border-white/20 text-white/40"}`}
          >
            {agentsOn ? "● LIVE" : "○ Paused"}
          </button>
        </div>

        {/* Tokens grid */}
        {tokens.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/40 text-sm">
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
                <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{t.symbol}</div>
                      <div className="text-[10px] text-white/40 truncate">{t.name}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="font-bold text-sm">{t.price.toFixed(3)}</div>
                      <div className={`text-[10px] flex items-center justify-end gap-0.5 ${up ? "text-green-400" : "text-red-400"}`}>
                        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <KidsMarketChart data={t.history} />
                  <div className="flex items-center justify-between text-[10px] text-white/40 mt-1 mb-2">
                    <span>Reserve: {t.reserve.toFixed(1)} tKAS</span>
                    <span>You hold: {held}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" value={buyQty[t.id] ?? 1} onChange={(e) => setBuyQty({ ...buyQty, [t.id]: e.target.value })} className="w-14 h-9 px-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-[#9B84F6]" />
                    <button onClick={() => kidBuy(t)} className="flex-1 h-9 rounded-lg bg-green-500/20 border border-green-400/50 text-green-300 text-xs font-bold flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3" /> Buy
                    </button>
                    <button onClick={() => kidSell(t)} className="flex-1 h-9 rounded-lg bg-red-500/20 border border-red-400/50 text-red-300 text-xs font-bold flex items-center justify-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Sell
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Agents leaderboard */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white/80 mb-2">
            <Coins className="w-4 h-4 text-[#c9bcff]" /> Agent Standings
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
                  <span className="font-bold w-16 truncate">{a.name === "you" ? "🧒 You" : a.name}</span>
                  <span className="text-white/40 flex-1">{a.cash.toFixed(0)} tKAS · holdings {totalHoldings.toFixed(1)}</span>
                  <span className="text-[#c9bcff] font-bold">≈ {net.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 mb-8">
          <div className="text-sm font-bold text-white/80 mb-2">📡 Market Activity</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {log.length === 0 && <div className="text-white/30 text-xs">Nothing happening yet…</div>}
            {log.map((e, i) => (
              <div key={i} className={`text-xs ${e.kind === "buy" ? "text-green-300/70" : e.kind === "sell" ? "text-red-300/70" : e.kind === "launch" ? "text-[#c9bcff]" : "text-white/40"}`}>
                {e.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <KidsMascot message={mascot} />
    </div>
  );
}