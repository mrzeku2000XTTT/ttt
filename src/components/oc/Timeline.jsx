import React, { useRef } from "react";

function fmt(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const d = Math.floor((t % 1) * 10);
  return `${m}:${String(s).padStart(2, "0")}.${d}`;
}

export default function Timeline({ editor }) {
  const { selectedObject, time, duration, seek, setDuration, togglePlay, playing, stop, removeKeyframe } = editor;
  const trackRef = useRef(null);

  const scrub = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    seek(p * duration);
  };
  const onTrackDown = (e) => {
    scrub(e);
    const move = (ev) => scrub(ev);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const kfs = [];
  if (selectedObject) {
    Object.entries(selectedObject.keyframes).forEach(([prop, arr]) => {
      arr.forEach((k) => kfs.push({ t: k.t, prop, id: `${prop}-${k.t}` }));
    });
  }
  const hasKfAtTime = selectedObject && Object.values(selectedObject.keyframes).some((arr) => arr.some((k) => Math.abs(k.t - time) < 0.001));

  const ticks = [];
  for (let i = 0; i <= duration; i++) ticks.push(i);

  return (
    <div className="flex flex-col gap-2 px-5 py-3 bg-white/80 backdrop-blur-xl border-t border-black/[0.06]">
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-[#0A84FF] text-white flex items-center justify-center hover:bg-[#0a78e0] transition-colors flex-shrink-0">
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1.5" width="2.6" height="9" rx="0.6"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.8 L10 6 L3 10.2 Z"/></svg>
          )}
        </button>
        <button onClick={stop} className="w-9 h-9 rounded-full bg-black/[0.05] text-[#1d1d1f] flex items-center justify-center hover:bg-black/[0.08] transition-colors flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><rect x="2.5" y="2.5" width="7" height="7" rx="1"/></svg>
        </button>
        <div className="text-[13px] font-medium text-[#1d1d1f] tabular-nums tracking-tight" style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' }}>
          {fmt(time)} <span className="text-[#86868b]">/ {fmt(duration)}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[12px] text-[#86868b]" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
          <span>Dur</span>
          <input
            type="number" min="1" max="60" step="1" value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-14 text-center bg-black/[0.04] rounded-lg px-2 py-1 text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0A84FF]/30"
          />
          <span>s</span>
        </div>
      </div>

      <div ref={trackRef} onPointerDown={onTrackDown} className="relative h-12 select-none cursor-pointer">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 rounded-lg bg-black/[0.03]" />
        {ticks.map((t) => (
          <div key={t} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${(t / duration) * 100}%` }}>
            <div className="w-px h-2 bg-black/[0.12]" />
            <div className="text-[9px] text-[#86868b] mt-0.5 tabular-nums" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>{t}s</div>
          </div>
        ))}
        {kfs.map((k) => (
          <button
            key={k.id}
            onPointerDown={(e) => { e.stopPropagation(); seek(k.t); }}
            onContextMenu={(e) => { e.preventDefault(); removeKeyframe(selectedObject.id, k.prop, k.t); }}
            title={`${k.prop} @ ${k.t.toFixed(2)}s — click to seek, right-click to delete`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0A84FF] hover:bg-[#0a78e0] transition-colors"
            style={{ left: `${(k.t / duration) * 100}%`, borderRadius: 2 }}
          />
        ))}
        <div className="absolute top-0 bottom-0 w-px bg-[#0A84FF] pointer-events-none" style={{ left: `${(time / duration) * 100}%` }}>
          <div className="absolute -top-0 -left-[5px] w-[11px] h-[11px] rotate-45 bg-[#0A84FF]" />
        </div>
      </div>

      <div className="text-[11px] text-[#86868b]" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
        {selectedObject ? (
          <>Drag the object — the playhead auto-advances and records a motion path. {hasKfAtTime ? "● keyframe here" : "○ no keyframe here"}</>
        ) : (
          <>Select an object to see its keyframes. Right-click a diamond to delete it.</>
        )}
      </div>
    </div>
  );
}