import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react';
import useElapsed from '@/hooks/useElapsed';
export default function AngleEditorHeader({editor:e,actions:a}) {
  const elapsed=useElapsed(!!a.busy);
  return <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 pr-16 sm:px-5 sm:pr-36">
    <div className="flex items-center gap-4"><Link to="/UI" aria-label="Back to UI store" className="rounded-lg border border-border p-2"><ArrowLeft size={16}/></Link><div className="flex items-center gap-2"><Camera size={19}/><span className="text-sm font-semibold tracking-[.16em]">UI ANGLE</span></div><span className="hidden border-l border-border pl-4 text-xs text-muted-foreground xl:block">Scene & camera studio</span></div>
    <div className="flex items-center gap-3"><div className="flex rounded-lg border border-border bg-background p-1">{['2d','3d','4d'].map(mode=><button key={mode} disabled={!!a.busy} aria-pressed={e.mode===mode} onClick={()=>e.setMode(mode)} className={`min-h-8 rounded-md px-4 text-xs uppercase ${e.mode===mode?'bg-primary font-semibold text-primary-foreground':'text-muted-foreground'}`}>{mode}</button>)}</div>
    <label className={`flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs ${a.busy?'opacity-50':'cursor-pointer hover:bg-muted'}`}><Upload size={14}/><span className="hidden sm:inline">Reference</span><input aria-label="Upload reference image" type="file" accept="image/png,image/jpeg,image/webp" disabled={!!a.busy} onChange={a.upload} className="hidden"/></label></div>
    {a.busy&&<p role="status" className="flex w-full items-center gap-2 text-xs text-muted-foreground"><Loader2 size={13} className="animate-spin"/>{a.busy} · {elapsed}s</p>}
  </header>;
}