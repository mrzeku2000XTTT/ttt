import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, Target } from "lucide-react";

export default function RoadmapPhaseCard({ step, stepIndex, onToggleSubtask, onTogglePhase, subtaskStates }) {
  const [expanded, setExpanded] = useState(false);

  const completedCount = (step.tasks || []).filter((_, ti) => subtaskStates[`${stepIndex}-${ti}`]).length;
  const totalCount = (step.tasks || []).length;
  const phaseComplete = totalCount > 0 && completedCount === totalCount;

  const phaseColors = phaseComplete
    ? "bg-emerald-500/5 border-emerald-500/30"
    : "bg-white/[0.03] border-white/10";

  return (
    <div className={`rounded-2xl border ${phaseColors} overflow-hidden transition-all`}>
      {/* Phase header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        {/* Phase checkbox */}
        <div
          onClick={(e) => { e.stopPropagation(); onTogglePhase(stepIndex); }}
          className="flex-shrink-0 mt-0.5"
        >
          {phaseComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2} />
          ) : (
            <Circle className="w-5 h-5 text-white/30 hover:text-white/50 transition-colors" strokeWidth={2} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-teal-900 bg-teal-400/80 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {step.phase}
            </span>
          </div>
          <h3 className={`text-sm font-bold leading-tight ${phaseComplete ? "text-emerald-400" : "text-white"}`}>
            {step.title}
          </h3>
          {step.description && (
            <p className="text-white/40 text-xs mt-1 line-clamp-2">{step.description}</p>
          )}

          {/* Mini progress bar */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40 font-bold flex-shrink-0">
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expandable sub-tasks */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-white/5">
              {(step.tasks || []).map((task, taskIndex) => {
                const done = !!subtaskStates[`${stepIndex}-${taskIndex}`];
                return (
                  <button
                    key={taskIndex}
                    onClick={() => onToggleSubtask(stepIndex, taskIndex)}
                    className="w-full flex items-start gap-2.5 text-left group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-1.5 border-white/20 group-hover:border-cyan-400/50 transition-colors" style={{ borderWidth: "1.5px" }} />
                      )}
                    </div>
                    <span className={`text-xs leading-relaxed ${done ? "text-white/30 line-through" : "text-white/70"}`}>
                      {task}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}