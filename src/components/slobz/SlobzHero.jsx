import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function SlobzHero() {
  return (
    <div className="text-center pt-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6"
      >
        <Sparkles className="w-3.5 h-3.5 text-green-600" />
        <span className="text-xs font-semibold text-green-700 tracking-wide">SECTOR 6 · SLOBZ</span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight"
      >
        Slobz
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-lg md:text-xl text-gray-400 font-light max-w-xl mx-auto leading-relaxed"
      >
        Stop pretending you have it together.
        <br />
        Admit you're a slob. Let's fix it.
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-sm text-green-600 font-black tracking-[0.2em]"
      >
        GET A JOB IF YOU'RE A SLOB.
      </motion.p>
    </div>
  );
}