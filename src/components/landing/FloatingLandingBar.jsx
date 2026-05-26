import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingLandingBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.35 }}
      className="mx-auto mt-5 flex w-[min(94vw,760px)] flex-col gap-3 rounded-[2rem] border border-white/15 bg-black/60 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-100">
          Since Nov 7 2025
        </span>
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
          Powered by Kaspa
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/35 bg-purple-300/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-50">
          <Zap className="h-3.5 w-3.5 text-purple-200" />
          SUPER AI AGENTS
        </span>
      </div>

      <Link
        to="/TTTGate"
        className="group flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white px-6 py-3 text-sm font-black text-black shadow-[0_0_30px_rgba(255,255,255,0.22)] transition-all hover:scale-[1.02] hover:bg-emerald-100"
      >
        <Sparkles className="h-4 w-4 text-purple-700" />
        Launch TTT 2.5
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}