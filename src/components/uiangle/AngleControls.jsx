import React from "react";
import { Sparkles, Copy } from "lucide-react";
import { SHOTS, ANGLES, MOTIONS } from "./anglePrompt";

const selectCls = "w-full rounded-lg border border-white/15 bg-zinc-950 px-2 py-2 text-sm text-white outline-none focus:border-white/50";

export default function AngleControls({
  mode, setMode,
  shot, setShot,
  angle, setAngle,
  camHeight, setCamHeight,
  yaw, setYaw,
  motion, setMotion,
  prompt, setPrompt,
  onGenerate, onCopyPrompt,
  canGenerate, busy
}) {
  const is3d = mode !== "2d";

  return (
    <div className="space-y-4 rounded-2xl border border-white/15 bg-zinc-950 p-4">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/15 p-1">
        {["2d", "3d", "4d"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === m ? "bg-white text-black" : "text-white/60 hover:text-white"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Shot</span>
          <select value={shot} onChange={(e) => setShot(e.target.value)} className={selectCls}>
            {SHOTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Angle</span>
          <select value={angle} onChange={(e) => setAngle(e.target.value)} className={selectCls}>
            {ANGLES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>

      {is3d && (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
              Camera height — {camHeight.toFixed(1)}m
            </span>
            <input
              type="range" min="0.2" max="6" step="0.1"
              value={camHeight} onChange={(e) => setCamHeight(Number(e.target.value))}
              className="w-full accent-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
              Camera rotation — {Math.round(yaw)}°
            </span>
            <input
              type="range" min="0" max="359" step="1"
              value={yaw} onChange={(e) => setYaw(Number(e.target.value))}
              className="w-full accent-white"
            />
          </label>
        </div>
      )}

      {mode === "4d" && (
        <label className="block space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Camera motion</span>
          <select value={motion} onChange={(e) => setMotion(e.target.value)} className={selectCls}>
            {MOTIONS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
      )}

      <label className="block space-y-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe the look, mood, or action…"
          className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/50"
        />
      </label>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={onGenerate}
          disabled={!canGenerate || !!busy}
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-bold text-black transition-opacity disabled:opacity-40"
        >
          <Sparkles className="h-4 w-4" />
          Generate {mode.toUpperCase()} angle
        </button>
        <button
          onClick={onCopyPrompt}
          className="flex items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-medium text-white hover:bg-white/10"
          title="Copy the camera prompt"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}