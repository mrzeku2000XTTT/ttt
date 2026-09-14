import React from 'react';
import { ArrowUpRight, Boxes, Sparkles } from 'lucide-react';
import SearchHighlight from '@/components/agentinternet/SearchHighlight';
export default function LiveAppSuggestions({ query, items, onChoose }) {
  if (!query.trim() || !items.length) return null;
  return <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-cyan-300/20 bg-zinc-950/95 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,0.75),0_0_32px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
    <div className="flex items-center gap-2 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-200/55"><Sparkles className="h-3 w-3"/>Live TTT matches</div>
    {items.slice(0, 6).map(app => <button key={app.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => onChoose(app)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.07]">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">{app.logo ? <img src={app.logo} alt="" className="h-full w-full object-cover"/> : <Boxes className="h-4 w-4 text-cyan-300"/>}</div>
      <div className="min-w-0 flex-1"><SearchHighlight text={app.name} query={query} className="block truncate text-[13px] font-semibold text-white"/><SearchHighlight text={app.description} query={query} className="mt-0.5 block truncate text-[10px] text-white/45"/></div>
      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-1 text-[8px] font-mono uppercase text-cyan-200/60">{app.category}</span><ArrowUpRight className="h-3.5 w-3.5 text-white/25"/>
    </button>)}
    <div className="border-t border-white/[0.06] px-3 py-2 text-[9px] text-white/30">Press Enter to search TTT App Store, Kaspa Hub, and the open web together.</div>
  </div>;
}