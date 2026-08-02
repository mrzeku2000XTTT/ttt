import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Rocket, CheckCircle2, LineChart, TrendingUp, TrendingDown, Coins, Droplets, Brain, ShieldCheck, CandlestickChart } from "lucide-react";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";

const MASCOT = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";

const LESSONS = [
  {
    n: 1, icon: Coins, color: "#7C4DFF", title: "What is a Token?",
    body: "A token is a digital coin you can trade. Every token has a SUPPLY — how many coins exist. Fewer coins = rarer = usually pricier.",
    tip: "In the playground you LAUNCH your own token and pick its supply!",
  },
  {
    n: 2, icon: Droplets, color: "#FF8A6B", title: "Price & Supply / Demand",
    body: "Price moves because of buyers and sellers. More people want to BUY than SELL → price goes UP. More people want to SELL → price goes DOWN.",
    tip: "When the AI agents all rush to buy, watch the price climb. 📈",
  },
  {
    n: 3, icon: LineChart, color: "#4CAF50", title: "The Bonding Curve",
    body: "Our playground uses a bonding curve: the more tokens that are bought, the higher the price goes — automatically. Sell some, and price comes down.",
    tip: "Same math real tokens like KRON use. Buy early = cheaper! 🟣",
  },
  {
    n: 4, icon: CandlestickChart, color: "#7C4DFF", title: "Candlesticks",
    body: "Each candle shows 4 things: Open, High, Low, Close. Green candle = price went UP that period. Red candle = price went DOWN.",
    tip: "Switch the timeframe (1m, 5m, 1h, 1d) to see bigger or smaller candles.",
  },
  {
    n: 5, icon: TrendingUp, color: "#4CAF50", title: "Trends",
    body: "An UPTREND = higher highs and higher lows (price climbing). A DOWNTREND = lower highs and lower lows (price falling). SIDEWAYS = price stuck in a range.",
    tip: "Trade WITH the trend, not against it. 'The trend is your friend.' 🤝",
  },
  {
    n: 6, icon: ShieldCheck, color: "#FF8A6B", title: "Support & Resistance",
    body: "SUPPORT = a price floor where buyers keep bouncing price up. RESISTANCE = a ceiling where sellers push price back down. Smart traders buy near support, sell near resistance.",
    tip: "Use the chart tools to draw support (🟢) and resistance (🔴) lines.",
  },
  {
    n: 7, icon: Brain, color: "#7C4DFF", title: "Chart Patterns",
    body: "Double Top (M) → price may drop. Double Bottom (W) → price may rise. Head & Shoulders → trend reversal. Triangles & flags → a breakout is coming.",
    tip: "Tap a pattern tool, then tap the chart to label what you see.",
  },
  {
    n: 8, icon: TrendingDown, color: "#e54848", title: "Buy / Sell / Wait",
    body: "Don't just buy because you're excited. Have a PLAN: an entry price, a stop-loss (where you admit you're wrong), and a target (where you take profit).",
    tip: "The AI Auto-Analyze button gives you a real trade call with entry, stop & target!",
  },
  {
    n: 9, icon: ShieldCheck, color: "#4CAF50", title: "Risk Rules",
    body: "NEVER spend money you can't afford to lose. Here it's all FAKE TTT Demo money — so practice the habits now, for free. On the Pro DEX it's real testnet coins (still free, but real).",
    tip: "Finish this lesson and you're ready for the Pro DEX. 🛡️",
  },
  {
    n: 10, icon: Brain, color: "#7C4DFF", title: "The AI Agents",
    body: "Each agent has its OWN strategy: Trend Follower, Contrarian, Diamond Hands, Scalper, Whale. They think for themselves — they don't copy you. Watch their sentiment to learn different styles.",
    tip: "Tap an agent to see WHY they're bullish or bearish right now.",
  },
];

export default function KaspaKidsAcademyPage() {
  const [done, setDone] = useState({});

  const allDone = LESSONS.every((l) => done[l.n]);

  return (
    <div className="relative min-h-screen bg-[#e0d7f5] font-body text-[#1F1B2E] overflow-x-hidden">
      <SlobzBlobs />

      {/* TOP BAR */}
      <div className="relative z-20 flex items-center gap-3 h-14 px-3 sm:px-5 border-b border-[#7C4DFF]/15 bg-[#e0d7f5]/85 backdrop-blur-xl sticky top-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Store</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-display font-black text-[#3D2E7C]">🎓 <span>Slobz Trading Academy</span></div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-[#7C4DFF]/20">
          <span className="text-[10px] text-[#7f7f7f] uppercase tracking-widest font-bold">Progress</span>
          <span className="font-display font-black text-sm text-[#3D2E7C]">{Object.keys(done).length}/{LESSONS.length}</span>
        </div>
      </div>

      {/* HERO */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-2 text-center">
        <motion.img
          src={MASCOT}
          alt="Slobby"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] object-cover shadow-[0_12px_30px_rgba(124,92,252,0.35)] mx-auto -rotate-3"
        />
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display font-black text-2xl sm:text-3xl text-[#3D2E7C] tracking-tight mt-3">
          Learn Trading First 🟣
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#5A4B8A] text-sm mt-2 max-w-md mx-auto">
          Before you touch the playground, Slobby will teach you everything you need to know. Finish all 10 lessons, then enter the sandbox like a pro.
        </motion.p>
      </div>

      {/* LESSONS */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-4 space-y-3 pb-28">
        {LESSONS.map((l, idx) => {
          const Icon = l.icon;
          const isDone = done[l.n];
          return (
            <motion.div
              key={l.n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border p-4 ${isDone ? "border-[#4CAF50]/40" : "border-white"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: l.color + "22" }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: l.color }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full" style={{ background: l.color }}>LESSON {l.n}</span>
                  <h3 className="font-display font-extrabold text-base text-[#1F1B2E]">{l.title}</h3>
                </div>
                {isDone && <CheckCircle2 className="w-5 h-5 text-[#4CAF50] ml-auto flex-shrink-0" />}
              </div>
              <p className="text-sm text-[#5A4B8A] leading-relaxed">{l.body}</p>
              <div className="mt-2.5 rounded-xl bg-[#f3eefa] border border-[#e6d9fb] px-3 py-2 flex items-start gap-2">
                <Rocket className="w-3.5 h-3.5 text-[#7C4DFF] mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#3D2E7C] font-bold leading-snug">{l.tip}</span>
              </div>
              <button
                onClick={() => setDone((d) => ({ ...d, [l.n]: !d[l.n] }))}
                className={`mt-3 h-9 px-4 rounded-full text-xs font-display font-extrabold flex items-center gap-1.5 transition-all ${isDone ? "bg-[#4CAF50]/20 text-[#2e7d32] border border-[#4CAF50]/50" : "bg-[#7C4DFF] text-white shadow-[0_6px_16px_rgba(124,77,255,0.3)]"}`}
              >
                {isDone ? <><CheckCircle2 className="w-3.5 h-3.5" /> Got it!</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Mark as learned</>}
              </button>
            </motion.div>
          );
        })}

        {/* FINAL GATE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 text-center border ${allDone ? "bg-gradient-to-br from-[#7C4DFF] to-[#6b3fe0] border-transparent" : "bg-white border-[#e6d9fb]"}`}
        >
          {allDone ? (
            <>
              <div className="text-3xl mb-1">🎉</div>
              <h3 className="font-display font-black text-lg text-white">You're ready!</h3>
              <p className="text-white/80 text-sm mt-1 mb-3">You finished every lesson. Enter the Slobz Trading Playground.</p>
              <Link to="/KaspaKids" className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full bg-white text-[#3D2E7C] font-display font-extrabold text-sm shadow-lg">
                <Rocket className="w-4 h-4" /> Enter the Playground
              </Link>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1">🔒</div>
              <h3 className="font-display font-black text-base text-[#1F1B2E]">Finish all 10 lessons to unlock the playground</h3>
              <p className="text-[#7f7f7f] text-xs mt-1">{LESSONS.length - Object.keys(done).length} lesson(s) left — tap "Mark as learned" on each.</p>
            </>
          )}
        </motion.div>
      </div>

      {/* FLOATING CTA when all done */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-2 w-full max-w-sm">
          <Link to="/KaspaKids" className="flex items-center justify-center gap-1.5 h-12 w-full rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-sm shadow-[0_12px_30px_rgba(249,107,76,0.45)]">
            <Rocket className="w-4 h-4" /> Enter the Playground →
          </Link>
        </motion.div>
      )}
    </div>
  );
}