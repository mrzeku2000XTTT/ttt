import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Link2, Gauge, ListChecks, Sparkles, Store, Lightbulb } from 'lucide-react';
import HybridLogo from './HybridLogo';
import { useKcc20Wallet } from '@/lib/useKcc20Wallet';

const HERO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/68c6e1fd5_generated_image.png';

const FEATURES = [
  {
    icon: Link2,
    title: 'Paste any link',
    body: 'A YouTube channel, a single video, a TikTok profile, an Instagram reel, an X account, a Twitch channel — drop the URL and HYBRID finds the creator behind it.',
  },
  {
    icon: Gauge,
    title: 'Read the real channel',
    body: 'It opens your channel on the live web, reads your recent posts, views, titles, cadence and public follower numbers, then scores your engagement health honestly.',
  },
  {
    icon: ListChecks,
    title: 'A plan, not a lecture',
    body: 'Five to six ranked actions you can do this week — each one says what to change, why it lifts engagement, and how to do it. No generic "post consistently".',
  },
  {
    icon: Lightbulb,
    title: 'Ideas with hooks',
    body: 'Ready-to-shoot content ideas with the format and the opening hook written out, plus a posting cadence and the metrics worth tracking.',
  },
];

const STEPS = [
  { title: 'Paste your link', body: 'Any public channel, profile, video or post URL.' },
  { title: 'HYBRID researches', body: 'It reads your channel and its recent posts on the live web.' },
  { title: 'Get your growth plan', body: 'Score, strengths, what is holding you back, and what to do next.' },
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
    <div className="relative overflow-hidden">
      {/* Hero backdrop */}
      <div className="absolute inset-x-0 top-0 h-[620px] overflow-hidden">
        <img src={HERO} alt="" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <header className="relative z-10 border-b border-border/60">
        <div className="max-w-6xl mx-auto pl-5 pr-14 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HybridLogo size={38} />
            <span className="text-lg font-black tracking-tight">HYBRID</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full border border-border text-[10px] font-bold tracking-widest text-muted-foreground">
              ENGAGEMENT AUDITOR
            </span>
          </div>
          <button
            onClick={() => navigate('/AppStoreV2')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit to Store</span>
          </button>
        </div>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-xl text-[11px] font-bold tracking-widest text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> PASTE A LINK · SEE YOUR CHANNEL · SEE WHAT TO FIX
        </div>

        <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          YOUR CHANNEL,
          <br />
          <span className="text-primary">DIAGNOSED.</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
          HYBRID takes any social link, finds the channel behind it, and tells you the truth about
          your engagement — then hands you the exact moves that lift it.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleEnter}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {address ? 'Enter Studio' : 'Connect Scorpion'} <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/AppStoreV2')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-border bg-card/60 backdrop-blur-xl font-semibold text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            Back to Store
          </button>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { v: '5–6', l: 'Ranked actions per audit' },
            { v: '1 week', l: 'Every action doable now' },
            { v: '8+', l: 'Platforms understood' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl px-3 py-5">
              <div className="text-xl sm:text-2xl font-black text-primary">{s.v}</div>
              <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center mb-9">
          Link in. <span className="text-primary">Plan out.</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 hover:border-primary/40 transition-colors">
                <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 text-center">
              <div className="mx-auto w-9 h-9 rounded-full border border-primary/40 text-primary flex items-center justify-center font-black text-sm">
                {i + 1}
              </div>
              <h3 className="mt-3 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pb-20 text-center">
        <div className="rounded-[2rem] border border-border bg-card/70 backdrop-blur-2xl p-10 sm:p-14">
          <Gauge className="w-8 h-8 mx-auto text-primary" />
          <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">Stop guessing what is wrong.</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            One link. One honest audit. One week of moves that actually change your numbers.
          </p>
          <button
            onClick={handleEnter}
            disabled={loading}
            className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {address ? 'Enter Studio' : 'Connect Scorpion'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 py-6 text-center text-[11px] text-muted-foreground tracking-wide">
        HYBRID · A TTT SUPER APP · SOCIAL ENGAGEMENT AUDITOR
      </footer>
    </div>
  );
}