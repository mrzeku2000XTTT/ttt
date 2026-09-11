import React from 'react';
import { Code2, Palette, Network, Rocket, BookOpen, Lightbulb, MessageSquare, Compass, ArrowUpRight } from 'lucide-react';
const ideas = [
  ['Plan a dApp', 'Map out your next Kaspa application.', Code2],
  ['Shape a brand', 'Give your shared vision a direction.', Palette],
  ['Explore a protocol', 'Compare research and technical notes.', Network],
  ['Prepare a launch', 'Get your plans ready for the world.', Rocket],
  ['Write the docs', 'Turn complex ideas into clear words.', BookOpen],
  ['Capture an idea', 'Save that spark before it disappears.', Lightbulb],
  ['Work through feedback', 'Collect thoughts and decide what’s next.', MessageSquare],
  ['Find a direction', 'Sketch the possibilities together.', Compass]
];
export default function CollabLandingIdeas({ onConnect, loading, hasWallet }) {
  return (
    <section id="collab-ideas" className="scroll-mt-8 pb-16 pt-20 sm:pt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">Built around your ideas</p><h2 className="text-2xl font-medium">What will you create together?</h2></div><span className="text-xs text-muted-foreground">One workspace. Endless starting points.</span></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">{ideas.map(([title, text, Icon], index) => <article key={title} className="kc-idea-card flex flex-col rounded-2xl border border-border p-4">
        <div className="kc-idea-art relative mb-4 flex aspect-[1.35] items-center justify-center overflow-hidden rounded-xl border border-foreground/15"><div className="kc-orbit" /><Icon strokeWidth={1} className="relative z-10 h-14 w-14 text-foreground/90" /><span className="absolute left-3 top-3 text-[9px] tracking-widest text-muted-foreground">KC / 0{index + 1}</span></div>
        <h3 className="text-sm font-medium">{title}</h3><p className="mb-5 mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
        <button onClick={onConnect} disabled={loading} className="kc-button mt-auto w-full !px-2 !py-2 !text-[10px]">{loading ? 'Connecting…' : hasWallet ? 'Enter workspace' : 'Start a session'}<ArrowUpRight className="h-3 w-3" /></button>
      </article>)}</div>
    </section>
  );
}