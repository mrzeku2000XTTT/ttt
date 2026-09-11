import React from 'react';
import { ArrowUpRight, ArrowRight, Loader2, Wallet, Clapperboard } from 'lucide-react';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/90281289e_generated_image.png';
const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/154c8ae70_generated_image.png';

export default function CAMLanding({ onConnect, onEnter, loading, error, hasWallet, onExit }) {
  return (
    <section className="cm-page relative grid min-h-screen items-center lg:grid-cols-2">
      <div className="relative z-10 px-6 pb-10 pt-28 sm:px-12 lg:py-24">
        <div className="mb-7 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--cm-accent))]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--cm-accent))]" /> Cinematic camera control for Kaspa builders
        </div>
        <p className="cm-display mb-3 text-sm tracking-[0.18em] sm:text-lg">Ten real camera moves.</p>
        <h1 className="cm-display text-[clamp(34px,5vw,68px)] leading-[1.12] tracking-tight">
          DIRECT LIKE<br /><span className="cm-outline">A PRO.</span>
        </h1>
        <p className="mt-7 max-w-sm text-sm leading-7 text-[hsl(var(--cm-muted))]">
          Drop any image and move a virtual camera through it — dolly, orbit, vertigo, crane. Tune intensity and duration, chain moves into a shot sequence, and export a storyboard — all in your browser, gated by your Scorpion wallet.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button onClick={hasWallet ? onEnter : onConnect} disabled={loading} className="cm-btn cm-btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            {loading ? 'Connecting…' : hasWallet ? 'Enter Studio' : 'Connect Scorpion'} <ArrowUpRight className="w-4 h-4" />
          </button>
          <a href="#how" className="inline-flex items-center gap-2 text-xs font-medium">See how it works <ArrowRight className="w-4 h-4" /></a>
        </div>
        {error && <p role="alert" className="mt-4 max-w-sm text-sm text-red-400">{error}</p>}
        <div className="cm-glass mt-12 inline-flex items-center gap-4 rounded-xl px-5 py-4">
          <Clapperboard className="h-6 w-6 text-[hsl(var(--cm-accent))]" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--cm-muted))]">One image. Ten moves.</p>
            <p className="mt-1 text-xs font-medium">Every move carries its own emotional weight.</p>
          </div>
        </div>
      </div>
      <div className="relative hidden min-w-0 self-stretch lg:block" aria-label="CAM artwork">
        <img src={HERO} alt="Robotic film camera on a crane filming a glowing neon-green cityscape" className="cm-portrait" fetchPriority="high" />
        {/* Flow layout (not stacked absolutes) so cards can never collapse & overlap */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between py-28 pl-16 pr-10">
          <div className="flex justify-end">
            <div className="cm-glass inline-flex items-center gap-2 rounded-lg px-4 py-3 text-xs"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--cm-accent))]" />Wallet-connected</div>
          </div>
          <div className="flex items-end justify-between gap-6">
            <div className="cm-glass rounded-lg px-4 py-3">
              <p className="text-lg font-semibold">Your image.</p>
              <p className="text-[10px] text-[hsl(var(--cm-muted))]">Move the camera. Tell the story.</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-3">
                {[['10', 'Camera moves'], ['∞', 'Shots'], ['0', 'KAS to start']].map(([v, l]) => (
                  <div key={l} className="cm-glass min-w-[80px] rounded-lg px-3 py-3 text-center"><p className="text-xl font-medium">{v}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-[hsl(var(--cm-muted))]">{l}</p></div>
                ))}
              </div>
              <div className="cm-glass rounded-lg px-4 py-3 text-xs">Dolly · Orbit · Vertigo · Crane</div>
            </div>
          </div>
        </div>
      </div>
      <div id="how" className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-[hsl(var(--cm-muted))]">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--cm-accent))]">How it works</span>
        {[['01', 'Connect', 'Link your Scorpion wallet'], ['02', 'Upload', 'Drop, paste or pick an image'], ['03', 'Direct', 'Pick a move, play & export storyboard']].map((s) => (
          <div key={s[0]} className="flex items-start gap-2.5"><span className="cm-display text-sm text-[hsl(var(--cm-accent))]">{s[0]}</span><div><p className="text-xs font-medium text-white">{s[1]}</p><p className="text-[11px]">{s[2]}</p></div></div>
        ))}
        <button onClick={onExit} className="ml-auto cm-btn">Exit to Store</button>
      </div>
    </section>
  );
}