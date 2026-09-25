import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Download, Gauge, Layers, Scissors, Store, Type, Waves } from 'lucide-react';
import LumiflyHero from './LumiflyHero';

const FEATURES = [
  { icon: Type, title: 'Type that moves', body: 'Five text animations — three carried over from Camera Studio.' },
  { icon: Waves, title: 'Gradient backdrops', body: 'Mesh drift, aurora sweep or still, on a seamless time loop.' },
  { icon: Gauge, title: 'Every dial', body: 'Easing, speed, slide offsets, glow and its dissolve.' },
  { icon: Scissors, title: 'Match cuts', body: 'Scenes hand off on a shared direction, or cut clean.' },
  { icon: Layers, title: 'Scene by scene', body: 'As many scenes as you like, each with its own look.' },
];

const STEPS = [
  { n: '01', title: 'Type the words', body: 'The box above drops your phrase straight into scene one.' },
  { n: '02', title: 'Pick a backdrop', body: 'Four gradient palettes, three motions, one slider for speed.' },
  { n: '03', title: 'Set the motion', body: 'Animation, easing, slide offsets and glow — with the curve drawn for you.' },
  { n: '04', title: 'Export the frame', body: 'Download the current frame at 720P, 1080P or 4K.' },
];

const OUTPUTS = [
  { icon: Type, title: 'Text animations', body: 'Pick how the words arrive', value: 'MotionTextAnimation' },
  { icon: Waves, title: 'Gradient animation', body: 'How the type’s own gradient moves', value: 'Sweep' },
  { icon: Layers, title: 'Background motions', body: 'How the backdrop drifts', value: 'Mesh drift' },
  { icon: Gauge, title: 'Scene length', body: 'Stretched half a second at a time', value: '6.0s' },
];

const Kicker = ({ children }) => (
  <p className="text-[10px] uppercase tracking-[0.2em] text-[#999999]">{children}</p>
);

export default function LumiflyLanding() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const accountLabel = user?.full_name || user?.email || 'Sign in';

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <header className="sticky top-0 z-40 border-b border-[#F0F0F0] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <span className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#0000FF] to-[#A020F0] text-[13px] font-bold text-white">
              L
            </span>
            <span className="text-[14px] font-semibold tracking-tight">Lumifly</span>
            <span className="hidden text-[11px] text-[#999999] sm:inline">Motion type studio</span>
          </span>

          <nav className="ml-auto hidden items-center gap-5 text-[12px] text-[#666666] md:flex">
            <a href="#features" className="transition-colors hover:text-black">Features</a>
            <a href="#workflow" className="transition-colors hover:text-black">Workflow</a>
            <a href="#output" className="transition-colors hover:text-black">Output</a>
            <Link to="/LumiflyStudio" className="transition-colors hover:text-black">Open studio</Link>
          </nav>

          <Link
            to="/AppStoreV2"
            className="ml-4 flex items-center gap-1.5 rounded-full border border-[#ECECEC] px-3 py-1.5 text-[11px] text-[#666666] transition-colors hover:border-black hover:text-black"
          >
            <Store className="w-3.5 h-3.5" />
            Store
          </Link>

          {user ? (
            <Link
              to="/Profile"
              className="max-w-[140px] truncate rounded-full bg-black px-3.5 py-1.5 text-[11px] font-medium text-white"
            >
              {accountLabel}
            </Link>
          ) : (
            <button
              onClick={() => {
                window.location.href = '/login';
              }}
              className="rounded-full bg-black px-3.5 py-1.5 text-[11px] font-medium text-white"
            >
              {accountLabel}
            </button>
          )}
        </div>
      </header>

      <LumiflyHero />

      <section id="features" className="border-y border-[#F0F0F0]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-4 w-4 text-[#0000FF]" />
              <p className="mt-3 text-[12px] font-semibold tracking-tight">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#666666]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-6 py-16 text-center">
        <Kicker>Workflow</Kicker>
        <h2 className="mx-auto mt-3 max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
          From a phrase to a finished scene
        </h2>
        <p className="mt-2 text-[13px] text-[#666666]">Four moves, no timeline gymnastics.</p>

        <div className="mt-10 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="rounded-2xl border border-[#F0F0F0] p-5">
              <span className="bg-gradient-to-r from-[#0000FF] to-[#A020F0] bg-clip-text text-[12px] font-semibold text-transparent">
                {step.n}
              </span>
              <p className="mt-2 text-[13px] font-semibold tracking-tight">{step.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#666666]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="output" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="text-center">
          <Kicker>What it produces</Kicker>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Real settings, real output</h2>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OUTPUTS.map(({ icon: Icon, title, body, value }) => (
            <div key={title} className="rounded-2xl border border-[#F0F0F0] p-5">
              <Icon className="h-4 w-4 text-[#0000FF]" />
              <p className="mt-3 text-[13px] font-semibold tracking-tight">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#666666]">{body}</p>
              <p className="mt-4 border-t border-[#F0F0F0] pt-3 text-[11px] font-medium text-black">{value}</p>
            </div>
          ))}

          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0000FF] to-[#A020F0] p-5 text-white">
            <div>
              <p className="text-[13px] font-semibold tracking-tight">Lumifly</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/80">
                Type it, set the motion, download the frame. Nothing to install.
              </p>
            </div>
            <Link
              to="/LumiflyStudio"
              className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] font-semibold text-black"
            >
              Open the studio
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#0000FF] to-[#A020F0] px-8 py-12 text-center text-white">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Lumifly</p>
          <h2 className="mx-auto mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Make it happen — one line of type, moving exactly how you want.
          </h2>
          <Link
            to="/LumiflyStudio"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-3 text-[12px] font-semibold text-black"
          >
            Start a scene
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#F0F0F0]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[#0000FF] to-[#A020F0] text-[11px] font-bold text-white">
              L
            </span>
            <span className="text-[12px] font-semibold tracking-tight">Lumifly</span>
          </span>
          <p className="text-[11px] text-[#666666]">
            Built for motion designers in the TTT store. Renders locally — your text never leaves the browser.
          </p>
          <Link to="/LumiflyStudio" className="flex items-center gap-1.5 text-[11px] text-[#666666] hover:text-black">
            <Download className="w-3.5 h-3.5" />
            Open the studio
          </Link>
        </div>
      </footer>
    </div>
  );
}