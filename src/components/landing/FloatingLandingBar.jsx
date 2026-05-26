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
      className="mx-auto mt-5 flex w-[min(94vw,760px)] flex-col items-center gap-3 border-t border-white/20 px-3 pt-4 sm:flex-row sm:justify-center sm:gap-5"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full bg-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:text-[11px]">
        <span>Since Nov 7 2025</span>
        <span className="hidden h-3 w-px bg-black/25 sm:block" />
        <span>Powered by Kaspa</span>
        <span className="hidden h-3 w-px bg-black/25 sm:block" />
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          SUPER AI AGENTS
        </span>
      </div>

      <Link
        to="/TTTGate"
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all hover:bg-emerald-100"
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-700" />
        Launch TTT 2.5
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}