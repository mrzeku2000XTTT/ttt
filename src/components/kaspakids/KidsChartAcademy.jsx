import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, CandlestickChart, TrendingUp, TrendingDown, Minus,
  Activity, BarChart3, Gauge, Ruler, ShieldAlert, Layers, LineChart as LineIcon,
} from "lucide-react";

// Real chart-reading academy — kid-friendly but genuinely teaches technical analysis.
const LESSONS = [
  {
    id: "candles", icon: CandlestickChart, color: "#7C4DFF",
    title: "Candlesticks",
    short: "The building blocks of every chart.",
    body: "Each candle shows 4 prices for a time period: OPEN, HIGH, LOW, CLOSE.",
    points: [
      "🟢 Green candle = price went UP (close higher than open).",
      "🔴 Red candle = price went DOWN (close lower than open).",
      "The thick body shows open→close. The thin wicks (shadows) show the high & low.",
      "Long body = strong move. Short body = indecision. Long wick = price got rejected.",
    ],
    tip: "Wicks tell you where buyers/sellers fought back. A long bottom wick = buyers defended that price.",
  },
  {
    id: "trend", icon: TrendingUp, color: "#4CAF50",
    title: "Trend Lines & Direction",
    short: "Is the market going up, down, or sideways?",
    body: "A trend is the general direction. Connect the swing lows (uptrend) or swing highs (downtrend) with a line.",
    points: [
      "📈 Uptrend: higher highs + higher lows. Buy dips.",
      "📉 Downtrend: lower highs + lower lows. Sell rips.",
      "↔️ Sideways/range: price bouncing between two levels. Trade the edges.",
      "The trend is your friend — until it bends. A broken trend line is an early warning.",
    ],
    tip: "Don't fight the trend. In an uptrend, 'buy the dip' means buy when price pulls back to the trend line.",
  },
  {
    id: "sr", icon: Layers, color: "#FF8A6B",
    title: "Support & Resistance",
    short: "Where price bounces or gets stuck.",
    body: "Support = a price floor buyers defend. Resistance = a ceiling sellers defend.",
    points: [
      "At SUPPORT, lots of buy orders sit → price tends to bounce up.",
      "At RESISTANCE, lots of sell orders sit → price tends to drop.",
      "Old resistance, once broken, often becomes new support (and vice versa).",
      "The more times a level is tested, the stronger it is — and the bigger the move when it breaks.",
    ],
    tip: "Buy near support, sell near resistance. When support breaks, it often becomes resistance.",
  },
  {
    id: "patterns", icon: BarChart3, color: "#7C4DFF",
    title: "Chart Patterns",
    short: "Shapes that hint what happens next.",
    body: "Repeated shapes form from human psychology — they're not magic, but they're probabilistic.",
    points: [
      "🪖 Head & Shoulders: a peak, bigger peak, smaller peak → trend reversal down.",
      "⏺️ Double Top (M): price fails to beat a high twice → bearish. Double Bottom (W): bullish.",
      "📐 Triangles (ascending/descending/symmetrical): price squeezes → breakout coming.",
      "🚩 Flags & Pennants: brief pause after a big move, then continuation.",
    ],
    tip: "Patterns work best with volume confirmation. A breakout on low volume is suspect.",
  },
  {
    id: "volume", icon: Activity, color: "#4CAF50",
    title: "Volume",
    short: "How much was traded — the fuel.",
    body: "Volume = number of coins traded in a period. It confirms whether a move is real.",
    points: [
      "High volume on a breakout = strong, real move. Low volume = weak, fake move.",
      "Volume should expand in the trend direction and shrink on pullbacks.",
      "A spike in volume often marks a top or bottom (climax).",
      "No volume = no conviction. Be careful trading dead markets.",
    ],
    tip: "Price can lie; volume rarely does. Always check the bars under the chart.",
  },
  {
    id: "ma", icon: LineIcon, color: "#FF8A6B",
    title: "Moving Averages (MA)",
    short: "Smooth the noise to see the trend.",
    body: "An average of the last N prices. Common: MA50 (medium) and MA200 (long term).",
    points: [
      "Price above MA = bullish bias. Price below MA = bearish bias.",
      "MA50 crossing above MA200 = 'Golden Cross' (bullish). The reverse = 'Death Cross' (bearish).",
      "MAs act as dynamic support/resistance — price often bounces off them.",
      "Shorter MAs react faster; longer MAs are more reliable but lag.",
    ],
    tip: "When price is far above its MA, it often mean-reverts (pulls back). Don't chase.",
  },
  {
    id: "rsi", icon: Gauge, color: "#7C4DFF",
    title: "RSI (Relative Strength Index)",
    short: "Is it overbought or oversold?",
    body: "RSI goes 0–100. It measures how fast/heavily price has moved.",
    points: [
      "RSI > 70 = overbought (maybe due for a pullback).",
      "RSI < 30 = oversold (maybe due for a bounce).",
      "RSI near 50 = neutral / undecided market.",
      "Divergence: price makes a new high but RSI doesn't = momentum fading → watch out.",
    ],
    tip: "Overbought doesn't mean 'sell now' — in strong trends RSI can stay >70 a long time. Use it with trend.",
  },
  {
    id: "fib", icon: Ruler, color: "#4CAF50",
    title: "Fibonacci Levels",
    short: "Where pullbacks might stop.",
    body: "After a big move, price often retraces a 'Fib' % of it before continuing.",
    points: [
      "Key levels: 23.6%, 38.2%, 50%, 61.8%, 78.6%.",
      "61.8% ('the golden pocket') is the most-watched retracement zone.",
      "Draw Fib from swing low to swing high (uptrend) to find buy zones.",
      "Combine with support/resistance for stronger confluence.",
    ],
    tip: "Fibs are self-fulfilling — many traders watch them, so price reacts. Not magic, just crowd behavior.",
  },
  {
    id: "orders", icon: Minus, color: "#FF8A6B",
    title: "Order Book & Liquidity",
    short: "See the buyers and sellers lined up.",
    body: "The order book shows pending buy (bid) and sell (ask) orders at every price.",
    points: [
      "A thick buy wall = support. A thick sell wall = resistance.",
      "Spread = gap between best bid and best ask. Tight spread = liquid market.",
      "Big orders can be real or 'spoofed' (placed then removed) — don't trust blindly.",
      "Low liquidity = big slippage; your fills get worse on big orders.",
    ],
    tip: "On our bonding curve, price moves up as the reserve grows — a different but related kind of 'order book'.",
  },
  {
    id: "risk", icon: ShieldAlert, color: "#e54848",
    title: "Risk Management",
    short: "The most important lesson of all.",
    body: "Good traders protect capital first, profit second. You can't trade if you're broke.",
    points: [
      "Risk a small fixed % per trade (1–2%), never 'all in'.",
      "Always know your exit BEFORE you enter. Set a stop-loss.",
      "Take profits in pieces — don't greed for the top.",
      "Keep an emotion journal. FOMO and revenge trades destroy accounts.",
    ],
    tip: "On the Pro DEX this is testnet — but practice risk rules like it's real. Habits transfer.",
  },
];

export default function KidsChartAcademy() {
  const [open, setOpen] = useState("candles");

  return (
    <div className="rounded-2xl bg-white shadow-[0_10px_28px_rgba(124,77,255,0.12)] border border-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-[#7C4DFF]" />
        <span className="font-display font-extrabold text-sm text-[#1F1B2E]">Chart Academy</span>
        <span className="ml-auto text-[9px] text-[#7f7f7f] uppercase tracking-widest font-bold">{LESSONS.length} lessons</span>
      </div>
      <p className="text-[10px] text-[#5A4B8A] mb-2 leading-snug">
        Learn to actually <b>read</b> the chart above — candles, trends, patterns, volume, indicators &amp; risk. Tap a lesson.
      </p>
      <div className="space-y-1.5">
        {LESSONS.map((l) => {
          const Icon = l.icon;
          const isOpen = open === l.id;
          return (
            <div key={l.id} className="rounded-xl bg-[#f3eefa] border border-[#e6d9fb] overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : l.id)} className="w-full flex items-center gap-2 p-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: l.color + "22" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: l.color }} />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-display font-extrabold text-xs text-[#1F1B2E]">{l.title}</div>
                  <div className="text-[10px] text-[#7f7f7f] truncate">{l.short}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#7C4DFF] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-2.5 pb-2.5 pt-0">
                      <div className="text-[11px] text-[#1F1B2E] font-bold mb-1.5">{l.body}</div>
                      <ul className="space-y-1">
                        {l.points.map((p, i) => <li key={i} className="text-[11px] text-[#5A4B8A] leading-snug flex gap-1.5"><span className="text-[#7C4DFF] flex-shrink-0">•</span><span>{p}</span></li>)}
                      </ul>
                      <div className="mt-2 p-2 rounded-lg bg-[#7C4DFF]/10 border border-[#7C4DFF]/20 text-[11px] text-[#3D2E7C] font-bold flex items-start gap-1.5">
                        <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#7C4DFF]" /> {l.tip}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}