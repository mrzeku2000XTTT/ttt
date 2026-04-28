import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
        <Link
          to="/MotionStudio"
          className="text-[12px] font-bold px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white transition-all"
        >
          Launch
        </Link>
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