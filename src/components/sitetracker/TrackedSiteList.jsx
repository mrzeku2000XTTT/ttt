import React from "react";
import { Globe, Trash2, RefreshCw } from "lucide-react";

export default function TrackedSiteList({ sites, activeId, onSelect, onRescan, onDelete, scanningId }) {
  if (!sites?.length) return null;
  return (
    <div className="bg-[#FDFBF7] rounded-3xl p-4 shadow-[0_10px_30px_rgba(124,92,252,0.12)]">
      <div className="text-[10px] font-display font-extrabold uppercase tracking-widest text-[#7C5CFC] px-2 mb-2">Your Tracked Sites</div>
      <div className="space-y-1.5">
        {sites.map((s) => {
          const score = s.seo_score ?? 0;
          const dot = score >= 70 ? "bg-[#5CE1A4]" : score >= 40 ? "bg-[#FFC24B]" : "bg-[#FF7A7A]";
          return (
            <div key={s.id}
              onClick={() => onSelect(s)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all ${activeId === s.id ? "bg-[#EDE8F9] ring-2 ring-[#7C5CFC]/40" : "hover:bg-[#EDE8F9]/60"}`}>
              <Globe className="w-4 h-4 text-[#7C5CFC] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold text-[#1F1B2E] truncate">{s.domain}</div>
                <div className="text-[9px] text-[#8B84A3] truncate">{s.title || s.url}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs font-display font-black text-[#4A2FA8]">{score}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRescan(s); }} disabled={scanningId === s.id}
                className="p-1.5 rounded-lg hover:bg-white text-[#7C5CFC] disabled:opacity-40" title="Rescan">
                <RefreshCw className={`w-3.5 h-3.5 ${scanningId === s.id ? "animate-spin" : ""}`} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                className="p-1.5 rounded-lg hover:bg-white text-[#FF7A7A]" title="Stop tracking">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}