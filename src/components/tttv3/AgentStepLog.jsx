import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Brain } from "lucide-react";

/**
 * Live transcript of the autonomous agent's reasoning loop.
 * Each step shows: thought, action taken, outcome.
 */
export default function AgentStepLog({ steps, running }) {
  if (steps.length === 0 && !running) return null;

  return (
    <div className="px-4 py-3 border-t border-white/5 bg-black/40 max-h-[180px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-3 h-3 text-cyan-400" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">
          Agent Reasoning
        </span>
        {running && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-auto" />}
      </div>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {steps.map((s, i) => {
            const ok = s.plan?.done || s.action?.result?.ok;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 text-[11px]"
              >
                <span className="text-white/30 font-mono shrink-0 w-6">#{s.step}</span>
                {ok ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 truncate">{s.plan?.thought}</div>
                  <div className="text-white/40 truncate font-mono text-[10px]">
                    {s.plan?.action?.type}
                    {s.plan?.action?.text && ` "${s.plan.action.text}"`}
                    {s.plan?.action?.url && ` → ${s.plan.action.url}`}
                    {s.plan?.action?.label && ` [${s.plan.action.label}]`}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}