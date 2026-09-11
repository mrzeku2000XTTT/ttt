import React from 'react';
import { ArrowUpRight, Link2, FileText, MessagesSquare } from 'lucide-react';
const ART = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2d001c7b3_generated_image.png';
const features = [
  { title: 'Bring your partner', tag: '01 / CONNECT', position: 'left', icon: Link2, text: 'Connect Scorpion and start a session with your partner’s Kaspa address.' },
  { title: 'Think on the same page', tag: '02 / COLLABORATE', position: 'center', icon: FileText, text: 'A shared notepad for plans, drafts and ideas, with live updates and auto-save.' },
  { title: 'Keep the conversation', tag: '03 / BUILD', position: 'right', icon: MessagesSquare, text: 'Leave notes alongside your work so the next step is always in reach.' }
];
export default function CollabLandingWorkspace({ onConnect, loading }) {
  return (
    <section id="collab-workspace" className="kc-glass relative z-20 scroll-mt-6 rounded-[28px] p-6 sm:p-9 lg:-mt-3">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-medium">Your next build starts here</h2><span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Less noise. More creating.</span></div>
      <div className="grid gap-6 sm:grid-cols-3">{features.map(({ title, tag, position, icon: Icon, text }) => <article key={tag} className="kc-feature rounded-2xl border border-border p-4">
        <div className="kc-art-tile mb-5 aspect-[1.4] overflow-hidden rounded-xl border border-foreground/15"><img src={ART} alt={title} className="h-full w-full object-cover" style={{ objectPosition: position }} /></div>
        <p className="mb-3 text-[9px] tracking-[0.15em] text-primary">{tag}</p><h3 className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-accent" />{title}</h3><p className="mt-3 text-xs leading-6 text-muted-foreground">{text}</p>
      </article>)}</div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6"><p className="text-xs text-muted-foreground">Your wallet is the starting point. Your idea is the reason.</p><button onClick={onConnect} disabled={loading} className="kc-button">{loading ? 'Connecting…' : 'Start collaborating'}<ArrowUpRight className="h-4 w-4" /></button></div>
    </section>
  );
}