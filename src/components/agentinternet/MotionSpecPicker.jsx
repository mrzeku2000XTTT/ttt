import React, { useState } from "react";
import { Film } from "lucide-react";
import { extractUrl, SCENE_COUNT } from "@/components/agentinternet/motionPipeline";

const DURATIONS = [4, 6, 8];
const RATIOS = [
  { value: "9:16", label: "9:16 vertical" },
  { value: "16:9", label: "16:9 widescreen" },
];

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-8 rounded-full border text-[11px] font-mono transition-colors ${
        active
          ? "border-cyan-400 text-cyan-300 bg-cyan-400/10"
          : "border-white/15 text-white/60 hover:border-white/35 hover:text-white/85"
      }`}
    >
      {children}
    </button>
  );
}

export default function MotionSpecPicker({ text, onRun }) {
  const [duration, setDuration] = useState(6);
  const [aspect, setAspect] = useState("9:16");
  const site = extractUrl(text);

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <Film className="w-3.5 h-3.5 text-cyan-300" />
        <span className="text-white text-xs font-semibold">Motion setup</span>
      </div>
      <p className="text-[11px] text-white/55 leading-snug mb-3">
        {site
          ? `I'll scrape ${site.replace(/^https?:\/\//, "")} live, research it, write the scenes and render a real frame for each one.`
          : "I'll research this live, write the scenes and render a real frame for each one."}
      </p>

      <div className="space-y-2.5">
        <div>
          <span className="block text-[9px] font-mono uppercase tracking-widest text-white/35 mb-1.5">Length</span>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
                {d}s · {SCENE_COUNT[d]} scenes
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <span className="block text-[9px] font-mono uppercase tracking-widest text-white/35 mb-1.5">Aspect ratio</span>
          <div className="flex flex-wrap gap-1.5">
            {RATIOS.map((r) => (
              <Pill key={r.value} active={aspect === r.value} onClick={() => setAspect(r.value)}>
                {r.label}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onRun({ duration, aspect_ratio: aspect })}
        className="mt-3.5 w-full h-10 rounded-xl border border-cyan-400/60 text-cyan-300 text-xs font-semibold tracking-wide hover:bg-cyan-400/10 transition-colors"
      >
        Generate scenes & assets
      </button>
    </div>
  );
}