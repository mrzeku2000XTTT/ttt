import React from "react";
import { EASES, EASE_LABELS } from "./useMotionEditor";

// Transition easing control: a dropdown of easing presets, a live S-curve
// visualization, and an "Edit Easing" button that cycles to the next preset.
export default function EasingControl({ ease, onChange }) {
  const fn = EASES[ease] || EASES.smooth;
  const W = 96, H = 56, pad = 6;
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const x = i / 48;
    const y = Math.max(0, Math.min(1, fn(x)));
    pts.push(`${pad + x * (W - 2 * pad)},${pad + (1 - y) * (H - 2 * pad)}`);
  }
  const cycle = () => {
    const idx = EASE_LABELS.findIndex((o) => o.value === ease);
    onChange(EASE_LABELS[(idx + 1) % EASE_LABELS.length].value);
  };
  return (
    <div className="py-2.5 border-b border-black/[0.05]">
      <div className="text-[12px] font-medium text-[#1d1d1f] mb-1.5">Transition easing</div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select value={ease} onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none bg-black/[0.04] rounded-lg px-2.5 py-2 text-[12px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0A84FF]/30">
            {EASE_LABELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg width="10" height="10" viewBox="0 0 10 10" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b]"><path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="rounded-lg bg-[#1a202c] flex-shrink-0" style={{ width: W, height: H }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <polyline points={pts.join(" ")} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <button onClick={cycle} className="mt-2 w-full h-8 rounded-lg bg-black/[0.04] text-[12px] text-[#1d1d1f] hover:bg-black/[0.08]">Edit Easing</button>
    </div>
  );
}