import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MOTION_PRESETS } from "./motionPresets";

export default function MotionLandingPresets() {
  return (
    <section id="presets" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
          <span className="text-[11px] font-bold text-white/80 tracking-wide">PRESET MARKETPLACE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
          Start from a vibe.
        </h2>
        <p className="text-white/50 text-base max-w-xl mx-auto">
          Hand-crafted prompts for every aesthetic — from NFT mint pages to luxury hospitality.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOTION_PRESETS.map((preset) => (
          <div
            key={preset.id}
            className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all bg-zinc-950"
          >
            {preset.preview && (
              <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                <img
                  src={preset.preview}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${preset.accent}20`, color: preset.accent, border: `1px solid ${preset.accent}40` }}
                >
                  {preset.category}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{preset.name}</h3>
              <p className="text-white/50 text-[12px] leading-relaxed line-clamp-2">{preset.tagline}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          to="/MotionStudio"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm transition-all"
        >
          Browse all presets in Motion
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}