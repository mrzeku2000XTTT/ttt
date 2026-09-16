import React from 'react';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  ['01', 'Type', 'Write in the box like a chat. ACT reads every letter the moment it lands.'],
  ['02', 'Press period', 'The sentence fires instantly — and the period itself starts becoming your image.'],
  ['03', 'Keep the image', 'Watch it load right where you typed it, then download it and type the next one.'],
];

export default function ACTLanding({ onEnter }) {
  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-10">
        <h1 className="text-7xl sm:text-9xl font-black tracking-tighter">ACT</h1>
        <p className="mt-6 max-w-xl text-sm sm:text-base text-neutral-400 leading-relaxed">
          Real-time typing to image. As you write, the eye of ACT analyzes every letter — and the
          instant you press the period, that sentence becomes a picture. You watch the period
          itself turn into a downloadable image.
        </p>
        <button
          onClick={onEnter}
          className="mt-10 inline-flex items-center gap-2 px-8 h-12 rounded-full border border-white/25 text-sm font-semibold tracking-wide hover:bg-white hover:text-black transition-colors"
        >
          Enter ACT <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="border-t border-white/10 px-6 py-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {STEPS.map(([n, title, desc]) => (
            <div key={n}>
              <span className="text-[10px] font-semibold text-neutral-600 tracking-widest">{n}</span>
              <p className="mt-1 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[10px] text-neutral-700 tracking-wide uppercase">Built for Kaspa</p>
      </div>
    </div>
  );
}