import React, { useState } from "react";
import { Palette, Sliders, RotateCcw } from "lucide-react";
import { saveLogoPrefs, useLogoPrefs } from "./DDLogo";
import DDLogo from "./DDLogo";

const PRESET_COLORS = [
  { bg: "#1a1a1a", text: "#f5f5f5", label: "Dark" },
  { bg: "#ffffff", text: "#1a1a1a", label: "Light" },
  { bg: "#0f172a", text: "#e2e8f0", label: "Slate" },
  { bg: "#1e1b4b", text: "#e0e7ff", label: "Indigo" },
  { bg: "#052e16", text: "#bbf7d0", label: "Forest" },
  { bg: "#450a0a", text: "#fecaca", label: "Crimson" },
  { bg: "#422006", text: "#fef08a", label: "Bronze" },
  { bg: "#1c1917", text: "#fafaf9", label: "Stone" },
];

export default function DDLogoCustomizer() {
  const prefs = useLogoPrefs();
  const [open, setOpen] = useState(true);

  const update = (patch) => saveLogoPrefs(patch);

  const reset = () => saveLogoPrefs({
    bgColor: "#1a1a1a", faceScale: 0.72, faceLeft: 14, faceTop: 14,
    textColor: "#f5f5f5", eyeTop: 34, eyeRight: 16, eyeSize: 0.18,
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-neutral-700" /> Customize DD Face
        </h3>
        <span className="text-xs text-neutral-400">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Live preview */}
          <div className="flex items-center justify-center py-4 bg-neutral-50 rounded-xl border border-neutral-100">
            <DDLogo size={72} showWord={false} animate={false} dark={prefs.bgColor.toLowerCase() !== "#ffffff"} prefs={prefs} />
          </div>

          {/* Color presets */}
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-2">Circle color</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.bg}
                  onClick={() => update({ bgColor: c.bg, textColor: c.text })}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition ${prefs.bgColor === c.bg ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"}`}
                >
                  <span className="w-6 h-6 rounded-full border border-neutral-300" style={{ background: c.bg }} />
                  <span className="text-[10px] text-neutral-500">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom colors */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Background</span>
              <input type="color" value={prefs.bgColor} onChange={(e) => update({ bgColor: e.target.value })} className="w-full h-9 rounded-lg border border-neutral-200 cursor-pointer" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">DD text</span>
              <input type="color" value={prefs.textColor} onChange={(e) => update({ textColor: e.target.value })} className="w-full h-9 rounded-lg border border-neutral-200 cursor-pointer" />
            </label>
          </div>

          {/* Face shape sliders */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
              <Sliders className="w-3.5 h-3.5" /> Face shape & position
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Face size</span><span>{Math.round(prefs.faceScale * 100)}%</span></div>
              <input type="range" min="0.4" max="1" step="0.02" value={prefs.faceScale} onChange={(e) => update({ faceScale: parseFloat(e.target.value) })} className="w-full accent-neutral-900" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Face left</span><span>{prefs.faceLeft}%</span></div>
              <input type="range" min="0" max="40" step="1" value={prefs.faceLeft} onChange={(e) => update({ faceLeft: parseInt(e.target.value) })} className="w-full accent-neutral-900" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Face top</span><span>{prefs.faceTop}%</span></div>
              <input type="range" min="0" max="40" step="1" value={prefs.faceTop} onChange={(e) => update({ faceTop: parseInt(e.target.value) })} className="w-full accent-neutral-900" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Eye level</span><span>{prefs.eyeTop}%</span></div>
              <input type="range" min="10" max="60" step="1" value={prefs.eyeTop} onChange={(e) => update({ eyeTop: parseInt(e.target.value) })} className="w-full accent-neutral-900" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1"><span>Eye text size</span><span>{Math.round(prefs.eyeSize * 100)}%</span></div>
              <input type="range" min="0.1" max="0.3" step="0.01" value={prefs.eyeSize} onChange={(e) => update({ eyeSize: parseFloat(e.target.value) })} className="w-full accent-neutral-900" />
            </div>
          </div>

          <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50">
            <RotateCcw className="w-3.5 h-3.5" /> Reset to default
          </button>
        </div>
      )}
    </div>
  );
}