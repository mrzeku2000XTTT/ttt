import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Wand2, ArrowRight, Zap } from "lucide-react";

export default function MotionLandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 bg-cyan-500" />
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 bg-purple-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-white/80 tracking-wide">VIBE-CODE LANDING PAGES IN SECONDS</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 leading-[1.05]">
          <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
            Motion
          </span>
        </h1>

        <p className="text-lg sm:text-2xl text-white/70 max-w-2xl mx-auto mb-4 font-medium">
          Describe your vibe. Get a pixel-perfect landing page.
        </p>
        <p className="text-sm sm:text-base text-white/40 max-w-xl mx-auto mb-10">
          AI-powered landing page generator. Pick a preset, tweak the prompt, ship a stunning React + Tailwind page in under 30 seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/MotionStudio"
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-105"
          >
            <Wand2 className="w-4 h-4" />
            Launch Motion
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#presets"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-bold text-sm transition-all"
          >
            <Zap className="w-4 h-4" />
            See Presets
          </a>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-[11px] text-white/40 flex-wrap">
          <span>⚡ Generates in 20–40s</span>
          <span>🎨 6+ vibe presets</span>
          <span>📱 Fully responsive</span>
          <span>⚛️ React + Tailwind</span>
        </div>
      </div>
    </section>
  );
}