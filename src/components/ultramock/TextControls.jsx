import React from "react";
import { Type, RotateCcw } from "lucide-react";

const PRESET_POSITIONS = [
  { id: "tl", label: "Top L",     x: 20, y: 15 },
  { id: "tc", label: "Top",       x: 50, y: 12 },
  { id: "tr", label: "Top R",     x: 80, y: 15 },
  { id: "ml", label: "Mid L",     x: 20, y: 50 },
  { id: "mc", label: "Center",    x: 50, y: 50 },
  { id: "mr", label: "Mid R",     x: 80, y: 50 },
  { id: "bl", label: "Bot L",     x: 20, y: 85 },
  { id: "bc", label: "Bottom",    x: 50, y: 88 },
  { id: "br", label: "Bot R",     x: 80, y: 85 },
];

const COLORS = ["#ffffff", "#000000", "#fbbf24", "#f472b6", "#22d3ee", "#a78bfa", "#34d399", "#fb923c"];

export default function TextControls({ selected, onUpdate, onRemove }) {
  if (!selected || selected.kind !== "text") return null;

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400 flex items-center gap-1.5">
          <Type className="w-3 h-3" /> Text Layer
        </div>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-[10px] font-bold"
        >
          Remove
        </button>
      </div>

      <Section title="Content">
        <textarea
          value={selected.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-cyan-400 rounded-lg text-white text-sm outline-none resize-none"
          placeholder="Your text…"
        />
      </Section>

      <Section title="Animation">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: "none", l: "Static" },
            { v: "typewriter", l: "Typewriter" },
            { v: "pop", l: "Word Pop" },
            { v: "3d", l: "3D Extrude" },
          ].map((a) => (
            <button
              key={a.v}
              onClick={() => onUpdate({ animation: a.v })}
              className={`px-3 py-2 rounded-lg text-xs font-bold ${
                selected.animation === a.v
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
              }`}
            >
              {a.l}
            </button>
          ))}
        </div>
        {selected.animation === "typewriter" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] text-white/50">
              Speed (cps)
              <input
                type="number" min="1" max="60" step="1"
                value={selected.typeSpeed}
                onChange={(e) => onUpdate({ typeSpeed: Number(e.target.value) || 12 })}
                className="mt-1 w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-cyan-400"
              />
            </label>
            <label className="text-[10px] text-white/50">
              Loop delay (s)
              <input
                type="number" min="0" max="10" step="0.5"
                value={selected.loopDelay}
                onChange={(e) => onUpdate({ loopDelay: Number(e.target.value) || 0 })}
                className="mt-1 w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-cyan-400"
              />
            </label>
          </div>
        )}
        {selected.animation === "pop" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] text-white/50">
              Word delay (s)
              <input
                type="number" min="0.05" max="2" step="0.05"
                value={selected.popDelay ?? 0.25}
                onChange={(e) => onUpdate({ popDelay: Number(e.target.value) || 0.25 })}
                className="mt-1 w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-cyan-400"
              />
            </label>
            <label className="text-[10px] text-white/50">
              Loop delay (s)
              <input
                type="number" min="0" max="10" step="0.5"
                value={selected.loopDelay ?? 1.5}
                onChange={(e) => onUpdate({ loopDelay: Number(e.target.value) || 0 })}
                className="mt-1 w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-cyan-400"
              />
            </label>
          </div>
        )}
        {selected.animation === "3d" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] text-white/50">
              Depth (px)
              <input
                type="number" min="1" max="40" step="1"
                value={selected.depth ?? 8}
                onChange={(e) => onUpdate({ depth: Number(e.target.value) || 8 })}
                className="mt-1 w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-cyan-400"
              />
            </label>
            <label className="text-[10px] text-white/50">
              Tilt (deg)
              <input
                type="number" min="-45" max="45" step="1"
                value={selected.tilt ?? 12}
                onChange={(e) => onUpdate({ tilt: Number(e.target.value) || 0 })}
                className="mt-1 w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-cyan-400"
              />
            </label>
          </div>
        )}
      </Section>

      <Section title="Position Presets">
        <div className="grid grid-cols-3 gap-1.5">
          {PRESET_POSITIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => onUpdate({ x: p.x, y: p.y })}
              className="px-2 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={`Size · ${selected.fontSize}px`}>
        <input
          type="range" min="14" max="120" step="1"
          value={selected.fontSize}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className="w-full accent-white"
        />
      </Section>

      <Section title={`Box Width · ${Math.round(selected.boxWidth ?? 90)}%`}>
        <input
          type="range" min="15" max="100" step="1"
          value={selected.boxWidth ?? 90}
          onChange={(e) => onUpdate({ boxWidth: Number(e.target.value) })}
          className="w-full accent-white"
        />
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {[
            { l: "Narrow", v: 30 },
            { l: "Half", v: 50 },
            { l: "Wide", v: 75 },
            { l: "Full", v: 100 },
          ].map((p) => (
            <button
              key={p.l}
              onClick={() => onUpdate({ boxWidth: p.v })}
              className="px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold"
            >
              {p.l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Weight">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { v: 400, l: "Reg" },
            { v: 700, l: "Bold" },
            { v: 900, l: "Black" },
          ].map((w) => (
            <button
              key={w.v}
              onClick={() => onUpdate({ fontWeight: w.v })}
              className={`px-2 py-1.5 rounded-md text-xs font-bold ${
                selected.fontWeight === w.v
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
              }`}
              style={{ fontWeight: w.v }}
            >
              {w.l}
            </button>
          ))}
        </div>
      </Section>

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
            value={selected.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer bg-transparent"
            title="Custom color"
          />
        </div>
      </Section>
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