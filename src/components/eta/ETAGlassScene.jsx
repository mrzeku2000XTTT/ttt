import React from 'react';
import { Activity, Layers3, Sparkles } from 'lucide-react';

export default function ETAGlassScene({ scene, advanced, frameProgress = .7 }) {
  const p = Number.isFinite(frameProgress) ? frameProgress : .7;
  const cards = [{Icon:Sparkles,x:-128,y:12},{Icon:Layers3,x:0,y:-18},{Icon:Activity,x:128,y:18}];
  return <div className="relative h-64 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-background to-muted p-6">
    <div className="absolute inset-0 opacity-40" style={{background:`radial-gradient(circle at ${20+p*60}% ${30+Math.sin(p*Math.PI)*35}%, hsl(var(--primary)/.55), transparent 35%)`}}/>
    {cards.map(({Icon,x,y},i)=>{const reveal=Math.max(0,Math.min(1,(p-i*.09)*4));return <div key={i} className="absolute left-1/2 top-1/2 h-40 w-36 rounded-2xl border border-foreground/15 bg-background/45 p-4 shadow-2xl backdrop-blur-xl" style={{opacity:reveal,transform:`translate(calc(-50% + ${x*reveal}px), calc(-50% + ${y+Math.sin(p*Math.PI*4+i)*8}px)) rotate(${(i-1)*8*reveal}deg) scale(${.8+reveal*.2})`}}><Icon className="h-5 w-5 text-primary"/><div className="mt-12 h-2 w-20 rounded bg-foreground/70"/><div className="mt-3 h-2 w-12 rounded bg-foreground/20"/></div>})}
    <p className="absolute bottom-5 left-6 text-sm font-semibold">{advanced.subtitle || scene.headline}</p>
  </div>;
}