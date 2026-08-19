import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AgentStudioHero() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-8 sm:pt-14 pb-8 sm:pb-10 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold tracking-[0.15em] uppercase mb-5">
          <Sparkles className="w-3 h-3" />
          Alpha Studio
        </span>
        <h1 className="text-[2rem] sm:text-6xl font-[800] tracking-tight text-zinc-900 leading-[1.08] mb-3 sm:mb-4">
          Agent Internet Studio
        </h1>
        <p className="text-zinc-500 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Train your own AI agent with a native Kaspa wallet. Every training epoch is a real self-send transaction — provable, non-custodial, and yours to export.
        </p>
      </motion.div>
    </div>
  );
}