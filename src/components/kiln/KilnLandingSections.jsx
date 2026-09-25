import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { KILN_LOGO } from './kilnAssets';
import { IconCodeSheet, IconEye, IconLayers, IconSpark } from './KilnIcons';

const STEPS = [
  { n: '01', title: 'Drop the image', body: 'A screenshot, a mock, a component sheet — or paste an image link.' },
  { n: '02', title: 'KILN reads it', body: 'Every block is inventoried and mapped onto the ETA component library.' },
  { n: '03', title: 'It writes the HTML', body: 'One self-contained document at the source size, 1:1 — real code, streamed live.' },
  { n: '04', title: 'You keep editing', body: 'Name an ETA component, preset or transition and the agent rewrites it in chat.' },
];

const MAKES = [
  { Icon: IconLayers, title: 'Component map', body: 'BrowserWindow, Cards4, TitleCard, NumberDisplay — every block named and marked.', sample: 'data-eta-component="Cards4"' },
  { Icon: IconEye, title: '1:1 reproduction', body: 'Source size, exact geometry, per-word colours, real artwork crops.', sample: '1440 × 900 · no rearrangement' },
  { Icon: IconSpark, title: 'Motion, on request', body: 'Ask for a preset, a zoom keyframe or a match transition and it lands as real keyframes.', sample: 'SplitText · ease-out' },
  { Icon: IconCodeSheet, title: 'Copyable output', body: 'Fullscreen it, read the code, copy or download the whole document.', sample: 'kiln-components.html' },
];

export function KilnLandingWorkflow() {
  return (
    <section id="how" className="mx-auto w-full max-w-[1180px] px-5 py-10">
      <div className="mb-8 text-center">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--k-muted))]">Workflow</span>
        <h2 className="kiln-display mt-3 text-[clamp(24px,3vw,34px)]">Four steps from picture to component</h2>
        <p className="mt-2 text-[12.5px] text-[hsl(var(--k-muted))]">Nothing to configure — the ETA model is already loaded.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.n} className="kiln-card p-4">
            <span className="kiln-display kiln-grad text-[22px]">{step.n}</span>
            <p className="mt-2 text-[13px] font-semibold">{step.title}</p>
            <p className="mt-1 text-[11.5px] leading-5 text-[hsl(var(--k-muted))]">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function KilnLandingProduces({ onEnter, hasWallet }) {
  return (
    <section id="makes" className="mx-auto w-full max-w-[1180px] px-5 py-10">
      <div className="mb-8 text-center">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--k-muted))]">What it builds</span>
        <h2 className="kiln-display mt-3 text-[clamp(24px,3vw,34px)]">A component sheet you can ship</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MAKES.map(({ Icon, title, body, sample }) => (
          <div key={title} className="kiln-card p-4">
            <Icon size={18} className="text-[hsl(var(--k-amber))]" />
            <p className="mt-2.5 text-[13px] font-semibold">{title}</p>
            <p className="mt-1 text-[11.5px] leading-5 text-[hsl(var(--k-muted))]">{body}</p>
            <p className="kiln-mono mt-3 border-t border-[hsl(var(--k-line))] pt-2 text-[10px] text-[hsl(var(--k-muted))]">
              {sample}
            </p>
          </div>
        ))}

        <div id="enter" className="kiln-pixel flex flex-col justify-between bg-[hsl(var(--k-ink))] p-5 text-[hsl(var(--k-bg))]">
          <div>
            <p className="kiln-display text-[24px] leading-tight">KILN</p>
            <p className="mt-2 max-w-[260px] text-[12px] leading-5 opacity-80">
              Your image in, a working component sheet out — and an agent that keeps editing it with the ETA model.
            </p>
          </div>
          <button
            onClick={onEnter}
            className="kiln-btn mt-5 self-start border-transparent bg-[hsl(var(--k-bg))] px-4 py-2.5 text-[11.5px] text-[hsl(var(--k-ink))]"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            {hasWallet ? 'Enter Studio' : 'Connect Scorpion'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function KilnLandingFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1180px] border-t border-[hsl(var(--k-line))] px-5 py-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <img src={KILN_LOGO} alt="KILN" className="h-6 w-6 rounded-[6px]" />
          <span className="kiln-display text-[14px]">KILN</span>
        </div>
        <p className="text-[11.5px] text-[hsl(var(--k-muted))]">
          Built for TTT makers who design in pictures and want real components back.
        </p>
        <p className="kiln-mono ml-auto text-[10px] text-[hsl(var(--k-muted))]">
          Images are read to rebuild the interface. Nothing is published.
        </p>
      </div>
    </footer>
  );
}