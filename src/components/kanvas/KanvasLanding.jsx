import React from 'react';
import { ArrowUpRight, ArrowRight, Loader2, Wallet, Link2 } from 'lucide-react';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a8e474d8b_generated_image.png';
const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d2f7f5ac1_generated_image.png';

export default function KanvasLanding({ onConnect, loading, error, onExit }) {
  return (
    <section className="kv-page relative grid min-h-screen items-center lg:grid-cols-2">
      <div className="relative z-10 px-6 pb-10 pt-28 sm:px-12 lg:py-24">
        <div className="mb-7 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--kv-accent))]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--kv-accent))]" /> Image editing for Kaspa builders
        </div>
        <p className="kv-display mb-3 text-sm tracking-[0.18em] sm:text-lg">Mark up. Crop. Ship.</p>
        <h1 className="kv-display text-[clamp(34px,5vw,68px)] leading-[1.12] tracking-tight">
          EDIT LIKE<br /><span className="kv-outline">A PRO.</span>
        </h1>
        <p className="mt-7 max-w-sm text-sm leading-7 text-[hsl(var(--kv-muted))]">
          Drop in any image, mark it up with brushes, shapes, arrows and text, clip and crop it down, then export a clean PNG — all in your browser, gated by your Scorpion wallet.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button onClick={onConnect} disabled={loading} className="kv-btn kv-btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            {loading ? 'Connecting…' : 'Connect Scorpion'} <ArrowUpRight className="w-4 h-4" />
          </button>
          <a href="#how" className="inline-flex items-center gap-2 text-xs font-medium">See how it works <ArrowRight className="w-4 h-4" /></a>
        </div>
        {error && <p role="alert" className="mt-4 max-w-sm text-sm text-red-400">{error}</p>}
        <div className="kv-glass mt-12 inline-flex items-center gap-4 rounded-xl px-5 py-4">
          <Link2 className="h-6 w-6 text-[hsl(var(--kv-accent))]" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--kv-muted))]">Made for your next idea</p>
            <p className="mt-1 text-xs font-medium">One image. Every mark. Export ready.</p>
          </div>
        </div>
      </div>
      <div className="relative hidden min-w-0 lg:block" aria-label="Kanvas artwork">
        <img src={HERO} alt="Futuristic designer editing an image on a glowing glass canvas" className="kv-portrait" fetchPriority="high" />
        <div className="kv-glass absolute right-0 top-[18%] rounded-lg px-4 py-3 text-xs"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--kv-accent))]" />Wallet-connected</div>
        <div className="kv-glass absolute left-0 top-[46%] rounded-lg px-4 py-3"><p className="text-lg font-semibold">Your image.</p><p className="text-[10px] text-[hsl(var(--kv-muted))]">Mark it up. Crop it. Export.</p></div>
        <div className="kv-glass absolute bottom-[22%] right-0 rounded-lg px-4 py-3 text-xs">Brushes · Shapes · Text · Crop</div>
        <div className="absolute bottom-8 right-2 flex gap-3">
          {[['06', 'Tools'], ['∞', 'Undos'], ['0', 'KAS to start']].map(([v, l]) => (
            <div key={l} className="kv-glass min-w-[80px] rounded-lg px-3 py-3 text-center"><p className="text-xl font-medium">{v}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-[hsl(var(--kv-muted))]">{l}</p></div>
          ))}
        </div>
      </div>
      <div id="how" className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-[hsl(var(--kv-muted))]">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--kv-accent))]">How it works</span>
        {[['01', 'Connect', 'Link your Scorpion wallet'], ['02', 'Upload', 'Drop, paste or pick an image'], ['03', 'Edit', 'Markup, crop & export PNG']].map((s) => (
          <div key={s[0]} className="flex items-start gap-2.5"><span className="kv-display text-sm text-[hsl(var(--kv-accent))]">{s[0]}</span><div><p className="text-xs font-medium text-white">{s[1]}</p><p className="text-[11px]">{s[2]}</p></div></div>
        ))}
        <button onClick={onExit} className="ml-auto kv-btn">Exit to Store</button>
      </div>
    </section>
  );
}