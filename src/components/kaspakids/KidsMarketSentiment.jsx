import React from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Real-time AI market sentiment gauge powered by InvokeLLM over live Kaspa data.
export default function KidsMarketSentiment({ sentiment, loading, onAnalyze, lastRun }) {
  const score = sentiment?.score ?? 0;
  const pct = Math.max(0, Math.min(100, (score + 100) / 2));
  const color = score > 20 ? "#5CE1A4" : score < -20 ? "#F96B4C" : "#8B6FF5";
  const label = (sentiment?.sentiment || "neutral").toUpperCase();
  const action = sentiment?.action || "hold";
  const ActionIcon = action === "buy" ? TrendingUp : action === "sell" ? TrendingDown : Minus;
  const actionColor = action === "buy" ? "text-green-400 bg-green-500/20" : action === "sell" ? "text-red-400 bg-red-500/20" : "text-[#8B6FF5] bg-[#8B6FF5]/20";

  return (
    <div className="rounded-2xl bg-[#1f1a2e] border border-[#2d2542] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#8B6FF5]" />
          <span className="font-display font-bold text-sm text-[#EDE9F7]">Slobby AI Sentiment</span>
        </div>
        <span className="flex items-center gap-1 text-[9px] text-[#7A7290] uppercase tracking-widest font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1A4] animate-pulse" /> Live
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-gradient-to-r from-[#F96B4C] via-[#8B6FF5] to-[#5CE1A4] mb-2 overflow-hidden">
        <motion.div
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          className="absolute -top-1 w-5 h-5 rounded-full bg-white border-2 shadow-lg"
          style={{ borderColor: color, marginLeft: "-10px" }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[#7A7290] font-bold uppercase mb-3">
        <span>Bearish</span><span>Neutral</span><span>Bullish</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-black text-lg" style={{ color }}>{label}</div>
          <div className="text-[10px] text-[#7A7290]">Score {score > 0 ? "+" : ""}{score} · conf {sentiment?.confidence ?? 0}%</div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-extrabold ${actionColor}`}>
          <ActionIcon className="w-3.5 h-3.5" /> {action.toUpperCase()}
        </div>
      </div>

      {sentiment?.reason && (
        <p className="text-[11px] text-[#B9A8F5] leading-relaxed mt-3">{sentiment.reason}</p>
      )}
      {sentiment?.news_summary && (
        <p className="text-[10px] text-[#7A7290] leading-relaxed mt-1.5 italic">📰 {sentiment.news_summary}</p>
      )}

      <button
        onClick={onAnalyze}
        disabled={loading}
        className="w-full mt-3 h-9 rounded-xl bg-gradient-to-r from-[#8B6FF5] to-[#7C5CFC] text-white text-xs font-display font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-60"
      >
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing market…</> : <><Brain className="w-3.5 h-3.5" /> Run AI Analysis</>}
      </button>
      {lastRun && <div className="text-[9px] text-[#7A7290] text-center mt-1.5">Last run {lastRun}</div>}
    </div>
  );
}