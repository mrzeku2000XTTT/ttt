import React from "react";
import { Camera } from "lucide-react";

const SHOT_COLORS = {
  wide: "from-sky-500/20 to-blue-500/10 text-sky-300 border-sky-400/30",
  establishing: "from-sky-500/20 to-blue-500/10 text-sky-300 border-sky-400/30",
  medium: "from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-400/30",
  "close-up": "from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-400/30",
  "push-in": "from-violet-500/20 to-purple-500/10 text-violet-300 border-violet-400/30",
  tracking: "from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-400/30",
  "wide-then-cut": "from-fuchsia-500/20 to-purple-500/10 text-fuchsia-300 border-fuchsia-400/30",
};

export default function RionShotCard({ shot, index }) {
  const color = SHOT_COLORS[shot.shot_type] || SHOT_COLORS.medium;
  return (
    <div className={`rounded-2xl overflow-hidden border bg-gradient-to-br ${color}`}>
      <div className="aspect-video bg-black/40 relative">
        {shot.image_url ? (
          <img src={shot.image_url} alt={`Shot ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30">
            <Camera className="w-8 h-8" />
          </div>
        )}
        <div className="absolute top-2 left-2 text-[10px] font-black bg-black/60 px-2 py-1 rounded-md text-white">SHOT {index + 1}</div>
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase bg-black/40 px-2 py-0.5 rounded">{shot.shot_type}</span>
          <span className="text-[10px] text-white/50">beat {shot.beat}</span>
        </div>
        <p className="text-xs text-white/80">{shot.description}</p>
        <p className="text-[11px] text-white/50 italic">{shot.camera_language}</p>
      </div>
    </div>
  );
}