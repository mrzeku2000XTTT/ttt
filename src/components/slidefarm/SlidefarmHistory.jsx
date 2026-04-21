import React from "react";
import { Clock, Play } from "lucide-react";

export default function SlidefarmHistory({ history, onOpen }) {
  if (!history?.length) return null;
  return (
    <div className="mt-8">
      <h2 className="text-white font-[900] text-lg mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-white/50" /> Recent
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {history.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpen(s)}
            className="text-left bg-zinc-900/60 border border-white/10 rounded-xl p-3 hover:border-cyan-400/50 transition-all group"
          >
            <div className="flex items-start gap-2">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                {s.slides?.[0]?.image_url && (
                  <img src={s.slides[0].image_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[11px] font-bold truncate">{s.niche}</div>
                <div className="text-white/50 text-[10px] truncate mt-0.5">{s.hook}</div>
                <div className="text-cyan-400 text-[9px] mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-2.5 h-2.5" /> Open
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}