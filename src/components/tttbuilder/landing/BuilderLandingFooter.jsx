import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Github, KeyRound, Zap } from "lucide-react";

const BADGES = [
  { icon: Github, label: "Open Source" },
  { icon: KeyRound, label: "BYO Keys" },
  { icon: Zap, label: "Kaspa L1" },
];

export default function BuilderLandingFooter({ onGetStarted }) {
  return (
    <footer className="bg-[#F9F7F2] border-t border-[#e8e4de]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
        >
          Join the builders
        </motion.h2>
        <p className="text-[#666] text-sm sm:text-base max-w-md mx-auto mb-7">
          Vibe code. Build. Earn. On Kaspa.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-[#00E68E] text-[#1A1A1A] text-sm font-bold hover:bg-[#0ac97e] transition-colors shadow-[0_8px_24px_rgba(0,230,142,0.35)] mb-10"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <span key={b.label} className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full bg-white border border-[#e5e1da] text-[11px] font-bold text-[#5a554f]">
                <Icon className="w-3.5 h-3.5 text-[#00B36B]" /> {b.label}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#8a8580]">
          Onchain is the new internet.
        </p>
      </div>
    </footer>
  );
}