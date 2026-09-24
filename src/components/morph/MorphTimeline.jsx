import React, { useRef, useState } from 'react';
import { layerKeyTimes, timecode } from './morphEngine';

/** Seekable timeline: ruler, playhead and one keyframe lane per layer. */
export default function MorphTimeline({ scene, time, onSeek, selectedId, onSelect }) {
  const rulerRef = useRef(null);
  const dragging = useRef(false);
  const [, force] = useState(0);
  const duration = Math.max(0.1, scene.duration);
  const pct = Math.min(100, (time / duration) * 100);

  const seekFrom = (clientX) => {
    const rect = rulerRef.current.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(p * duration);
  };

  const ticks = [];
  for (let s = 0; s <= duration + 0.001; s += 0.5) ticks.push(s);

  return (
    <div className="border-t border-white/10 bg-[#0b0b0b]">
      <div className="flex items-center gap-3 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Timeline</span>
        <span className="text-[11px] tabular-nums text-white/70">{timecode(time, scene.fps || 30)}</span>
        <span className="text-[11px] tabular-nums text-white/30">/ {duration.toFixed(2)}s</span>
      </div>

      <div className="px-3 pb-3">
        <div
          ref={rulerRef}
          onPointerDown={(e) => {
            dragging.current = true;
            seekFrom(e.clientX);
            e.currentTarget.setPointerCapture?.(e.pointerId);
            force((n) => n + 1);
          }}
          onPointerMove={(e) => { if (dragging.current) seekFrom(e.clientX); }}
          onPointerUp={() => { dragging.current = false; force((n) => n + 1); }}
          onPointerCancel={() => { dragging.current = false; }}
          className="relative h-7 cursor-ew-resize select-none border-b border-white/10"
        >
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 h-full" style={{ left: `${(t / duration) * 100}%` }}>
              <div className="w-px h-2.5 bg-white/20" />
              {Number.isInteger(t) && (
                <span className="absolute top-3 -translate-x-1/2 text-[9px] text-white/30 tabular-nums">{t}s</span>
              )}
            </div>
          ))}
          <div className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${pct}%` }}>
            <div className="absolute -top-0.5 -left-[5px] w-2.5 h-2.5 rotate-45 bg-white" />
          </div>
        </div>

        <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto">
          {scene.layers.map((layer) => (
            <div key={layer.id} className="flex items-center gap-2">
              <button
                onClick={() => onSelect(layer.id)}
                className={`w-32 shrink-0 text-left truncate text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                  selectedId === layer.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {layer.name}
              </button>
              <div
                onClick={(e) => {
                  onSelect(layer.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * duration);
                }}
                className={`relative flex-1 h-6 rounded bg-white/[0.04] cursor-pointer ${
                  selectedId === layer.id ? 'ring-1 ring-white/25' : ''
                }`}
              >
                {layerKeyTimes(layer).map((t) => (
                  <div
                    key={t}
                    title={`${t.toFixed(2)}s`}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white"
                    style={{ left: `${(t / duration) * 100}%` }}
                  />
                ))}
                <div className="absolute top-0 bottom-0 w-px bg-white/70" style={{ left: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}