import React from "react";
import { motion } from "framer-motion";
import { ECOSYSTEM } from "./aboutData";

export default function AboutEcosystem() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">The ecosystem</h2>
      <p className="text-white/50 text-sm font-[300] max-w-md">80+ apps across every category, all connected through one super app.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {ECOSYSTEM.map((e, i) => (
          <motion.div
            key={e.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:border-emerald-400/30 transition-colors"
          >
            <h3 className="text-sm font-[600]">{e.name}</h3>
            <p className="text-white/40 text-xs mt-1 font-[300]">{e.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}