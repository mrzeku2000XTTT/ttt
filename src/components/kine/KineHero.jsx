import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Film } from "lucide-react";

export default function KineHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-center mb-12"
    >
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200/60 text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-6">
        <Sparkles className="w-3 h-3" /> AI Video Agent
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative inline-block mb-7"
      >
        <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-2xl shadow-zinc-900/20">
          <Film className="w-7 h-7 text-white" />
        </div>
      </motion.div>

      <h1 className="text-6xl sm:text-7xl md:text-8xl font-[900] tracking-tight mb-4 text-zinc-900">
        Kine
      </h1>
      <p className="text-zinc-700 text-xl sm:text-2xl max-w-xl mx-auto leading-tight mb-3 font-medium tracking-tight">
        Describe anything. Watch it move.
      </p>
      <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
        Your AI video agent enhances your prompt, then generates a cinematic 6-second clip in HD.
      </p>

      <div className="flex items-center justify-center gap-3 mt-8 text-[10px] text-zinc-400 font-semibold tracking-widest uppercase">
        <span>Agent Powered</span>
        <span className="w-1 h-1 rounded-full bg-zinc-300" />
        <span>16:9 · 6s · HD</span>
      </div>
    </motion.div>
  );
}