import React, { useRef, useState } from "react";

const LABEL_W = 116;

function fmt(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const d = Math.floor((t % 1) * 10);
  return `${m}:${String(s).padStart(2, "0")}.${d}`;
}

// Layered timeline: one track row per object, horizontal zoom, scrub, and a
// "back to start" button. Dragging on the canvas while paused keyframes at the
// current playhead; while playing it paints a motion path (see Stage.jsx).
export default function Timeline({ editor }) {
  const { objects, selectedId, selectObject, time, duration, seek, setDuration, togglePlay, playing, stop, removeKeyframe, addObject } = editor;
  const [pxPerSec, setPxPerSec] = useState(90);
  const scrollRef = useRef(null);
  const trackW = Math.max(duration * pxPerSec, 40);

  const zoom = (f) => setPxPerSec((p) => Math.max(30, Math.min(600, Math.round(p * f))));
  const toStart = () => seek(0);
  const addLayer = () => addObject("rect", {});

  const scrubFromX = (clientX) => {
    const el = scrollRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const t = (clientX - r.left + el.scrollLeft - LABEL_W) / pxPerSec;
    seek(Math.max(0, Math.min(duration, t)));
  };
  const onAreaDown = (e) => {
    scrubFromX(e.clientX);
    const move = (ev) => scrubFromX(ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const ticks = [];
  for (let i = 0; i <= duration; i++) ticks.push(i);

  const iconBtn = "w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0";

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-white/80 backdrop-blur-xl border-t border-black/[0.06]" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={toStart} title="Back to start" className={`${iconBtn} bg-black/[0.05] text-[#1d1d1f] hover:bg-black/[0.08]`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="2" y="2" width="2" height="9" rx="0.5"/><path d="M11.5 2.2 L5 6.5 L11.5 10.8 Z"/></svg>
        </button>
        <button onClick={togglePlay} title="Play / Pause" className={`${iconBtn} bg-[#0A84FF] text-white hover:bg-[#0a78e0]`}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1.5" width="2.6" height="9" rx="0.6"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.8 L10 6 L3 10.2 Z"/></svg>
          )}
        </button>
        <button onClick={stop} title="Stop" className={`${iconBtn} bg-black/[0.05] text-[#1d1d1f] hover:bg-black/[0.08]`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><rect x="2.5" y="2.5" width="7" height="7" rx="1"/></svg>
        </button>
        <div className="text-[13px] font-medium text-[#1d1d1f] tabular-nums tracking-tight">
          {fmt(time)} <span className="text-[#86868b]">/ {fmt(duration)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#86868b]">
          <span>Dur</span>
          <input type="number" min="1" max="60" step="1" value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-14 text-center bg-black/[0.04] rounded-lg px-2 py-1 text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0A84FF]/30" />
          <span>s</span>
        </div>
        <div className="flex items-center gap-1 ml-1">
          <button onClick={() => zoom(1 / 1.4)} title="Zoom out" className={`${iconBtn} bg-black/[0.05] text-[#1d1d1f] hover:bg-black/[0.08]`}><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6.5h7"/></svg></button>
          <span className="hidden sm:inline-block text-[11px] text-[#86868b] tabular-nums w-10 text-center">{Math.round(pxPerSec)}px/s</span>
          <button onClick={() => zoom(1.4)} title="Zoom in" className={`${iconBtn} bg-black/[0.05] text-[#1d1d1f] hover:bg-black/[0.08]`}><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6.5h7M6.5 3v7"/></svg></button>
        </div>
        <button onClick={addLayer} title="Add a new layer" className="h-8 px-3 rounded-full bg-[#0A84FF] text-white text-[12px] font-medium hover:bg-[#0a78e0] flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2v8M2 6h8"/></svg>
          Layer
        </button>
      </div>

      <div ref={scrollRef} className="overflow-auto max-h-44 select-none rounded-lg ring-1 ring-black/[0.06]" onPointerDown={onAreaDown}>
        <div style={{ width: LABEL_W + trackW, position: "relative" }}>
          {/* Ruler */}
          <div className="flex sticky top-0 z-20 bg-white/95 backdrop-blur">
            <div style={{ width: LABEL_W, position: "sticky", left: 0 }} className="flex-shrink-0 h-6 border-b border-r border-black/[0.06] bg-white/95" />
            <div style={{ width: trackW }} className="relative h-6 border-b border-black/[0.06]">
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: t * pxPerSec }}>
                  <div className="w-px h-2 bg-black/[0.12]" />
                  <div className="text-[9px] text-[#86868b] tabular-nums">{t}s</div>
                </div>
              ))}
            </div>
          </div>

          {/* One track row per object (layered) */}
          {objects.length === 0 && (
            <div className="flex items-center justify-center h-10 text-[11px] text-[#86868b]">Add an object to create a layer.</div>
          )}
          {objects.map((o) => {
            const kfs = [];
            Object.entries(o.keyframes).forEach(([prop, arr]) => arr.forEach((k) => kfs.push({ t: k.t, prop, id: `${o.id}-${prop}-${k.t}` })));
            const isSel = o.id === selectedId;
            return (
              <div key={o.id} className="flex">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => selectObject(o.id)}
                  style={{ width: LABEL_W, position: "sticky", left: 0 }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2 h-8 text-left text-[11px] truncate border-b border-r border-black/[0.04] ${isSel ? "bg-[#0A84FF]/10 text-[#0A84FF] font-medium" : "bg-white/95 text-[#1d1d1f] hover:bg-black/[0.03]"}`}
                  title={o.name}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSel ? "#0A84FF" : "#c7c7cc" }} />
                  <span className="truncate">{o.name}</span>
                </button>
                <div style={{ width: trackW }} className={`relative h-8 border-b border-black/[0.04] ${isSel ? "bg-[#0A84FF]/[0.03]" : ""}`}>
                  {kfs.map((k) => (
                    <button
                      key={k.id}
                      onPointerDown={(e) => { e.stopPropagation(); seek(k.t); }}
                      onContextMenu={(e) => { e.preventDefault(); removeKeyframe(o.id, k.prop, k.t); }}
                      title={`${k.prop} @ ${k.t.toFixed(2)}s — click to seek, right-click to delete`}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#0A84FF] hover:bg-[#0a78e0] transition-colors"
                      style={{ left: k.t * pxPerSec, borderRadius: 2 }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-[#0A84FF] pointer-events-none z-30" style={{ left: LABEL_W + time * pxPerSec }}>
            <div className="absolute -top-0 -left-[5px] w-[11px] h-[11px] rotate-45 bg-[#0A84FF]" />
          </div>
        </div>
      </div>

      <div className="text-[11px] text-[#86868b]">
        {objects.length === 0
          ? <>Tap + Layer or add an object to create tracks.</>
          : <>Click a layer name to select it. Right-click a diamond to delete. Drag the canvas to keyframe — the line stays put while paused.</>}
      </div>
    </div>
  );
}