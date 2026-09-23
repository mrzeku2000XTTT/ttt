import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Link2, Gauge, ListChecks, Store, Lightbulb } from 'lucide-react';
import HybridLogo from './HybridLogo';
import { useKcc20Wallet } from '@/lib/useKcc20Wallet';

const LOOP_VIDEO = 'https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/ffdcdd63f_Hybrid_Loop.mp4';

const FEATURES = [
  {
    icon: Link2,
    title: 'Any link in',
    body: 'A channel, a single video, a profile, a reel, a post — Hybrid resolves the creator behind it.',
  },
  {
    icon: Gauge,
    title: 'The real channel',
    body: 'It reads your recent posts, views, titles and public follower numbers, then scores engagement health honestly.',
  },
  {
    icon: ListChecks,
    title: 'A plan, not a lecture',
    body: 'Five to six ranked actions you can do this week — what to change, why it lifts engagement, and how.',
  },
  {
    icon: Lightbulb,
    title: 'Ideas with hooks',
    body: 'Ready-to-shoot ideas with the format and opening hook, plus a cadence and the metrics worth tracking.',
  },
];

const STEPS = [
  { n: '1', title: 'Paste your link', body: 'Any public channel, profile, video or post URL.' },
  { n: '2', title: 'Hybrid researches', body: 'It reads your channel on the live web. Nothing invented.' },
  { n: '3', title: 'Get your plan', body: 'Score, what is holding you back, and what to do next.' },
];

export default function HybridLanding({ onEnter }) {
  const navigate = useNavigate();
  const { address, connect, loading } = useKcc20Wallet();

  const handleEnter = async () => {
    if (!address) {
      try { await connect(); } catch { return; }
    }
    onEnter();
  };

  return (
    <div className="relative min-h-screen">
      {/* Looping background video */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
        <video
          className="w-full h-full object-cover"
          src={LOOP_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95" />
      </div>

      <header className="relative z-10">
        <div className="max-w-4xl mx-auto pl-4 pr-14 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HybridLogo size={24} />
            <span className="text-sm font-semibold tracking-tight">HYBRID</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full border border-border text-[9px] font-semibold tracking-[0.15em] text-muted-foreground">
              ENGAGEMENT AUDITOR
            </span>
          </div>
          <button
            onClick={() => navigate('/AppStoreV2')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Store className="w-3 h-3" />
            <span className="hidden sm:inline">Exit to Store</span>
          </button>
        </div>
      </header>

      <section className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pt-12 sm:pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/50 backdrop-blur-xl text-[9px] font-semibold tracking-[0.15em] text-muted-foreground">
          PASTE A LINK · SEE YOUR CHANNEL · SEE WHAT TO FIX
        </div>

        <h1 className="mt-5 text-3xl sm:text-5xl font-semibold leading-[1.08]">
          Your channel,
          <br />
          <span className="text-primary">diagnosed.</span>
        </h1>

        <p className="mt-4 max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
          Hybrid takes any social link, finds the channel behind it, and tells you the truth about your
          engagement — then hands you the exact moves that lift it.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={handleEnter}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {address ? 'Enter Studio' : 'Connect Scorpion'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/AppStoreV2')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border bg-card/50 backdrop-blur-xl font-medium text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Store
          </button>
        </div>

        <div className="mt-9 grid grid-cols-3 gap-2 max-w-md mx-auto">
          {[
            { v: '5–6', l: 'Ranked actions' },
            { v: '1 week', l: 'All doable now' },
            { v: '8+', l: 'Platforms read' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card/50 backdrop-blur-xl px-2 py-3">
              <div className="text-base font-semibold text-primary">{s.v}</div>
              <div className="mt-0.5 text-[9px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 py-8">
        <div className="grid sm:grid-cols-2 gap-2.5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-border bg-card/50 backdrop-blur-xl p-3.5 hover:border-primary/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h3 className="mt-2.5 text-xs font-semibold">{f.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 pb-10">
        <div className="grid sm:grid-cols-3 gap-2.5">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-xl border border-border bg-card/50 backdrop-blur-xl p-3.5">
              <div className="w-6 h-6 rounded-full border border-primary/40 text-primary flex items-center justify-center text-[10px] font-semibold">
                {s.n}
              </div>
              <h3 className="mt-2 text-xs font-semibold">{s.title}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 pb-14 text-center">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-2xl p-6 sm:p-8">
          <Gauge className="w-5 h-5 mx-auto text-primary" />
          <h2 className="mt-3 text-xl sm:text-2xl font-semibold">Stop guessing what is wrong.</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            One link. One honest audit. One week of moves that change your numbers.
          </p>
          <button
            onClick={handleEnter}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {address ? 'Enter Studio' : 'Connect Scorpion'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-4 text-center text-[10px] text-muted-foreground tracking-wide">
        HYBRID · A TTT SUPER APP · SOCIAL ENGAGEMENT AUDITOR
      </footer>
    </div>
  );
}