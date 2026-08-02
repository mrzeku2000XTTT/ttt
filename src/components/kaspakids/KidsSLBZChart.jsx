import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, Brain, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Timeframes — bucket = minutes of raw history per candle (like real TradingView aggregation)
const TIMEFRAMES = [
  { id: "1m", bucket: 1 }, { id: "5m", bucket: 5 }, { id: "15m", bucket: 15 },
  { id: "1h", bucket: 60 }, { id: "4h", bucket: 240 }, { id: "1d", bucket: 1440 },
];

const TOOLS = [
  { id: "trend", emoji: "📈", label: "Trend", color: "#7C4DFF", explain: "Draw along swing lows (up) or highs (down) to show the trend direction." },
  { id: "support", emoji: "🟢", label: "Support", color: "#4CAF50", explain: "A price floor where buyers bounce price UP. Buy near support." },
  { id: "resistance", emoji: "🔴", label: "Resistance", color: "#e54848", explain: "A price ceiling where sellers push price DOWN. Sell near resistance." },
  { id: "dtop", emoji: "⏺️", label: "Double Top", color: "#FF8A6B", explain: "Two highs at the same price → bearish 'M'. Price may drop." },
  { id: "dbot", emoji: "⏺️", label: "Double Bottom", color: "#4CAF50", explain: "Two lows at the same price → bullish 'W'. Price may rise." },
  { id: "hs", emoji: "🪖", label: "Head & Shoulders", color: "#7C4DFF", explain: "Three peaks: small, BIG, small → trend reversal down." },
  { id: "tri", emoji: "📐", label: "Triangle", color: "#FF8A6B", explain: "Price squeezes into a point → a breakout is coming." },
  { id: "flag", emoji: "🚩", label: "Flag", color: "#7C4DFF", explain: "A short pause after a big move → continuation." },
  { id: "breakout", emoji: "💥", label: "Breakout", color: "#4CAF50", explain: "Price smashes through resistance with volume → big move up." },
  { id: "breakdown", emoji: "💧", label: "Breakdown", color: "#e54848", explain: "Price falls through support with volume → big move down." },
];

const PAD = { top: 10, right: 58, bottom: 22, left: 6 };

function fmtTime(ts, bucket) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (bucket >= 1440) return `${d.getMonth() + 1}/${d.getDate()}`;
  if (bucket >= 240) return `${hh}:${mm}`;
  return `${hh}:${mm}`;
}

export default function KidsSLBZChart({ token }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 320 });
  const [tf, setTf] = useState("1m");
  const [viewN, setViewN] = useState(null); // null = fit all; zoom controls candle count
  const [activeTool, setActiveTool] = useState(null);
  const [pins, setPins] = useState([]);
  const [hover, setHover] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect;
        setSize({ w: Math.max(280, r.width), h: Math.max(220, r.height) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // reset zoom when timeframe changes
  useEffect(() => { setViewN(null); }, [tf]);

  const bucket = TIMEFRAMES.find((t) => t.id === tf).bucket;
  const history = token?.history?.length ? token.history : [token?.price || 1, token?.price || 1];

  // base 1-minute candles from raw sandbox history
  const baseCandles = useMemo(() => {
    const n = history.length;
    const now = Date.now();
    return history.map((c, i) => {
      const o = i > 0 ? history[i - 1] : c;
      const body = Math.abs(c - o);
      const hi = Math.max(o, c) + body * 0.4 + c * 0.0008;
      const lo = Math.min(o, c) - body * 0.4 - c * 0.0008;
      return { t: now - (n - 1 - i) * 60000, o, h: hi, l: lo, c };
    });
  }, [history]);

  // aggregate base candles into timeframe candles (this is what makes the chart LOOK different per TF)
  const tfCandles = useMemo(() => {
    const out = [];
    const groups = Math.ceil(baseCandles.length / bucket);
    for (let g = 0; g < groups; g++) {
      const slice = baseCandles.slice(g * bucket, (g + 1) * bucket);
      if (!slice.length) break;
      out.push({
        i: g, t: slice[0].t,
        o: slice[0].o, c: slice[slice.length - 1].c,
        h: Math.max(...slice.map((s) => s.h)),
        l: Math.min(...slice.map((s) => s.l)),
      });
    }
    return out;
  }, [baseCandles, bucket]);

  // visible (zoomed) candles
  const candles = useMemo(() => {
    if (!viewN || viewN >= tfCandles.length) return tfCandles;
    return tfCandles.slice(-viewN);
  }, [tfCandles, viewN]);

  const zoomIn = () => setViewN((n) => Math.max(8, Math.floor((n ?? tfCandles.length) * 0.6)));
  const zoomOut = () => setViewN((n) => {
    const v = Math.ceil((n ?? tfCandles.length) * 1.6);
    return v >= tfCandles.length ? null : v;
  });
  const fit = () => setViewN(null);

  const { w, h } = size;
  const plotW = Math.max(10, w - PAD.left - PAD.right);
  const plotH = Math.max(10, h - PAD.top - PAD.bottom);

  const prices = candles.flatMap((c) => [c.h, c.l]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const padP = (maxP - minP) * 0.12 || maxP * 0.05 || 1;
  const loP = minP - padP;
  const hiP = maxP + padP;

  const xOf = (i) => PAD.left + (candles.length === 1 ? plotW / 2 : (i / (candles.length - 1)) * plotW);
  const yOf = (p) => PAD.top + (1 - (p - loP) / (hiP - loP)) * plotH;
  const candleW = Math.max(1.5, (plotW / candles.length) * 0.62);

  const cross = useMemo(() => {
    if (!hover) return null;
    const { mx, my } = hover;
    if (mx < PAD.left || mx > PAD.left + plotW || my < PAD.top || my > PAD.top + plotH) return null;
    const idx = Math.max(0, Math.min(candles.length - 1, Math.round(((mx - PAD.left) / plotW) * (candles.length - 1))));
    const price = loP + (1 - (my - PAD.top) / plotH) * (hiP - loP);
    return { idx, price, mx, my };
  }, [hover, plotW, plotH, candles.length, loP, hiP]);

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover({ mx: e.clientX - r.left, my: e.clientY - r.top });
  };

  const handlePlotClick = (e) => {
    if (!activeTool) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const xPct = ((mx - PAD.left) / plotW) * 100;
    const yPct = ((my - PAD.top) / plotH) * 100;
    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
    setPins((p) => [...p, { id: Date.now() + Math.random(), xPct, yPct, tool: activeTool }]);
  };

  const runAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setAiResult(null);
    try {
      const recent = history.slice(-40);
      const lo = Math.min(...recent), hi = Math.max(...recent);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a pattern-trading coach for kids in a sandbox. Token "${token?.symbol}" recent prices (oldest→newest): ${JSON.stringify(recent.map((p) => +p.toFixed(4)))}. Current price ${token?.price?.toFixed(4)}. Range ${lo.toFixed(4)}–${hi.toFixed(4)}. 

Name the EXACT chart pattern a real pattern trader would CALL right now (uptrend, downtrend, range/sideways, support hold, resistance hold, double top, double bottom, head & shoulders, inverse head & shoulders, ascending/descending/symmetrical triangle, bull/bear flag, breakout, breakdown, or "no clean pattern"). Then give a concrete TRADE CALL: long / short / wait, with an entry price, a stop-loss price, a target price (all real numbers inside the current range), and the risk:reward ratio (target-entry)/(entry-stop). Explain WHY in 1 short kid-friendly sentence.`,
        response_json_schema: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            confidence: { type: "number" },
            call: { type: "string" },
            entry: { type: "number" },
            stop: { type: "number" },
            target: { type: "number" },
            rr: { type: "number" },
            explanation: { type: "string" },
          },
        },
      });
      setAiResult(res);
    } catch (e) {
      setAiResult({ pattern: "No read", confidence: 0, call: "wait", entry: 0, stop: 0, target: 0, rr: 0, explanation: "I couldn't read the chart right now. Try again!" });
    } finally {
      setAnalyzing(false);
    }
  };

  const activeExplain = TOOLS.find((t) => t.id === activeTool);
  const priceTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => loP + (hiP - loP) * f);
  const timeTickCount = Math.min(6, candles.length);
  const timeTicks = timeTickCount > 1
    ? Array.from({ length: timeTickCount }, (_, k) => Math.round((k / (timeTickCount - 1)) * (candles.length - 1)))
    : [0];

  const callColor = (c) => (c || "").toLowerCase().includes("long") || (c || "").toLowerCase().includes("buy") ? "#4CAF50" : (c || "").toLowerCase().includes("short") || (c || "").toLowerCase().includes("sell") ? "#e54848" : "#7f7f7f";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ROW 1: timeframe + zoom + AI analyze */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-[#e6d9fb] flex-shrink-0">
        <div className="flex items-center gap-0.5 bg-[#f3eefa] rounded-lg p-0.5">
          {TIMEFRAMES.map((t) => (
            <button key={t.id} onClick={() => setTf(t.id)} className={`h-6 px-2 rounded-md text-[10px] font-display font-extrabold transition-all ${tf === t.id ? "bg-[#7C4DFF] text-white shadow-sm" : "text-[#5A4B8A] hover:text-[#3D2E7C]"}`}>{t.id}</button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 bg-[#f3eefa] rounded-lg p-0.5">
          <button onClick={zoomOut} title="Zoom out" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={fit} title="Fit all" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><Maximize2 className="w-3 h-3" /></button>
          <button onClick={zoomIn} title="Zoom in" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>
        <button onClick={runAnalyze} disabled={analyzing} className="ml-auto flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-display font-extrabold text-white shadow-sm disabled:opacity-60 bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0]">
          {analyzing ? <><Sparkles className="w-3.5 h-3.5 animate-spin" /> Reading…</> : <><Brain className="w-3.5 h-3.5" /> AI Auto-Analyze</>}
        </button>
      </div>

      {/* ROW 2: manual pattern tools */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[#e6d9fb] overflow-x-auto scrollbar-hide flex-shrink-0">
        <span className="text-[9px] font-display font-extrabold text-[#7f7f7f] uppercase tracking-widest flex-shrink-0 mr-1">Draw:</span>
        {TOOLS.map((t) => {
          const active = activeTool === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTool(active ? null : t.id)} title={t.explain} className={`flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-display font-bold whitespace-nowrap border flex-shrink-0 transition-all ${active ? "text-white border-transparent" : "bg-[#f3eefa] text-[#5A4B8A] border-[#e6d9fb]"}`} style={active ? { background: t.color } : {}}>
              <span className="text-[11px]">{t.emoji}</span>{t.label}
            </button>
          );
        })}
        {pins.length > 0 && (
          <button onClick={() => setPins([])} className="flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-display font-bold bg-[#fff0f0] text-[#c62828] border border-[#f3d0d0] flex-shrink-0">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <AnimatePresence>
        {activeExplain && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0 border-b border-[#e6d9fb]">
            <div className="px-3 py-1 flex items-start gap-2" style={{ background: activeExplain.color + "12" }}>
              <span className="text-sm leading-none mt-0.5">{activeExplain.emoji}</span>
              <div className="text-[10px] text-[#1F1B2E] leading-snug"><b style={{ color: activeExplain.color }}>{activeExplain.label}:</b> {activeExplain.explain} <span className="text-[#7f7f7f]">— tap the chart to drop a pin.</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI CALL */}
      <AnimatePresence>
        {aiResult && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0 border-b border-[#e6d9fb]">
            <div className="px-3 py-2 bg-[#f3eefa] relative">
              <button onClick={() => setAiResult(null)} className="absolute top-1.5 right-1.5 text-[#7f7f7f] hover:text-[#1F1B2E]"><X className="w-3.5 h-3.5" /></button>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-base">🧠</span>
                <span className="text-[11px] font-display font-extrabold text-[#3D2E7C]">Pattern: <span className="text-[#7C4DFF]">{aiResult.pattern}</span></span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-[#e6d9fb]" style={{ color: (aiResult.confidence || 0) >= 60 ? "#2e7d32" : (aiResult.confidence || 0) >= 35 ? "#FF8A6B" : "#c62828" }}>{aiResult.confidence}% sure</span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ background: callColor(aiResult.call) }}>{(aiResult.call || "wait").toUpperCase()}</span>
              </div>
              {aiResult.entry ? (
                <div className="flex items-center gap-1.5 mb-1 flex-wrap text-[10px] font-mono font-bold">
                  <span className="text-[#7f7f7f] font-display font-bold">CALL:</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#e6d9fb]">Entry <span className="text-[#3D2E7C]">{aiResult.entry.toFixed(3)}</span></span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#f3d0d0]">Stop <span className="text-[#c62828]">{aiResult.stop.toFixed(3)}</span></span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#cdeacd]">Target <span className="text-[#2e7d32]">{aiResult.target.toFixed(3)}</span></span>
                  <span className="px-1.5 py-0.5 rounded bg-[#7C4DFF] text-white">RR {Number(aiResult.rr || 0).toFixed(1)}:1</span>
                </div>
              ) : null}
              <div className="text-[10px] text-[#1F1B2E] leading-snug pr-5">{aiResult.explanation}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHART */}
      <div ref={wrapRef} className="relative flex-1 min-h-0" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {!activeTool && !hover && (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 text-[9px] text-[#9f9f9f] bg-white/70 px-2 py-0.5 rounded-full pointer-events-none">Hover for price · Tap a tool to call a pattern · Switch TF to re-aggregate candles</div>
        )}
        <svg width={w} height={h} className="block">
          {priceTicks.map((p, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={yOf(p)} x2={PAD.left + plotW} y2={yOf(p)} stroke="#7C4DFF" strokeOpacity="0.06" strokeWidth="1" />
              <text x={PAD.left + plotW + 4} y={yOf(p) + 3} fontSize="9" fill="#7f7f7f" fontFamily="monospace">{p.toFixed(3)}</text>
            </g>
          ))}
          {timeTicks.map((idx) => {
            const c = candles[idx];
            if (!c) return null;
            return (
              <g key={idx}>
                <line x1={xOf(idx)} y1={PAD.top} x2={xOf(idx)} y2={PAD.top + plotH} stroke="#7C4DFF" strokeOpacity="0.04" strokeWidth="1" />
                <text x={xOf(idx)} y={h - 6} fontSize="8.5" fill="#7f7f7f" fontFamily="monospace" textAnchor="middle">{fmtTime(c.t, bucket)}</text>
              </g>
            );
          })}

          {candles.map((c, i) => {
            const up = c.c >= c.o;
            const color = up ? "#4CAF50" : "#e54848";
            const x = xOf(i);
            const yO = yOf(c.o), yC = yOf(c.c), yH = yOf(c.h), yL = yOf(c.l);
            const top = Math.min(yO, yC);
            const bodyH = Math.max(1, Math.abs(yC - yO));
            return (
              <g key={i}>
                <line x1={x} y1={yH} x2={x} y2={yL} stroke={color} strokeWidth="1" />
                <rect x={x - candleW / 2} y={top} width={candleW} height={bodyH} fill={color} rx="0.5" />
              </g>
            );
          })}

          {candles.length > 0 && (() => {
            const last = candles[candles.length - 1];
            const y = yOf(last.c);
            return (
              <g>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#7C4DFF" strokeWidth="1" strokeDasharray="3 3" />
                <rect x={PAD.left + plotW + 1} y={y - 7} width={PAD.right - 2} height={14} fill="#7C4DFF" rx="2" />
                <text x={PAD.left + plotW + 5} y={y + 3} fontSize="9" fill="#fff" fontFamily="monospace" fontWeight="700">{last.c.toFixed(3)}</text>
              </g>
            );
          })()}

          {cross && (
            <g pointerEvents="none">
              <line x1={cross.mx} y1={PAD.top} x2={cross.mx} y2={PAD.top + plotH} stroke="#9f9f9f" strokeWidth="1" strokeDasharray="2 2" />
              <line x1={PAD.left} y1={cross.my} x2={PAD.left + plotW} y2={cross.my} stroke="#9f9f9f" strokeWidth="1" strokeDasharray="2 2" />
              <rect x={PAD.left + plotW + 1} y={cross.my - 7} width={PAD.right - 2} height={14} fill="#1F1B2E" rx="2" />
              <text x={PAD.left + plotW + 5} y={cross.my + 3} fontSize="9" fill="#fff" fontFamily="monospace" fontWeight="700">{cross.price.toFixed(3)}</text>
              {(() => { const c = candles[cross.idx]; if (!c) return null; return (<g><rect x={cross.mx - 18} y={PAD.top + plotH + 2} width={36} height={13} fill="#1F1B2E" rx="2" /><text x={cross.mx} y={PAD.top + plotH + 11} fontSize="8.5" fill="#fff" fontFamily="monospace" textAnchor="middle">{fmtTime(c.t, bucket)}</text></g>); })()}
            </g>
          )}
        </svg>

        <div className="absolute" style={{ left: PAD.left, top: PAD.top, width: plotW, height: plotH }} onClick={handlePlotClick}>
          {pins.map((pin) => {
            const t = TOOLS.find((x) => x.id === pin.tool);
            if (!t) return null;
            return (
              <motion.div key={pin.id} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none" style={{ left: `${(pin.xPct / 100) * plotW}px`, top: `${(pin.yPct / 100) * plotH}px` }}>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-display font-extrabold text-white shadow whitespace-nowrap" style={{ background: t.color }}>
                  <span className="text-[9px]">{t.emoji}</span>{t.label}
                </div>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent" style={{ borderTop: `4px solid ${t.color}` }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}