import React from "react";
import { motion } from "framer-motion";
import { Loader2, Check, X, Circle } from "lucide-react";

export default function AgentStepFeed({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2"
        >
          <div className="mt-0.5 shrink-0">
            {s.status === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />}
            {s.status === "done" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            {s.status === "failed" && <X className="w-3.5 h-3.5 text-red-400" />}
            {s.status === "pending" && <Circle className="w-3 h-3 text-white/25" />}
          </div>
          <div className="min-w-0">
            <div className={`text-[11px] leading-snug ${s.status === "pending" ? "text-white/35" : "text-white/85"}`}>
              {s.label}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-300/50">{s.app}</div>
            {s.status === "done" && s.result && (
              <div className="text-[10px] text-white/45 mt-0.5 whitespace-pre-line line-clamp-3">{s.result}</div>
            )}
            {s.status === "failed" && s.result && (
              <div className="text-[10px] text-red-400/70 mt-0.5">{s.result}</div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}