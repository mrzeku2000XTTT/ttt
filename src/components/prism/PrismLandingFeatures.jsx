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

export default function PrismLandingFeatures() {
  return (
    <>
      {/* feature bar */}
      <section id="product" className="border-y border-[#f0f0f0] bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {BAR.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#f5f5f7] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-black" />
                </span>
                <span>
                  <span className="block text-[12px] font-semibold text-black">{f.title}</span>
                  <span className="block text-[11px] text-[#666666] leading-snug">{f.body}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* workflow */}
      <section id="workflow" className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a8a8a]">The workflow</span>
          <h2 className="mt-3 text-[26px] sm:text-[36px] font-semibold tracking-[-0.02em] text-black">
            From pixels to a recipe
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-[13px] leading-relaxed text-[#666666]">
            PRISM turns video into structured, editable data — so you can study, remix and rebuild with confidence.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {STEPS.map(([n, title, body]) => (
              <div key={n} className="rounded-2xl border border-[#efefef] p-5 hover:border-[#dcdcdc] transition-colors">
                <span className="text-[11px] font-bold tabular-nums bg-gradient-to-r from-[#0000FF] to-[#A020F0] bg-clip-text text-transparent">
                  {n}
                </span>
                <span className="block mt-2 text-[14px] font-semibold text-black">{title}</span>
                <span className="block mt-1.5 text-[12px] leading-relaxed text-[#666666]">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}