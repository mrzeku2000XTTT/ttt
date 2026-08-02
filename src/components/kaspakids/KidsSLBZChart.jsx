import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, Brain, X, ZoomIn, ZoomOut, Maximize2, Calendar, ChevronFirst, ChevronLast } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Timeframes — bucket = minutes of raw 1-min history per candle (like real TradingView aggregation)
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
const DAYS = 30;            // how far back the synthesized history reaches
const DEFAULT_COUNT = 120;  // candles shown by default (recent window)
const MAX_RENDER = 260;     // max candles actually drawn (downsampled beyond this)

// deterministic PRNG so the synthesized back-history is stable across re-renders
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const strSeed = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function fmtTime(ts, bucket) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (bucket >= 1440) return `${d.getMonth() + 1}/${d.getDate()}`;
  if (bucket >= 240) return `${hh}:${mm}`;
  return `${hh}:${mm}`;
}

// merge a window of candles down to <= max candles (TradingView-style downsampling)
function downsample(candles, max) {
  if (candles.length <= max) return candles;
  const k = Math.ceil(candles.length / max);
  const out = [];
  for (let i = 0; i < candles.length; i += k) {
    const slice = candles.slice(i, i + k);
    out.push({
      t: slice[0].t,
      o: slice[0].o, c: slice[slice.length - 1].c,
      h: Math.max(...slice.map((s) => s.h)),
      l: Math.min(...slice.map((s) => s.l)),
    });
  }
  return out;
}

export default function KidsSLBZChart({ token }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 320 });
  const [tf, setTf] = useState("1m");
  const [viewStart, setViewStart] = useState(0);   // first visible tf candle index
  const [viewCount, setViewCount] = useState(DEFAULT_COUNT);
  const [activeTool, setActiveTool] = useState(null);
  const [pins, setPins] = useState([]);
  const [hover, setHover] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [pickDate, setPickDate] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

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

  const bucket = TIMEFRAMES.find((t) => t.id === tf).bucket;
  const history = token?.history?.length ? token.history : [token?.price || 1, token?.price || 1];

  // 1-minute candle series: synthesized back-history (stable, seeded) + real sandbox tail
  const baseCandles = useMemo(() => {
    const total = DAYS * 1440;
    const realLen = Math.min(history.length, total);
    const synthLen = total - realLen;
    const rng = mulberry32(strSeed((token?.symbol || "SLBZ") + ":" + (token?.supply || 0)));
    const out = new Array(total);
    let p = history[0] || 1;
    // build synth backwards from the first known price, then reverse
    const synth = new Array(synthLen);
    for (let i = 0; i < synthLen; i++) {
      const drift = 0.0009;          // slight upward bias (bonding-curve feel)
      const vol = 0.018;
      p = p / (1 + drift + (rng() - 0.5) * vol);
      synth[synthLen - 1 - i] = p;
    }
    const now = Date.now();
    for (let i = 0; i < total; i++) {
      const c = i < synthLen ? synth[i] : history[i - synthLen];
      const o = i > 0 ? out[i - 1].c : c;
      const body = Math.abs(c - o);
      const hi = Math.max(o, c) + body * 0.4 + c * 0.0008;
      const lo = Math.min(o, c) - body * 0.4 - c * 0.0008;
      out[i] = { t: now - (total - 1 - i) * 60000, o, h: hi, l: lo, c };
    }
    return out;
  }, [history, token?.symbol, token?.supply]);

  // aggregate 1-min candles into the selected timeframe
  const tfCandles = useMemo(() => {
    const out = [];
    const groups = Math.ceil(baseCandles.length / bucket);
    for (let g = 0; g < groups; g++) {
      const s = g * bucket, e = s + bucket;
      const slice = baseCandles.slice(s, e);
      if (!slice.length) break;
      out.push({
        i: g, t: slice[0].t,
        o: slice[0].o, c: slice[slice.length - 1].c,
        h: Math.max(...slice.map((x) => x.h)),
        l: Math.min(...slice.map((x) => x.l)),
      });
    }
    return out;
  }, [baseCandles, bucket]);

  const len = tfCandles.length;

  // reset window when timeframe or token changes (NOT on every history tick)
  useEffect(() => {
    const vc = Math.min(DEFAULT_COUNT, len);
    setViewCount(vc);
    setViewStart(Math.max(0, len - vc));
  }, [tf, token?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // clamp window to valid range (handles history growth without resetting user's pan)
  const vc = Math.max(8, Math.min(viewCount, len));
  const vs = Math.max(0, Math.min(viewStart, len - vc));
  const window = useMemo(() => tfCandles.slice(vs, vs + vc), [tfCandles, vs, vc]);
  const candles = useMemo(() => downsample(window, MAX_RENDER), [window]);

  const zoomAt = (factor, anchorPx) => {
    setViewCount((curVC) => {
      const cur = Math.max(8, Math.min(curVC, len));
      const newCount = Math.max(8, Math.min(len, Math.round(cur * factor)));
      if (newCount === cur) return cur;
      // keep the candle under the cursor at the same x position
      const plotWcur = Math.max(10, size.w - PAD.left - PAD.right);
      const ratio = anchorPx != null ? (anchorPx - PAD.left) / plotWcur : 1;
      const globalIdx = vs + Math.round(ratio * (cur - 1));
      const newAnchorIdx = Math.round(ratio * (newCount - 1));
      let newStart = globalIdx - newAnchorIdx;
      newStart = Math.max(0, Math.min(newStart, len - newCount));
      setViewStart(newStart);
      return newCount;
    });
  };

  const panBy = (deltaCandles) => {
    setViewStart((cur) => {
      const curVC = Math.max(8, Math.min(viewCount, len));
      let next = cur + deltaCandles;
      next = Math.max(0, Math.min(next, len - curVC));
      return next;
    });
  };

  // wheel = zoom (cursor-anchored); shift+wheel or horizontal wheel = pan
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const anchorPx = e.clientX - r.left;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const plotWcur = Math.max(10, size.w - PAD.left - PAD.right);
        const candleSpacing = plotWcur / Math.max(1, vc);
        const delta = Math.round(-(e.shiftKey ? e.deltaY : e.deltaX) / candleSpacing);
        if (delta) panBy(delta);
      } else {
        const factor = e.deltaY < 0 ? 0.82 : 1.22;
        zoomAt(factor, anchorPx);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [size.w, vc, vs, len]); // eslint-disable-line react-hooks/exhaustive-deps

  // arrow-key panning
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") { panBy(-Math.max(1, Math.round(vc * 0.1))); }
      else if (e.key === "ArrowRight") { panBy(Math.max(1, Math.round(vc * 0.1))); }
      else if (e.key === "Home") { setViewStart(0); }
      else if (e.key === "End") { setViewStart(Math.max(0, len - vc)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vc, len]); // eslint-disable-line react-hooks/exhaustive-deps

  const fitAll = () => { setViewCount(len); setViewStart(0); };
  const zoomIn = () => zoomAt(0.7, size.w / 2);
  const zoomOut = () => zoomAt(1.4, size.w / 2);
  const goStart = () => setViewStart(0);
  const goNow = () => setViewStart(Math.max(0, len - vc));

  const onPickDate = (val) => {
    setPickDate(val);
    if (!val) return;
    const target = new Date(val + "T00:00:00").getTime();
    // find tf candle closest to that day
    let best = 0, bestDiff = Infinity;
    for (let i = 0; i < tfCandles.length; i++) {
      const d = Math.abs(tfCandles[i].t - target);
      if (d < bestDiff) { bestDiff = d; best = i; }
    }
    let newStart = best - Math.floor(vc / 2);
    newStart = Math.max(0, Math.min(newStart, len - vc));
    setViewStart(newStart);
  };

  const minDateStr = tfCandles.length ? new Date(tfCandles[0].t).toISOString().slice(0, 10) : "";
  const maxDateStr = tfCandles.length ? new Date(tfCandles[tfCandles.length - 1].t).toISOString().slice(0, 10) : "";

  const { w, h } = size;
  const plotW = Math.max(10, w - PAD.left - PAD.right);
  const plotH = Math.max(10, h - PAD.top - PAD.bottom);

  const prices = candles.flatMap((c) => [c.h, c.l]);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
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

  const handlePointerDown = (e) => {
    if (activeTool) return; // drawing, not panning
    const r = e.currentTarget.getBoundingClientRect();
    dragStart.current = { x: e.clientX, vs };
    setDragging(true);
    const move = (ev) => {
      const dx = ev.clientX - dragStart.current.x;
      const candleSpacing = plotW / Math.max(1, vc);
      const delta = Math.round(-dx / candleSpacing);
      let next = dragStart.current.vs + delta;
      next = Math.max(0, Math.min(next, len - vc));
      setViewStart(next);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
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

  const rangeLabel = candles.length > 1
    ? `${new Date(candles[0].t).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(candles[candles.length - 1].t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : "";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ROW 1: timeframe + zoom + date + AI analyze */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-[#e6d9fb] flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-0.5 bg-[#f3eefa] rounded-lg p-0.5">
          {TIMEFRAMES.map((t) => (
            <button key={t.id} onClick={() => setTf(t.id)} className={`h-6 px-2 rounded-md text-[10px] font-display font-extrabold transition-all ${tf === t.id ? "bg-[#7C4DFF] text-white shadow-sm" : "text-[#5A4B8A] hover:text-[#3D2E7C]"}`}>{t.id}</button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 bg-[#f3eefa] rounded-lg p-0.5">
          <button onClick={goStart} title="Jump to start" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><ChevronFirst className="w-3.5 h-3.5" /></button>
          <button onClick={zoomOut} title="Zoom out" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={fitAll} title="Fit all" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><Maximize2 className="w-3 h-3" /></button>
          <button onClick={zoomIn} title="Zoom in" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={goNow} title="Jump to now" className="h-6 w-6 flex items-center justify-center rounded-md text-[#5A4B8A] hover:bg-white"><ChevronLast className="w-3.5 h-3.5" /></button>
        </div>
        <label className="flex items-center gap-1 h-7 px-2 rounded-lg bg-[#f3eefa] border border-[#e6d9fb] cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-[#7C4DFF]" />
          <input type="date" value={pickDate} min={minDateStr} max={maxDateStr} onChange={(e) => onPickDate(e.target.value)} className="bg-transparent text-[10px] font-display font-bold text-[#3D2E7C] outline-none cursor-pointer w-[118px]" />
        </label>
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
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1.5 pointer-events-none">
          <span className="text-[9px] text-[#9f9f9f] bg-white/70 px-2 py-0.5 rounded-full">Scroll = zoom · Shift+Scroll / drag = pan · ←/→ keys too</span>
          {rangeLabel && <span className="text-[9px] text-[#7C4DFF] bg-white/70 px-2 py-0.5 rounded-full font-bold">{rangeLabel} · {vc} {tf}</span>}
        </div>
        <svg ref={svgRef} width={w} height={h} className={`block ${activeTool ? "cursor-crosshair" : dragging ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={handlePointerDown}>
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