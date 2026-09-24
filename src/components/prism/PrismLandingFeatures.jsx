import React from 'react';
import { Activity, Frame, Layers, Scissors, Type } from 'lucide-react';

const BAR = [
  { icon: Frame, title: 'Frame-by-frame', body: 'Analyse every frame in detail' },
  { icon: Scissors, title: 'Shot detection', body: 'Find cuts, scenes and transitions' },
  { icon: Activity, title: 'Motion curves', body: 'Track movement and rhythm' },
  { icon: Type, title: 'Typography read', body: 'Detect fonts, text and styles' },
  { icon: Layers, title: 'Palette by area', body: 'Understand colour composition' },
];

const STEPS = [
  ['01', 'Sample', 'Drop your MP4 and let PRISM analyse it locally in your browser.'],
  ['02', 'Measure', 'Get shot boundaries, pacing, motion, palette, typography and more.'],
  ['03', 'Understand', 'Explore the data with visual curves, timelines and frame-level insight.'],
  ['04', 'Rebuild', 'Use the keyframe recipe to recreate, remix or build new motion.'],
];

/** The dark band: the feature bar and the workflow share one prism gradient. */
export default function PrismLandingFeatures() {
  return (
    <section
      id="product"
      className="bg-gradient-to-b from-[#07070c] via-[#130b2c] to-[#2a0f4d]"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* feature bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 py-7 border-b border-white/10">
          {BAR.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </span>
                <span>
                  <span className="block text-[12px] font-semibold text-white">{f.title}</span>
                  <span className="block text-[11px] text-white/55 leading-snug">{f.body}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* workflow */}
        <div id="workflow" className="py-14 sm:py-20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">
            The workflow
          </span>
          <h2 className="mt-3 text-[26px] sm:text-[36px] font-semibold tracking-[-0.02em] text-white">
            From pixels to a recipe
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-[13px] leading-relaxed text-white/60">
            PRISM turns video into structured, editable data — so you can study, remix and rebuild with confidence.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {STEPS.map(([n, title, body]) => (
              <div
                key={n}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-white/25 transition-colors"
              >
                <span className="text-[11px] font-bold tabular-nums bg-gradient-to-r from-[#7aa2ff] to-[#d18cff] bg-clip-text text-transparent">
                  {n}
                </span>
                <span className="block mt-2 text-[14px] font-semibold text-white">{title}</span>
                <span className="block mt-1.5 text-[12px] leading-relaxed text-white/60">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}