import React from "react";
import { motion } from "framer-motion";
import { KINE_LIBRARY } from "@/components/kine/kineLibrary";

export default function KineSuggestions({ onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="text-center mb-5">
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-400">
          Try one of these
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {KINE_LIBRARY.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(s.prompt)}
            className="group relative p-3.5 rounded-2xl bg-white hover:bg-white border border-zinc-200/70 hover:border-zinc-300 text-left transition-all shadow-sm hover:shadow-md hover:shadow-zinc-900/5"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-zinc-200/80 flex-shrink-0 bg-zinc-100">
                <img
                  src={s.image}
                  alt={s.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[13px] font-semibold text-zinc-900 tracking-tight">{s.label}</span>
            </div>
            <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{s.prompt}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}