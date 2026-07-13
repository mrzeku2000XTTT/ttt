import React from "react";
import { motion } from "framer-motion";

export default function CWLDemo() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="border border-zinc-800 bg-zinc-950 p-5" style={{ fontFamily: "monospace" }}>
        <div className="flex items-center justify-between text-[9px] tracking-[0.25em] text-zinc-500 uppercase mb-4">
          <span>Public stream / live analysis</span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> STREAM STILL LIVE
          </span>
        </div>

        {/* Fake video area */}
        <div className="relative aspect-video bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 flex items-center justify-center overflow-hidden">
          <motion.div
            className="absolute inset-x-0 bottom-0 h-16 flex items-end gap-[3px] px-4 pb-3 opacity-70"
            aria-hidden
          >
            {Array.from({ length: 48 }).map((_, i) => (
              <motion.span
                key={i}
                className="flex-1 bg-red-500/70"
                animate={{ height: [4 + (i * 7) % 20, 8 + (i * 13) % 44, 4 + (i * 7) % 20] }}
                transition={{ duration: 1.2 + (i % 5) * 0.2, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
          <div className="text-center z-10">
            <p className="text-red-400 text-[10px] tracking-[0.3em] mb-1">BREAKOUT MOMENT DETECTED</p>
            <p className="text-white text-2xl font-black">94% MATCH</p>
            <p className="text-zinc-500 text-[10px] mt-1">00:10:01 · ENERGY SPIKE</p>
          </div>
        </div>

        {/* Selected range */}
        <div className="mt-4">
          <div className="flex justify-between text-[9px] text-zinc-500 mb-1">
            <span>09:42</span>
            <span className="text-white">SELECTED RANGE · 00:47</span>
            <span>10:34</span>
          </div>
          <div className="h-1.5 bg-zinc-800 relative">
            <div className="absolute left-[35%] right-[28%] top-0 bottom-0 bg-red-500" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[9px] tracking-[0.2em] text-zinc-500 uppercase">
          <span className="text-emerald-400">DRAFT 03 · READY IN 02:47</span>
          <span>47 SEC · 16:9</span>
        </div>
      </div>
    </div>
  );
}