import React from 'react';
import { ArrowUpRight, Copy, Loader2 } from 'lucide-react';
export default function AngleGeneratePanel({editor:e,actions:a}) {
  return <section className="space-y-3 p-4"><label className="block text-[10px] uppercase tracking-[.18em] text-muted-foreground" htmlFor="angle-direction">Creative direction</label><textarea id="angle-direction" value={e.prompt} onChange={event=>e.setPrompt(event.target.value)} placeholder="Describe the scene, style and action…" rows={3} className="angle-input resize-none"/>
    <div className="flex gap-2"><button disabled={!!a.busy||!e.subjects.length} onClick={a.generate} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-xs font-semibold text-primary-foreground">{a.busy?<Loader2 size={14} className="animate-spin"/>:<ArrowUpRight size={15}/>}Generate this angle</button><button onClick={a.copy} title={a.copied?'Copied':'Copy current scene prompt'} className="rounded-lg border border-border px-3">{a.copied?<span className="text-[10px]">Copied</span>:<Copy size={14}/>}</button></div>
    <p className="text-[10px] leading-relaxed text-muted-foreground">Sends the actual camera-view blockout and your reference to image generation. Results are AI interpretations, not exact 3D renders. Uses integration credits.</p>
    {a.result&&<button onClick={a.openResult} className="w-full rounded-lg border border-border py-2 text-xs">View latest image</button>}
    {a.error&&<p role="alert" className="rounded-lg border border-border bg-muted p-3 text-xs">{a.error}</p>}
  </section>;
}