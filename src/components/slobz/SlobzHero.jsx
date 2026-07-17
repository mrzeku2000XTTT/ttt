import React from "react";
import { motion } from "framer-motion";
import { User, LogOut, Sparkles } from "lucide-react";

const HERO_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d74177eb0_generated_image.png";

export default function SlobzHero({ onIntakeClick, onWellnessClick }) {
  return (
    <div>
      {/* Top nav */}
      <div className="flex items-center justify-between py-5">
        <div className="flex items-center gap-6">
          <span className="font-display text-2xl font-black text-[#3D2E7C]">Slobz</span>
          <span className="hidden md:block text-sm text-[#5A4B8A]">Get a job if you're a slob.</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-[#5A4B8A]">
          <Sparkles className="w-4 h-4 text-[#7C5CFC]" />
          <span>Sector 6 · SLOBZ</span>
        </div>
        <div className="flex items-center gap-3 text-[#5A4B8A]">
          <User className="w-5 h-5" />
          <LogOut className="w-5 h-5" />
        </div>
      </div>

      {/* Hero with clay scene */}
      <div
        className="relative rounded-[32px] overflow-hidden bg-cover bg-center min-h-[420px] md:min-h-[520px] flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-2.5 rounded-full bg-[#8B6FF5] shadow-[0_8px_20px_rgba(124,92,252,0.4)] mb-6"
        >
          <span className="font-display text-sm font-extrabold text-white">Slobz Momentum Track</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl md:text-5xl font-black text-[#4A2FA8] leading-[1.15] max-w-2xl"
        >
          Stop pretending you have it together. Admit you're a slob. Let's fix it.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm md:text-base text-[#4A3D75] max-w-md font-body"
        >
          Dump your chaos. Extract your skills. Get micro-gigs, a real resume, and a redemption plan.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 mt-8"
        >
          <button
            onClick={onIntakeClick}
            className="px-8 py-3 rounded-full bg-[#8B6FF5] hover:bg-[#7C5CFC] shadow-[0_8px_20px_rgba(124,92,252,0.45)] font-display text-sm font-extrabold text-white transition-colors"
          >
            The Chaos Intake
          </button>
          <button
            onClick={onWellnessClick}
            className="px-8 py-3 rounded-full bg-[#A995F8] hover:bg-[#9B84F6] shadow-[0_8px_20px_rgba(124,92,252,0.35)] font-display text-sm font-extrabold text-white transition-colors"
          >
            Financial Wellness
          </button>
        </motion.div>
      </div>
    </div>
  );
}