import React from "react";
import { Layers, RotateCcw, Trash2 } from "lucide-react";

const COLORS = ["#ffffff", "#000000", "#fbbf24", "#f472b6", "#22d3ee", "#a78bfa", "#34d399", "#ef4444", "#f97316"];

/**
 * Sidebar/sheet controls for an overlay item: size, rotation, opacity, color
 * (preset overlays only — color is ignored for AI/image overlays).
 */
export default function OverlayControls({ selected, onUpdate, onRemove }) {
  if (!selected || selected.kind !== "overlay") return null;
  const isPreset = selected.overlayType === "preset";

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400 flex items-center gap-1.5">
          <Layers className="w-3 h-3" /> Overlay
        </div>
        <button onClick={onRemove} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[10px] font-bold">
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      </div>

      <Section title={`Size · ${Math.round(selected.widthPct)}%`}>
        <input
          type="range" min="5" max="100" step="1"
          value={selected.widthPct}
          onChange={(e) => onUpdate({ widthPct: Number(e.target.value) })}
          className="w-full accent-white"
        />
      </Section>

      <Section title={`Rotation · ${Math.round(selected.rotation || 0)}°`}>
        <input
          type="range" min="-180" max="180" step="1"
          value={selected.rotation || 0}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          className="w-full accent-white"
        />
        <button
          onClick={() => onUpdate({ rotation: 0 })}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </Section>

      <Section title={`Opacity · ${Math.round((selected.opacity ?? 1) * 100)}%`}>
        <input
          type="range" min="0.1" max="1" step="0.05"
          value={selected.opacity ?? 1}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="w-full accent-white"
        />
      </Section>

      {isPreset && (
        <Section title="Color">
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                className={`w-7 h-7 rounded-full transition-all ${
                  selected.color === c ? "ring-2 ring-white scale-110" : "ring-1 ring-white/20"
                }`}
                style={{ background: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={selected.color || "#ffffff"}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer bg-transparent"
              title="Custom color"
            />
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2">{title}</div>
      {children}
    </div>
  );
}