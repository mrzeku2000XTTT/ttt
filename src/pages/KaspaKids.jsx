import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Wallet, Sparkles, Rocket, TrendingUp, TrendingDown, Bot, Droplets, Plus, Coins, Eye, EyeOff, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import KidsMascot from "@/components/kaspakids/KidsMascot";
import KidsMarketChart from "@/components/kaspakids/KidsMarketChart";

const MASCOT_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const TESTNET_FAUCET_URL = "https://faucet.kaspanet.io/";
const LS_KEY = "kaspakids_state_v2";

const AGENTS = [
  { name: "Pixel", emoji: "🟣", cash: 300, holdings: {} },
  { name: "Nova", emoji: "🌟", cash: 300, holdings: {} },
  { name: "Ziggy", emoji: "⚡", cash: 300, holdings: {} },
  { name: "Mochi", emoji: "🍡", cash: 300, holdings: {} },
];

// Quadratic bonding curve (like KRON): price(tkas/token) = a*s^2 + b
const A = 0.0005;
const B = 0.5;
const priceAt = (supply) => A * supply * supply + B;
const buyCost = (s, qty) => (A / 3) * (Math.pow(s + qty, 3) - Math.pow(s, 3)) + B * qty;
const sellProceeds = (s, qty) => (A / 3) * (Math.pow(s, 3) - Math.pow(s - qty, 3)) + B * qty;

export default function KaspaKidsPage() {
  const [wallet, setWallet] = useState(null); // { address, testnetAddress, mnemonic, privateKey }
  const [generating, setGenerating] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [realBalance, setRealBalance] = useState(null); // real on-chain TKAS
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [playBalance, setPlayBalance] = useState(1000); // sandbox play money
  const [tokens, setTokens] = useState([]);
  const [agents, setAgents] = useState(() => AGENTS.map((a) => ({ ...a, holdings: {} })));
  const [log, setLog] = useState([]);
  const [mascot, setMascot] = useState("");
  const [agentsOn, setAgentsOn] = useState(true);
  const [launchForm, setLaunchForm] = useState({ name: "", symbol: "", emoji: "🚀", seed: 50 });
  const [buyQty, setBuyQty] = useState({});
  const tickRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.wallet) {
          setWallet(s.wallet);
          fetchBalance(s.wallet.address);
        }
        setPlayBalance(s.playBalance ?? 1000);
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

  useEffect(() => { persist({ wallet, playBalance, tokens, agents, log }); }, [wallet, playBalance, tokens, agents, log]);

  const pushLog = useCallback((entry) => {
    setLog((l) => [{ ...entry, t: Date.now() }, ...l].slice(0, 40));
  }, []);

  // Real testnet wallet generation
  const generateWallet = async () => {
    setGenerating(true);
    setMascot("Making your REAL Kaspa testnet wallet… 🪄");
    try {
      const w = await base44.functions.invoke("createKaspaWallet", { wordCount: 12 });
      const wd = w.data || w;
      if (!wd?.address) throw new Error("No address returned");
      // Convert mainnet kaspa: address → kaspatest: testnet address
      const conv = await base44.functions.invoke("slobzTestnetSend", { action: "convert", address: wd.address });
      const cd = conv.data || conv;
      if (!cd?.testnetAddress) throw new Error("Testnet conversion failed");
      const newWallet = {
        address: wd.address,
        testnetAddress: cd.testnetAddress,
        mnemonic: wd.mnemonic,
        privateKey: wd.privateKey,
      };
      setWallet(newWallet);
      setRealBalance(0);
      setMascot("Your REAL testnet wallet is ready! Tap 'Fund Wallet' to get free TKAS from the faucet. 💧");
      pushLog({ kind: "system", text: "🪪 Real testnet wallet created: " + cd.testnetAddress.slice(0, 20) + "…" });
      fetchBalance(wd.address);
    } catch (e) {
      setMascot("Oops, couldn't make a wallet: " + (e?.message || "unknown"));
    } finally {
      setGenerating(false);
    }
  };

  const fetchBalance = async (addr) => {
    const address = addr || wallet?.address;
    if (!address) return;
    setBalanceLoading(true);
    try {
      const res = await base44.functions.invoke("slobzTestnetSend", { action: "balance", address });
      const d = res.data || res;
      if (d?.success || d?.balanceTkas !== undefined) {
        setRealBalance(d.balanceTkas || 0);
        if (wallet && d.testnetAddress) setWallet((w) => w ? { ...w, testnetAddress: d.testnetAddress } : w);
      }
    } catch (e) {
      setRealBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fundWallet = () => {
    if (!wallet?.testnetAddress) return;
    navigator.clipboard?.writeText(wallet.testnetAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setMascot("I copied your testnet address! Paste it into the faucet to get free TKAS, then tap Refresh. 💧");
    window.open(TESTNET_FAUCET_URL, "_blank", "noopener");
  };

  const copyAddress = () => {
    if (!wallet?.testnetAddress) return;
    navigator.clipboard?.writeText(wallet.testnetAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sandboxTopUp = () => {
    setPlayBalance((b) => b + 500);
    setMascot("💧 +500 play tKAS! (Not real — just for practice.)");
    pushLog({ kind: "system", text: "Sandbox top-up: +500 play tKAS" });
  };

  // Launch a token (kid seeds reserve, gets premine)
  const launchToken = () => {
    const name = launchForm.name.trim();
    const symbol = launchForm.symbol.trim().toUpperCase();
    const emoji = launchForm.emoji || "🚀";
    const seed = Math.max(10, Number(launchForm.seed) || 50);
    if (!name || !symbol) { setMascot("Give your token a name and a ticker! 🏷️"); return; }
    if (playBalance < seed) { setMascot("Not enough play tKAS to seed that token. Top up your sandbox! 💧"); return; }
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
    setPlayBalance((b) => b - seed);
    setTokens((ts) => [token, ...ts]);
    setAgents((as) => {
      const hasYou = as.some((a) => a.name === "you");
      if (!hasYou) as = [{ name: "you", emoji: "🧒", cash: 0, holdings: {} }, ...as];
      return as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [symbol]: initialSupply } } : a);
    });
    setMascot(`${emoji} ${symbol} is LIVE! You hold ${initialSupply} ${symbol}. Watch the agents trade it!`);
    pushLog({ kind: "launch", text: `🚀 ${symbol} launched · seed ${seed} play tKAS` });
    setLaunchForm({ name: "", symbol: "", emoji: "🚀", seed: 50 });
  };

  const kidBuy = (token) => {
    const qty = Number(buyQty[token.id] || 1);
    if (qty <= 0) return;
    const cost = buyCost(token.supply, qty);
    if (playBalance < cost) { setMascot("Not enough play tKAS to buy that many! 💸"); return; }
    setPlayBalance((b) => b - cost);
    setTokens((ts) => ts.map((t) => t.id === token.id ? {
      ...t, supply: t.supply + qty, reserve: t.reserve + cost,
      price: priceAt(t.supply + qty),
      history: [...t.history, priceAt(t.supply + qty)].slice(-40),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [token.symbol]: (a.holdings[token.symbol] || 0) + qty } } : a));
    pushLog({ kind: "buy", text: `🧒 You bought ${qty} ${token.symbol} for ${cost.toFixed(2)} play tKAS` });
    setMascot(`You bought ${qty} ${token.symbol}! Price went up 📈`);
  };

  const kidSell = (token) => {
    const qty = Number(buyQty[token.id] || 1);
    if (qty <= 0) return;
    const held = (agents.find((a) => a.name === "you")?.holdings || {})[token.symbol] || 0;
    if (held < qty) { setMascot("You don't own that many to sell! 🧸"); return; }
    const proceeds = sellProceeds(token.supply, qty);
    setPlayBalance((b) => b + proceeds);
    setTokens((ts) => ts.map((t) => t.id === token.id ? {
      ...t, supply: t.supply - qty, reserve: Math.max(0, t.reserve - proceeds),
      price: priceAt(Math.max(0, t.supply - qty)),
      history: [...t.history, priceAt(Math.max(0, t.supply - qty))].slice(-40),
    } : t));
    setAgents((as) => as.map((a) => a.name === "you" ? { ...a, holdings: { ...a.holdings, [token.symbol]: Math.max(0, held - qty) } } : a));
    pushLog({ kind: "sell", text: `🧒 You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} play tKAS` });
    setMascot(`You sold ${qty} ${token.symbol} for ${proceeds.toFixed(2)} play tKAS!`);
  };

  // AI agent trading loop
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

  if (!wallet) {
    return (
      <div className="relative min-h-screen bg-[#DED6F2] overflow-hidden font-body">
        <SlobzBlobs />
        <div className="relative z-10 max-w-md mx-auto px-5 pt-16 pb-32 text-center text-[#1F1B2E]">
          <Link to="/AppStoreV2" className="absolute top-5 left-5 flex items-center gap-2 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <motion.img
            src={MASCOT_IMG}
            alt="Slobby the Slobz mascot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
            className="w-32 h-32 rounded-[28px] object-cover shadow-[0_16px_40px_rgba(124,92,252,0.4)] mx-auto mb-4"
          />
          <h1 className="font-display text-3xl font-black text-[#3D2E7C] tracking-tight mb-2">Slobz Trading Playground</h1>
          <p className="text-[#5A4B8A] text-sm mb-8 leading-relaxed">
            Learn how crypto trading works — make a <b>real Kaspa testnet wallet</b>, launch your own KRC20-style tokens on a bonding curve (like KRON, but for kids!), and watch friendly AI agents buy &amp; sell. No real money. Just fun. 🎈
          </p>
          <button
            onClick={generateWallet}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-lg shadow-[0_12px_28px_rgba(249,107,76,0.4)] disabled:opacity-60"
          >
            {generating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Making your wallet…</> : <><Wallet className="w-5 h-5" /> Create My Real Testnet Wallet</>}
          </button>
          <p className="text-[#7A7290] text-[10px] mt-4">Real Kaspa testnet-10 address · free TKAS from the faucet · bonding curves</p>
        </div>
        <KidsMascot message={mascot} size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#DED6F2] overflow-hidden font-body text-[#1F1B2E] pb-24">
      <SlobzBlobs />
      {/* Top bar */}
      <div className="relative z-20 sticky top-0 flex items-center justify-between px-3 sm:px-5 h-14 bg-[#DED6F2]/85 backdrop-blur-xl border-b border-[#7C5CFC]/15" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm">
          <ArrowLeft className="w-4 h-4" /> Store
        </Link>
        <div className="flex items-center gap-2 text-sm font-display font-black text-[#3D2E7C]">🟣 Slobz Trading</div>
        <button onClick={sandboxTopUp} className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#7C5CFC]/15 border border-[#7C5CFC]/40 text-[#5A4B8A] text-xs font-display font-bold">
          <Droplets className="w-3.5 h-3.5" /> +Play
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        {/* REAL TESTNET WALLET */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-[#FDFBF7] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded-full bg-[#7C5CFC] text-white text-[9px] font-display font-extrabold tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4] animate-pulse" /> TESTNET-10
            </span>
            <span className="text-[#5A4B8A] text-[10px] tracking-widest font-bold uppercase">Real Kaspa Wallet</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] text-[#3D2E7C] break-all leading-snug">{wallet.testnetAddress}</div>
              <div className="text-[10px] text-[#7A7290] mt-0.5">Keep your seed phrase secret 🤫 (testnet only · no real value)</div>
            </div>
            <div className="text-right flex-shrink-0">
              {balanceLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#7C5CFC] ml-auto" />
              ) : (
                <>
                  <div className="text-2xl font-display font-black text-[#3D2E7C]">{realBalance ?? 0}</div>
                  <div className="text-[10px] text-[#7A7290] uppercase tracking-widest font-bold">TKAS · real</div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={fundWallet} className="flex-1 h-10 rounded-xl bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(249,107,76,0.35)]">
              <ExternalLink className="w-3.5 h-3.5" /> Fund Wallet
            </button>
            <button onClick={() => fetchBalance()} className="h-10 px-3 rounded-xl bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={copyAddress} className="h-10 w-10 rounded-xl bg-[#EBE6F8] text-[#5A4B8A] flex items-center justify-center">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setShowSeed((s) => !s)} className="mt-2 flex items-center gap-1 text-[10px] text-[#7A7290] hover:text-[#3D2E7C]">
            {showSeed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSeed ? "Hide" : "Reveal"} seed phrase
          </button>
          {showSeed && (
            <div className="mt-2 p-3 rounded-xl bg-[#1F1B2E] border border-red-500/30 text-[10px] font-mono text-red-200/80 break-all">
              {wallet.mnemonic}
            </div>
          )}
        </motion.div>

        {/* Sandbox play balance */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-[#5A4B8A] text-xs font-bold">🧪 Sandbox Play Money</div>
          <div className="text-[#3D2E7C] font-display font-black text-lg">{playBalance.toFixed(2)} <span className="text-[10px] text-[#7A7290]">play tKAS</span></div>
        </div>

        {/* Launch a token */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl bg-[#FDFBF7] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-4 mb-4">
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
              <input type="number" value={launchForm.seed} onChange={(e) => setLaunchForm({ ...launchForm, seed: e.target.value })} placeholder="Seed play tKAS" className="flex-1 h-10 px-3 rounded-xl bg-[#F3EFFA] border border-[#E9E4F5] text-[#1F1B2E] text-sm placeholder:text-[#7A7290] focus:outline-none focus:border-[#7C5CFC]" />
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
          <button
            onClick={() => setAgentsOn((v) => !v)}
            className={`flex items-center gap-2 h-8 px-3 rounded-full text-xs font-display font-extrabold border ${agentsOn ? "bg-green-500/20 border-green-500/50 text-green-700" : "bg-[#F3EFFA] border-[#E9E4F5] text-[#7A7290]"}`}
          >
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
                    <span>Reserve: {t.reserve.toFixed(1)}</span>
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

        {/* Agents leaderboard */}
        <div className="rounded-2xl bg-[#FDFBF7] shadow-[0_10px_28px_rgba(124,92,252,0.14)] border border-[#E9E4F5] p-3 mb-4">
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

        {/* Activity log */}
        <div className="rounded-2xl bg-[#FDFBF7] shadow-[0_10px_28px_rgba(124,92,252,0.14)] border border-[#E9E4F5] p-3 mb-8">
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

      <KidsMascot message={mascot} />
    </div>
  );
}