import React from 'react';
import { Compass, Calendar } from 'lucide-react';

const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return ''; }
};

export default function NicheStudioList({ niches, onSelect }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">Your niches</h1>
      <p className="text-white/50 text-sm mb-8">Every niche you've found lives here — open one to build content from it.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {niches.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(n)}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/30 hover:bg-white/[0.04] transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <Compass className="w-5 h-5 text-white/40 group-hover:text-white transition-colors shrink-0 mt-0.5" />
              <span className="flex items-center gap-1 text-white/30 text-xs">
                <Calendar className="w-3 h-3" /> {fmtDate(n.created_date)}
              </span>
            </div>
            <h2 className="text-white font-bold text-lg mt-3 leading-snug">{n.niche_name}</h2>
            <p className="text-white/50 text-sm mt-1 line-clamp-2">{n.tagline}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(n.platforms || []).slice(0, 3).map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-white/60">{p}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}