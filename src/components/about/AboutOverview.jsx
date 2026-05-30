import React from "react";
import { motion } from "framer-motion";
import { STATS } from "./aboutData";

export default function AboutOverview() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-emerald-300 text-[11px] font-bold tracking-[0.25em] uppercase mb-3">About TTT</p>
        <h2 className="text-3xl sm:text-4xl font-[200] tracking-tight leading-tight">
          One super app for the<br /><span className="font-[600] bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">entire Kaspa ecosystem.</span>
        </h2>
        <p className="mt-5 text-white/50 text-sm leading-relaxed max-w-lg">
          TTT brings AI, finance, games, creative tools and community into a single decentralized experience — all built on Kaspa's real-time BlockDAG.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-white/[0.03] border border-white/10 p-4"
            >
              <Icon className="w-4 h-4 text-emerald-300 mb-3" />
              <div className="text-2xl font-[300]">{s.value}</div>
              <div className="text-white/40 text-[11px] mt-0.5">{s.label}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}