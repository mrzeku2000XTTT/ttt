import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const momentumOf = (history) => {
  if (!history || history.length < 2) return 0;
  const last = history[history.length - 1];
  const prev = history[Math.max(0, history.length - 4)];
  return (last - prev) / (prev || 1);
};

const STRATEGY_LABEL = {
  momentum: "Trend Follower",
  contrarian: "Contrarian",
  holder: "Diamond Hands",
  scalper: "Scalper",
  whale: "Whale",
};

export function agentSentiment(agent, token) {
  const m = momentumOf(token?.history);
  switch (agent.strategy) {
    case "momentum":
      return m > 0.001
        ? { l: "Bullish", c: "#4CAF50", r: `Trend up ${(m * 100).toFixed(1)}% — riding the pump 📈` }
        : m < -0.001
        ? { l: "Bearish", c: "#e54848", r: `Trend down ${(m * 100).toFixed(1)}% — cutting losses 📉` }
        : { l: "Neutral", c: "#9f9f9f", r: "No clear trend — sitting out 👀" };
    case "contrarian":
      return m < -0.001
        ? { l: "Bullish", c: "#4CAF50", r: "Price dipped — buying the discount 🟢" }
        : m > 0.002
        ? { l: "Bearish", c: "#e54848", r: "Pump looks tired — selling the rally 🔴" }
        : { l: "Neutral", c: "#9f9f9f", r: "Waiting for a swing to fade 🎯" };
    case "holder":
      return { l: "Bullish", c: "#4CAF50", r: "Believes in the token — holding long term 💎" };
    case "scalper":
      return { l: "Neutral", c: "#9f9f9f", r: "Scalping the noise — quick in & out ⚡" };
    case "whale":
      return (agent.holdings?.[token?.symbol] || 0) > 0
        ? { l: "Bullish", c: "#4CAF50", r: "Accumulating a big position 🐋" }
        : { l: "Neutral", c: "#9f9f9f", r: "Watching for a big entry 🐋" };
    default:
      return { l: "Neutral", c: "#9f9f9f", r: "Thinking…" };
  }
}

export default function KidsAgentCard({ agent, token, tokens, expanded, onToggle }) {
  const allTokens = tokens && tokens.length ? tokens : (token ? [token] : []);
  const totalHoldings = Object.entries(agent.holdings || {}).reduce((acc, [sym, qty]) => {
    const tk = allTokens.find((t) => t.symbol === sym);
    return acc + (tk ? qty * tk.price : 0);
  }, 0);
  // include other tokens' prices via token fallback if provided; here we pass only selected
  const net = agent.cash + totalHoldings;
  const sent = agentSentiment(agent, token);
  const isYou = agent.name === "you";

  return (
    <div className={`rounded-xl border ${expanded ? "bg-[#f3eefa] border-[#e6d9fb]" : "bg-white border-[#efe7fb]"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-2 py-1.5 text-left">
        <span className="text-base">{agent.emoji}</span>
        <span className="font-display font-bold w-16 truncate text-[#1F1B2E] text-xs">{isYou ? "🧒 You" : agent.name}</span>
        {!isYou && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: sent.c }}>
            {sent.l}
          </span>
        )}
        <span className="text-[#7f7f7f] flex-1 text-[10px] text-right">{agent.cash.toFixed(0)} · {totalHoldings.toFixed(1)}</span>
        <span className="text-[#3D2E7C] font-display font-black text-xs">≈{net.toFixed(0)}</span>
        {!isYou && <ChevronDown className={`w-3 h-3 text-[#9f9f9f] transition-transform ${expanded ? "rotate-180" : ""}`} />}
      </button>
      <AnimatePresence>
        {expanded && !isYou && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-2 pb-2 pt-0.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#7f7f7f]">Style</span>
                <span className="text-[10px] font-display font-extrabold text-[#3D2E7C]">{STRATEGY_LABEL[agent.strategy] || agent.strategy}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#7f7f7f]">View</span>
                <span className="text-[10px] font-display font-extrabold" style={{ color: sent.c }}>{sent.l}</span>
              </div>
              <div className="text-[10px] text-[#5A4B8A] leading-snug bg-white rounded-lg px-2 py-1 border border-[#e6d9fb]">💬 {sent.r}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}