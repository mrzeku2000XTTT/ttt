import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lightbulb, BookOpen } from "lucide-react";
import MotionLandingHero from "@/components/motion/MotionLandingHero";
import MotionLandingFeatures from "@/components/motion/MotionLandingFeatures";
import MotionLandingPresets from "@/components/motion/MotionLandingPresets";
import MotionLandingCTA from "@/components/motion/MotionLandingCTA";

export default function MotionLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <nav className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[900] tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Motion
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/MotionPrompts"
            className="text-[12px] font-bold px-3 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" /> Prompts
          </Link>
          <Link
            to="/MotionIdeas"
            className="text-[12px] font-bold px-3 py-2 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:text-yellow-200 flex items-center gap-1.5 transition-all"
          >
            <Lightbulb className="w-3.5 h-3.5" /> Ideas
          </Link>
          <Link
            to="/MotionStudio"
            className="text-[12px] font-bold px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white transition-all"
          >
            Launch
          </Link>
        </div>
      </nav>

      <MotionLandingHero />
      <MotionLandingFeatures />
      <MotionLandingPresets />
      <MotionLandingCTA />

      <footer className="border-t border-white/10 py-8 text-center text-[11px] text-white/30">
        Motion · Vibe-code landing pages · Built on Base44
      </footer>
    </div>
  );
}