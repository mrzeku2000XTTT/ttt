import React from 'react';
import { Type } from 'lucide-react';
export default function CameraTextPanel({ asset, change }) {
  if (asset?.type !== 'text') return null;
  return <div className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-full border border-border bg-card/90 backdrop-blur px-3 py-1.5 shadow-lg">
    <Type size={13} className="text-muted-foreground shrink-0"/>
    <input aria-label="Text content" value={asset.text} maxLength={60} onChange={e => change(e.target.value)} className="bg-transparent outline-none text-sm text-foreground w-44" placeholder="Type your text"/>
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">preset</span>
  </div>;
}