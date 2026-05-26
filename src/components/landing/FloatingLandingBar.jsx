import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCube from "./AnimatedCube";

export default function FloatingLandingBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.35 }}
      className="mx-auto mt-6 flex w-[min(92vw,620px)] items-center justify-between gap-3 rounded-full border border-white/15 bg-black/45 px-3 py-2 shadow-[0_24px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3 pl-1">
        <AnimatedCube />
        <div className="hidden sm:block">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/70">TTT 2.5 Portal</p>
          <p className="text-sm text-white/80">Enter the newly updated TTT experience</p>
        </div>
      </div>

      <Link
        to="/TTTGate"
        className="group flex items-center gap-2 rounded-full border border-purple-300/30 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_28px_rgba(168,85,247,0.28)] transition-all hover:bg-white/20 hover:border-purple-200/60"
      >
        <Sparkles className="h-4 w-4 text-purple-200" />
        Launch TTT 2.5
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}