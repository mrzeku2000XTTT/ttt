import React from "react";

export default function BeatTimeline({ clips, cutPlan, beats, duration, progress }) {
  if (!cutPlan || cutPlan.length < 2 || !duration) return null;

  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Cut plan</div>
        <div className="text-[9px] text-white/40 font-mono">{cutPlan.length - 1} cuts · {duration.toFixed(1)}s</div>
      </div>
      <div className="relative h-7 rounded-md overflow-hidden bg-black/40">
        {cutPlan.slice(0, -1).map((t0, i) => {
          const t1 = cutPlan[i + 1];
          const left = (t0 / duration) * 100;
          const width = ((t1 - t0) / duration) * 100;
          const clip = clips[i % clips.length];
          return (
            <div key={i} className="absolute top-0 bottom-0 border-r border-black/60 overflow-hidden" style={{ left: `${left}%`, width: `${width}%` }}>
              {clip?.type === "image" ? <img src={clip.url} alt="" className="w-full h-full object-cover opacity-90" /> : <video src={clip?.url} className="w-full h-full object-cover opacity-90" muted />}
              <div className="absolute top-0 left-0.5 text-[8px] font-mono font-bold text-white drop-shadow">{i + 1}</div>
            </div>
          );
        })}
        {beats?.slice(0, 200).map((b, i) => (
          <div key={`b${i}`} className="absolute top-0 bottom-0 w-px bg-fuchsia-400/70 pointer-events-none" style={{ left: `${(b / duration) * 100}%` }} />
        ))}
        {progress != null && <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none shadow-lg shadow-cyan-500/60" style={{ left: `${progress * 100}%` }} />}
      </div>
    </div>
  );
}