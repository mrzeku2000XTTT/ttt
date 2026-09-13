import React from 'react';
import { Check, Globe2, MousePointer2, Search } from 'lucide-react';

const clamp = (value) => Math.max(0, Math.min(1, value));
export default function ETARealBrowserScene({ scene, advanced, frameProgress = .65 }) {
  const progress = Number.isFinite(frameProgress) ? frameProgress : .65;
  const frames = [...(advanced.browserKeyframes || [])].sort((a, b) => a.time - b.time);
  const time = progress * Number(scene.duration || 3);
  const active = frames.filter((item) => Number(item.time || 0) <= time).at(-1) || frames[0] || {};
  const zoom = [...(advanced.zoomKeyframes || [])].filter((item) => Number(item.time || 0) <= time).at(-1);
  const rows = advanced.browserRows?.length ? advanced.browserRows : ['Live workspace', 'Reusable components', 'Frame-accurate motion'];
  const reveal = clamp(progress * 3.2), scroll = Number(active.scrollY || 0) * progress;
  const cursor = advanced.cursorSteps?.[0];
  const cursorX = cursor ? 18 + clamp((time - Number(cursor.time || 0)) / Math.max(.2, Number(cursor.duration || 1))) * 62 : 18 + progress * 58;
  return <div className="relative w-full max-w-2xl [perspective:1200px]">
    <div className={`overflow-hidden rounded-2xl border bg-background shadow-2xl ${advanced.animatedBorder ? 'border-primary shadow-[0_0_40px_hsl(var(--primary)/.18)]' : 'border-border'}`} style={{opacity:reveal,transform:`rotateX(${Number(active.x||0)}deg) rotateY(${Number(active.y||0)}deg) rotateZ(${Number(active.z||0)}deg) scale(${zoom?.scale||(.9+reveal*.1)})`}}>
      <div className="flex h-12 items-center gap-3 border-b border-border bg-card px-4"><span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-destructive"/><i className="h-2.5 w-2.5 rounded-full bg-primary"/><i className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"/></span><div className="flex h-7 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 text-[10px] text-muted-foreground"><Globe2 className="h-3 w-3"/>{advanced.url || active.content || 'https://product.app'}</div></div>
      <div className="grid h-72 grid-cols-[132px_1fr] overflow-hidden"><aside className="border-r border-border bg-card p-4"><div className="mb-5 h-7 w-7 rounded-lg bg-primary"/>{rows.map((row,i)=><div key={row} className="mb-3 flex items-center gap-2 text-[9px] text-muted-foreground" style={{opacity:clamp(progress*4-i*.25)}}><i className={`h-1.5 w-1.5 rounded-full ${i===0?'bg-primary':'bg-muted-foreground/30'}`}/>{row}</div>)}</aside><section className="overflow-hidden p-6"><div style={{transform:`translateY(${-scroll}px)`}}><div className="mb-5 flex items-start justify-between"><div><p className="text-xl font-semibold">{advanced.pageTitle || scene.headline}</p><p className="mt-1 text-[10px] text-muted-foreground">{advanced.pageSubtitle || scene.visual}</p></div><button className="rounded-lg bg-primary px-3 py-2 text-[9px] font-bold text-primary-foreground">{advanced.ctaLabel || 'Create'}</button></div><div className="mb-4 flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[10px] text-muted-foreground"><Search className="h-3 w-3"/>Search workspace</div><div className="grid grid-cols-3 gap-3">{rows.map((row,i)=><article key={i} className="rounded-xl border border-border bg-card p-3" style={{opacity:clamp((progress-i*.08)*4),transform:`translateY(${(1-clamp((progress-i*.08)*4))*24}px)`}}><div className="mb-8 h-14 rounded-lg bg-primary/15"/><Check className="mb-2 h-3 w-3 text-primary"/><p className="text-[9px] font-semibold">{row}</p></article>)}</div></div></section></div>
    </div><MousePointer2 className="absolute h-6 w-6 fill-foreground text-foreground drop-shadow-xl" style={{left:`${cursorX}%`,top:`${30+Math.sin(progress*Math.PI)*48}%`,transform:`scale(${1+Math.max(0,Math.sin(progress*Math.PI*8))*.25})`}}/>
  </div>;
}