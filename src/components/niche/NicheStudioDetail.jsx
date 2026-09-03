import React from 'react';
import { ChevronLeft, Zap } from 'lucide-react';
import NicheThumbnailLab from './NicheThumbnailLab';
import NicheScriptLab from './NicheScriptLab';
import NicheExplainerLab from './NicheExplainerLab';

// Full view of one saved niche — report + content labs, nothing to copy by hand
export default function NicheStudioDetail({ niche, onBack }) {
  const r = niche.result || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> All niches
      </button>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">{niche.niche_name}</h1>
      <p className="text-white/50 mt-2 italic">"{niche.tagline}"</p>

      <div className="grid sm:grid-cols-2 gap-4 my-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-white/50" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">What you're good at</h3>
          </div>
          <ul className="space-y-2">
            {r.strengths?.map((s, i) => (
              <li key={i}>
                <p className="text-white font-semibold text-sm">{s.title}</p>
                <p className="text-white/50 text-sm mt-0.5">{s.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-white/50" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">What to post</h3>
          </div>
          <ul className="space-y-2.5">
            {r.ideas?.map((idea, i) => (
              <li key={i}>
                <p className="text-white text-sm font-medium">{idea.title}</p>
                <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{idea.hook}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <NicheThumbnailLab niche={niche} />
        <NicheScriptLab niche={niche} />
        <NicheExplainerLab niche={niche} />
      </div>
    </div>
  );
}