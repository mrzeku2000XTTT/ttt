import React from 'react';
import { ArrowRight, Youtube, TrendingUp, Wand2, BrainCircuit, Target, BarChart3, LineChart, Search, Sparkles } from 'lucide-react';
import HyperLogo from './HyperLogo';

const GLOW = { textShadow: '0 0 42px rgba(255,255,255,0.35)' };

const FEATURES = [
  {
    icon: Youtube,
    title: 'Crypto Ad Intelligence',
    body: 'HYPER scans YouTube for the best-performing crypto ads, promos and campaign videos — then reverse-engineers the hooks that are actually converting right now.',
  },
  {
    icon: TrendingUp,
    title: 'Organic Growth Architect',
    body: 'Get a realistic, week-by-week organic growth system for your channel or project — content pillars, posting cadence, hooks, and KPIs you can actually hit.',
  },
  {
    icon: Wand2,
    title: 'Motion Graphics Engine',
    body: 'Describe any shot — HYPER directs it and renders a real, downloadable MP4. Black, cinematic, ready to drop into your campaign.',
  },
  {
    icon: BrainCircuit,
    title: 'GPT-5.6 Orchestrator',
    body: 'One brain routes every request to the right pipeline: research, strategy, motion, or expert marketing counsel. No modes to manage — just ask.',
  },
];

const STEPS = [
  { icon: Search, title: 'Ask', body: 'Tell HYPER your goal — spy on crypto ads, build a growth plan, or generate a motion graphic.' },
  { icon: BrainCircuit, title: 'Orchestrate', body: 'The brain classifies your intent and runs the right pipeline automatically.' },
  { icon: BarChart3, title: 'Execute', body: 'You get ad intel, a growth system, or a rendered MP4 — all in one thread.' },
];

export default function HyperLanding({ onEnterStudio }) {
  return (
    <div className="relative overflow-hidden">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
      />

      {/* Nav */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HyperLogo size={38} />
            <span className="text-lg font-black tracking-tight">HYPER</span>
            <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full border border-white/15 text-[10px] font-bold tracking-widest text-white/50">
              MARKETING INTELLIGENCE
            </span>
          </div>
          <button
            onClick={onEnterStudio}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:shadow-[0_0_36px_rgba(255,255,255,0.35)] transition-all"
          >
            Launch Studio <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-xl text-[11px] font-bold tracking-widest text-white/60">
          <Sparkles className="w-3.5 h-3.5" /> GPT-5.6 BRAIN · CRYPTO SPECIALTY
        </div>
        <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          MARKETING
          <br />
          <span className="text-white" style={GLOW}>SUPERCHARGED.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-white/50 leading-relaxed">
          HYPER is the marketing brain your crypto project deserves — it researches YouTube ads,
          builds realistic organic growth strategies, and renders cinematic motion graphics.
          All in one thread.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onEnterStudio}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-bold text-sm hover:shadow-[0_0_44px_rgba(255,255,255,0.4)] transition-all"
          >
            Open the Studio <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onEnterStudio}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-xl font-semibold text-sm text-white/70 hover:text-white hover:border-white/40 transition-all"
          >
            Explore the Brain
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { v: '20+', l: 'Ads scanned per search' },
            { v: '90-day', l: 'Organic growth systems' },
            { v: 'MP4', l: 'Motion renders, ready' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-3 py-5">
              <div className="text-xl sm:text-2xl font-black">{s.v}</div>
              <div className="mt-1 text-[10px] sm:text-[11px] text-white/40 font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            One brain. <span style={GLOW}>Four weapons.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 hover:border-white/25 hover:bg-white/[0.05] transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.15)]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">How it works</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-center">
                <div className="mx-auto w-11 h-11 rounded-full border border-white/20 bg-white/[0.04] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                <div className="mt-3 text-[10px] font-black tracking-widest text-white/30">STEP {i + 1}</div>
                <h3 className="mt-1 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center">
        <div className="rounded-[2rem] border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-10 sm:p-14">
          <Target className="w-8 h-8 mx-auto text-white/80" />
          <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight" style={GLOW}>
            Ready to out-market them all?
          </h2>
          <p className="mt-3 text-white/50 text-sm sm:text-base">
            One thread. Ad intel, growth systems, and cinematic renders — on demand.
          </p>
          <button
            onClick={onEnterStudio}
            className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-bold text-sm hover:shadow-[0_0_44px_rgba(255,255,255,0.4)] transition-all"
          >
            Launch HYPER <LineChart className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-[11px] text-white/30 tracking-wide">
        HYPER · A TTT SUPER APP · CRYPTO MARKETING INTELLIGENCE
      </footer>
    </div>
  );
}