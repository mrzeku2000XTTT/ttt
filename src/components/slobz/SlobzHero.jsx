import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function SlobzHero() {
  return (
    <div className="flex flex-col justify-center h-full">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium text-[#1A1A1A] leading-[1.15] tracking-tight"
      >
        Stop pretending you have it together. Admit you're a slob. Let's fix it.
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D5B3A]/8 border border-[#0D5B3A]/20 mt-8 self-start"
      >
        <Sparkles className="w-3 h-3 text-[#0D5B3A]" />
        <span className="text-[10px] font-bold text-[#0D5B3A] tracking-[0.2em]">SECTOR 6 · SLOBZ</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4"
      >
        <span className="font-heading text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tight">Slobz</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-xs text-[#0D5B3A] font-black tracking-[0.25em]"
      >
        GET A JOB IF YOU'RE A SLOB.
      </motion.p>
    </div>
  );
}