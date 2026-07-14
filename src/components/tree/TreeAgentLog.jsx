import React from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function TreeAgentLog({ steps }) {
  if (!steps.length) return null;
  return (
    <div className="bg-black/60 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm"
        >
          {s.done ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-emerald-300 animate-spin flex-shrink-0" />
          )}
          <span className={s.done ? "text-white/50" : "text-emerald-200"}>{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}