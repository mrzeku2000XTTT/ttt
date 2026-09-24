import React from 'react';
import { ArrowRight, Activity, FileVideo, Layers, Scissors, Type } from 'lucide-react';

const CARDS = [
  {
    icon: Scissors,
    title: 'Shot detection',
    body: 'Cut boundaries found against the video’s own rhythm, with a shot list of in/out points, lengths and per-shot palette.',
    sample: '3 cuts · avg shot 10.5s',
  },
  {
    icon: Activity,
    title: 'Motion analysis',
    body: 'Frame-to-frame pixel change across the whole piece, so you can read the rhythm instead of guessing at it.',
    sample: 'peak 66.9 · mean 3.0',
  },
  {
    icon: Type,
    title: 'Typography read',
    body: 'Faces, weight, case, tracking, placement and treatment — reported from the stills, with anything unreadable called out.',
    sample: 'Two-tone statement, sans',
  },
  {
    icon: Layers,
    title: 'Colour palette',
    body: 'The palette by area, most-used first, with readable colour names and the share each one actually holds.',
    sample: '#0a0a12 · #1b1046 · #6b3fd4',
  },
  {
    icon: FileVideo,
    title: 'Metadata',
    body: 'The container facts read straight off the file, so you know exactly what you are working with.',
    sample: '3996×2160 · 63.09s · H.264 / AAC · 31.8 MB',
  },
];

export default function PrismLandingExtracts({ onDrop }) {
  return (
    <section id="extracts" className="bg-[#fafafa] border-y border-[#f0f0f0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a8a8a]">Extraction</span>
          <h2 className="mt-3 text-[26px] sm:text-[36px] font-semibold tracking-[-0.02em] text-black">
            What PRISM extracts
          </h2>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-2xl border border-[#ececec] bg-white p-5">
                <span className="w-8 h-8 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-black" />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-black">{c.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#666666]">{c.body}</p>
                <p className="mt-3 pt-3 border-t border-[#f4f4f4] text-[10px] tabular-nums text-[#a3a3a3]">
                  {c.sample}
                </p>
              </div>
            );
          })}

          {/* CTA */}
          <div className="rounded-2xl p-5 flex flex-col justify-between bg-gradient-to-br from-[#07070c] via-[#130b2c] to-[#2a0f4d]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.28em] bg-gradient-to-r from-[#7aa2ff] to-[#d18cff] bg-clip-text text-transparent">
                PRISM
              </span>
              <h3 className="mt-3 text-[16px] font-semibold text-white leading-snug">
                Inspect a video. Unlock the structure behind every frame.
              </h3>
            </div>
            <button
              onClick={onDrop}
              className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-white text-black text-[12px] font-bold px-4 py-2.5 hover:bg-white/90 transition-colors"
            >
              Drop MP4 here <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}