import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Github, KeyRound } from "lucide-react";
import KaspaMark from "@/components/tttbuilder/landing/KaspaMark";

const BADGES = [
  { icon: Github, label: "Open Source" },
  { icon: KeyRound, label: "BYO Keys" },
  { kaspa: true, label: "Kaspa L1" },
];

export default function BuilderLandingFooter({ onGetStarted }) {
  return (
    <footer className="border-t border-[#00ff99]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white"
        >
          Join the builders
        </motion.h2>
        <p className="text-[#a0a0a0] text-sm sm:text-base max-w-md mx-auto mb-7">
          Vibe code. Build. Earn. On Kaspa.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-[#00ff99] text-black text-sm font-bold hover:bg-[#33ffb0] transition-colors shadow-[0_8px_28px_rgba(0,255,153,0.35)] mb-10"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          {BADGES.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/20 text-[11px] font-bold text-white/70">
              {b.kaspa ? <KaspaMark size={14} /> : (() => { const Icon = b.icon; return <Icon className="w-3.5 h-3.5 text-[#00ff99]" />; })()} {b.label}
            </span>
          ))}
        </div>
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40">
          Onchain is the new internet.
        </p>
      </div>
    </footer>
  );
}