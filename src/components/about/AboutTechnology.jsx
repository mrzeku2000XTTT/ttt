import React from "react";
import { motion } from "framer-motion";
import { TECH } from "./aboutData";

export default function AboutTechnology() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">Technology</h2>
      <div className="space-y-3">
        {TECH.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 p-5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-[600] tracking-tight">{t.title}</h3>
            </div>
            <p className="text-white/45 text-xs leading-relaxed font-[300] pl-3.5">{t.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}