import React from "react";
import { motion } from "framer-motion";
import { MILESTONES } from "./aboutData";

export default function AboutMilestones() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">Milestones</h2>
      <div className="relative pl-5">
        <div className="absolute left-[3px] top-1 bottom-1 w-px bg-gradient-to-b from-emerald-400/60 to-transparent" />
        <div className="space-y-5">
          {MILESTONES.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              <span className="absolute -left-[18px] top-1 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />
              <p className="text-emerald-300 text-[11px] font-semibold tracking-wide">{m.date}</p>
              <p className="text-white/60 text-sm font-[300] mt-0.5">{m.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}