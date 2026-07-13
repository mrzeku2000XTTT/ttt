import React from "react";
import { motion } from "framer-motion";

export default function CWLHero() {
  return (
    <div className="pt-16 pb-10 text-center px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-500/40 text-[10px] tracking-[0.3em] text-red-400 mb-8" style={{ fontFamily: "monospace" }}>
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        LOCAL BETA LIVE · CLOUD WAITLIST OPEN
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl sm:text-7xl font-black text-white leading-[0.95] tracking-tight"
      >
        THE FIRST CLIP<br />
        <span className="italic text-red-500">WINS THE</span><br />
        <span className="italic text-red-500">MOMENT.</span>
      </motion.h1>
      <p className="max-w-xl mx-auto mt-6 text-sm text-zinc-400 leading-relaxed">
        ClipWhileLive watches public streams as they happen, finds the moments worth
        posting, and hands you an editable draft before everyone else reaches the VOD.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
        <a
          href="https://github.com/aj47/hermes-live-clipper"
          target="_blank" rel="noopener noreferrer"
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-[0.2em] transition-colors"
          style={{ fontFamily: "monospace" }}
        >
          TRY THE LOCAL BETA · GITHUB ↗
        </a>
      </div>
      <p className="mt-3 text-[10px] text-zinc-600 tracking-widest uppercase">Open source · macOS</p>
    </div>
  );
}