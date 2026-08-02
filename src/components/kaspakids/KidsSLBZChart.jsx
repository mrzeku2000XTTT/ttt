import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Hand, Rocket } from "lucide-react";

// Pattern "calls" traders actually use — kids learn the real vocabulary.
const TOOLS = [
  { id: "trend", emoji: "📈", label: "Trend Line", color: "#7C4DFF",
    explain: "Traders draw this along swing lows (uptrend) or swing highs (downtrend) to show the market's direction." },
  { id: "support", emoji: "🟢", label: "Support", color: "#4CAF50",
    explain: "A price floor where buyers keep bouncing price UP. Traders buy near support." },
  { id: "resistance", emoji: "🔴", label: "Resistance", color: "#e54848",
    explain: "A price ceiling where sellers keep pushing price DOWN. Traders sell near resistance." },
  { id: "dtop", emoji: "⏺️", label: "Double Top", color: "#FF8A6B",
    explain: "Two highs at the SAME price → traders call it a bearish 'M'. Signals price may drop." },
  { id: "dbot", emoji: "⏺️", label: "Double Bottom", color: "#4CAF50",
    explain: "Two lows at the SAME price → traders call it a bullish 'W'. Signals price may rise." },
  { id: "hs", emoji: "🪖", label: "Head & Shoulders", color: "#7C4DFF",
    explain: "Three peaks: small, BIG, small → traders call it a trend reversal to the downside." },
  { id: "tri", emoji: "📐", label: "Triangle", color: "#FF8A6B",
    explain: "Price squeezes into a point (ascending/descending/symmetrical) → a BREAKOUT is coming." },
  { id: "flag", emoji: "🚩", label: "Flag", color: "#7C4DFF",
    explain: "A short pause after a big move → traders call it continuation. Price keeps going the same way." },
  { id: "cup", emoji: "🪃", label: "Cup & Handle", color: "#4CAF50",
    explain: "A rounded bottom (cup) + a small dip (handle) → traders call it bullish continuation." },
  { id: "fib", emoji: "🎯", label: "Fibonacci", color: "#FF8A6B",
    explain: "Traders measure pullback %: 38.2%, 50%, 61.8%. The 'golden pocket' 61.8% is the hot zone." },
  { id: "breakout", emoji: "💥", label: "Breakout", color: "#4CAF50",
    explain: "Price SMASHES through resistance with volume → traders call it a breakout, big move up." },
  { id: "breakdown", emoji: "💧", label: "Breakdown", color: "#e54848",
    explain: "Price FALLS through support with volume → traders call it a breakdown, big move down." },
];

export default function KidsSLBZChart({ token }) {
  const [activeTool, setActiveTool] = useState(null);
  const [pins, setPins] = useState([]);

  const history = token?.history?.length ? token.history : [token?.price || 1, token?.price || 1];
  const stats = useMemo(() => {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const first = history[0];
    const last = history[history.length - 1];
    const change = first ? ((last - first) / first) * 100 : 0;
    return { min, max, last, change };
  }, [history]);

  const pad = 0.08;
  const range = Math.max(1e-6, stats.max - stats.min);
  const lo = stats.min - range * pad;
  const hi = stats.max + range * pad;
  const W = 100, H = 100;

  const toXY = (p, i) => {
    const x = history.length === 1 ? 50 : (i / (history.length - 1)) * W;
    const y = H - ((p - lo) / (hi - lo)) * H;
    return [x, y];
  };
  const linePath = history.map((p, i) => { const [x, y] = toXY(p, i); return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`; }).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const handleChartClick = (e) => {
    if (!activeTool) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPins((p) => [...p, { id: Date.now() + Math.random(), x, y, tool: activeTool }]);
  };

  const activeExplain = TOOLS.find((t) => t.id === activeTool);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* TOOLBAR — pattern calls like TradingView */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#e6d9fb] overflow-x-auto scrollbar-hide flex-shrink-0">
        <span className="text-[9px] font-display font-extrabold text-[#7f7f7f] uppercase tracking-widest flex-shrink-0 mr-1">Call:</span>
        {TOOLS.map((t) => {
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(active ? null : t.id)}
              className={`flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-display font-bold whitespace-nowrap border flex-shrink-0 transition-all ${active ? "text-white border-transparent shadow-sm" : "bg-[#f3eefa] text-[#5A4B8A] border-[#e6d9fb] hover:border-[#7C4DFF]/40"}`}
              style={active ? { background: t.color } : {}}
              title={t.explain}
            >
              <span className="text-[11px]">{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
        {pins.length > 0 && (
          <button onClick={() => setPins([])} className="flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-display font-bold whitespace-nowrap bg-[#fff0f0] text-[#c62828] border border-[#f3d0d0] flex-shrink-0">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* HINT — teaches what traders call the active pattern */}
      <AnimatePresence>
        {activeExplain && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 border-b border-[#e6d9fb]"
          >
            <div className="px-3 py-1.5 flex items-start gap-2" style={{ background: activeExplain.color + "12" }}>
              <span className="text-base flex-shrink-0 leading-none mt-0.5">{activeExplain.emoji}</span>
              <div className="text-[10px] text-[#1F1B2E] leading-snug">
                <b style={{ color: activeExplain.color }}>What traders call this:</b> {activeExplain.explain}
                <span className="text-[#7f7f7f]"> — tap the chart to drop a pin & label it.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHART */}
      <div className="relative flex-1 min-h-0 overflow-hidden" onClick={handleChartClick}>
        {!activeTool && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 text-[9px] text-[#9f9f9f] bg-white/70 px-2 py-0.5 rounded-full pointer-events-none">
            Pick a tool above, then tap the chart to call a pattern
          </div>
        )}

        {/* supply + price readout */}
        <div className="absolute top-2 right-2 z-10 text-right pointer-events-none">
          <div className="text-[9px] text-[#7f7f7f] uppercase tracking-widest font-bold">Price</div>
          <div className="font-display font-black text-sm text-[#1F1B2E] leading-none">{stats.last.toFixed(3)} <span className="text-[9px] text-[#7f7f7f]">TTT</span></div>
          <div className={`text-[10px] font-display font-extrabold ${stats.change >= 0 ? "text-[#2e7d32]" : "text-[#c62828]"}`}>{stats.change >= 0 ? "▲" : "▼"} {Math.abs(stats.change).toFixed(1)}%</div>
        </div>
        <div className="absolute bottom-2 left-2 z-10 text-left pointer-events-none">
          <div className="inline-flex items-center gap-1.5 bg-[#f3eefa] border border-[#e6d9fb] rounded-full px-2 py-0.5">
            <span className="text-[9px] text-[#7f7f7f] uppercase tracking-widest font-bold">Supply</span>
            <span className="text-[11px] font-display font-black text-[#7C4DFF]">{token?.supply ?? 0}</span>
            <span className="text-[9px] text-[#7f7f7f]">{token?.symbol}</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="slbzFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C4DFF" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#7C4DFF" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="#7C4DFF" strokeOpacity="0.07" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={areaPath} fill="url(#slbzFill)" />
          <path d={linePath} fill="none" stroke="#7C4DFF" strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* last point */}
          {(() => { const [x, y] = toXY(stats.last, history.length - 1); return <circle cx={x} cy={y} r="1.1" fill="#7C4DFF" />; })()}
        </svg>

        {/* PINS — pattern call labels */}
        {pins.map((pin) => {
          const t = TOOLS.find((x) => x.id === pin.tool);
          if (!t) return null;
          return (
            <motion.div
              key={pin.id}
              initial={{ opacity: 0, scale: 0.4, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-display font-extrabold text-white shadow-md whitespace-nowrap" style={{ background: t.color }}>
                <span className="text-[10px]">{t.emoji}</span>{t.label}
              </div>
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px]" style={{ borderTopColor: t.color }} />
              <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: t.color }} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}