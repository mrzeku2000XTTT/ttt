import React from "react";
import { ExternalLink, Globe } from "lucide-react";

export default function ParallelWebResults({ results }) {
  if (!results.length) return null;
  return <section className="max-w-2xl mx-auto mt-7 pt-5 border-t border-white/10">
    <div className="flex items-center gap-2 mb-4 text-[10px] font-mono uppercase tracking-widest text-violet-300">
      <Globe className="w-3.5 h-3.5" /> Parallel web index · {results.length} results
    </div>
    <div className="space-y-4">
      {results.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-violet-400/10 bg-violet-500/[0.03] hover:border-violet-400/30 p-3.5 transition-colors">
        <div className="flex items-start gap-3">
          {item.favicon ? <img src={item.favicon} alt="" className="w-8 h-8 rounded-lg bg-white/5" /> : <Globe className="w-8 h-8 p-2 rounded-lg bg-white/5 text-white/40" />}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] text-violet-200 font-medium leading-snug">{item.title}</h3>
            <span className="block mt-0.5 text-[11px] text-emerald-400/70 font-mono truncate">{item.host}</span>
            {item.snippet && <p className="mt-1 text-[13px] text-white/55 leading-relaxed line-clamp-3">{item.snippet}</p>}
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        </div>
      </a>)}
    </div>
  </section>;
}