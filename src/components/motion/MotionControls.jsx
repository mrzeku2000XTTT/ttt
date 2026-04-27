import React from "react";
import { Upload, RotateCcw, Download, Play, Pause } from "lucide-react";

const SLIDERS = [
  { key: "tiltX", label: "Tilt X", min: -45, max: 45, step: 1 },
  { key: "tiltY", label: "Tilt Y", min: -45, max: 45, step: 1 },
  { key: "roll", label: "Roll", min: -45, max: 45, step: 1 },
  { key: "zoom", label: "Zoom", min: 0.5, max: 2.5, step: 0.01 },
  { key: "panX", label: "Pan X", min: -3, max: 3, step: 0.05 },
  { key: "panY", label: "Pan Y", min: -3, max: 3, step: 0.05 },
];

const PRESETS = [
  { name: "Hero", settings: { tiltX: -8, tiltY: 18, roll: 0, zoom: 1.1, panX: 0.2, panY: 0 } },
  { name: "Glass Corner", settings: { tiltX: -12, tiltY: -22, roll: 4, zoom: 1.0, panX: -0.4, panY: 0.1 } },
  { name: "Pixel Detail", settings: { tiltX: 0, tiltY: 0, roll: 0, zoom: 1.6, panX: 0, panY: 0 } },
  { name: "XDR", settings: { tiltX: -20, tiltY: 10, roll: -2, zoom: 1.25, panX: 0.1, panY: -0.15 } },
];

const BG_OPTIONS = [
  { name: "Studio", value: "linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 100%)" },
  { name: "Aurora", value: "linear-gradient(135deg, #0a0f1f 0%, #1a0b3a 50%, #06b6d4 100%)" },
  { name: "Sunset", value: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)" },
  { name: "Mono", value: "linear-gradient(180deg, #18181b 0%, #000000 100%)" },
  { name: "Cyan Glow", value: "radial-gradient(ellipse at center, #06b6d4 0%, #0a0f1f 70%)" },
];

export default function MotionControls({
  settings,
  setSettings,
  onUpload,
  onReset,
  onExport,
  onTogglePlay,
  isPlaying,
  hasImage,
  bg,
  setBg,
}) {
  const update = (key, val) => setSettings(s => ({ ...s, [key]: parseFloat(val) }));

  return (
    <div className="w-full lg:w-80 bg-white rounded-2xl ring-1 ring-zinc-200 p-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 7rem)" }}>
      {/* Upload */}
      <div>
        <label className="cursor-pointer flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-semibold transition-colors">
          <Upload className="w-4 h-4" />
          {hasImage ? "Replace Image" : "Upload Screenshot"}
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      </div>

      {/* Presets */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Presets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => setSettings(s => ({ ...s, ...p.settings }))}
              className="text-[12px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg py-2 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Camera sliders */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Camera</h3>
        <div className="space-y-3">
          {SLIDERS.map(s => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-600">{s.label}</label>
                <span className="text-[11px] font-mono text-zinc-400 tabular-nums">{settings[s.key].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={settings[s.key]}
                onChange={(e) => update(s.key, e.target.value)}
                className="w-full accent-cyan-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Background</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {BG_OPTIONS.map(b => (
            <button
              key={b.name}
              onClick={() => setBg(b.value)}
              title={b.name}
              className={`h-8 rounded-lg ring-2 transition-all ${bg === b.value ? "ring-cyan-500" : "ring-transparent hover:ring-zinc-300"}`}
              style={{ background: b.value }}
            />
          ))}
        </div>
      </div>

      {/* Effects */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Effects</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-zinc-600">Blur</label>
              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">{settings.blur.toFixed(0)}px</span>
            </div>
            <input
              type="range" min="0" max="20" step="0.5"
              value={settings.blur}
              onChange={(e) => update("blur", e.target.value)}
              className="w-full accent-cyan-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-zinc-600">Shadow</label>
              <span className="text-[11px] font-mono text-zinc-400 tabular-nums">{settings.shadow.toFixed(0)}</span>
            </div>
            <input
              type="range" min="0" max="60" step="1"
              value={settings.shadow}
              onChange={(e) => update("shadow", e.target.value)}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-zinc-100">
        <button
          onClick={onTogglePlay}
          disabled={!hasImage}
          className="w-full h-10 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isPlaying ? <><Pause className="w-4 h-4" /> Pause Motion</> : <><Play className="w-4 h-4" /> Play Motion</>}
        </button>
        <button
          onClick={onExport}
          disabled={!hasImage}
          className="w-full h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" /> Export PNG
        </button>
        <button
          onClick={onReset}
          className="w-full h-9 rounded-xl text-zinc-500 hover:bg-zinc-50 text-[12px] font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All
        </button>
      </div>
    </div>
  );
}