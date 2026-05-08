import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Film, Bot } from "lucide-react";

export default function KineHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-center mb-10"
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase text-fuchsia-300 mb-5">
        <Sparkles className="w-3 h-3" /> AI Video Agent
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative inline-block mb-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 blur-3xl opacity-50 rounded-full" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-fuchsia-500/40">
          <Film className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <h1 className="text-5xl sm:text-6xl md:text-7xl font-[900] tracking-tight mb-4 bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
        Kine
      </h1>
      <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-2">
        Describe anything. Watch it move.
      </p>
      <p className="text-white/40 text-sm max-w-md mx-auto">
        Your AI video agent enhances your prompt, then generates a cinematic 6-second clip in HD.
      </p>

      <div className="flex items-center justify-center gap-4 mt-8 text-[10px] text-white/40 font-bold tracking-widest uppercase">
        <span className="flex items-center gap-1.5">
          <Bot className="w-3 h-3 text-fuchsia-300" /> Agent Powered
        </span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>16:9 · 6s · HD</span>
      </div>
    </motion.div>
  );
}