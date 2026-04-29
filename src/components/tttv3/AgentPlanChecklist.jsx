import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

/**
 * AgentPlanChecklist — shows the numbered plan the Vision Agent built from the user's prompt.
 * Each item ticks off as the autonomous loop completes it.
 *
 * plan: [{ id, title, status: "pending" | "running" | "done" | "failed" }]
 */
export default function AgentPlanChecklist({ plan, currentIndex }) {
  if (!plan || plan.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full ring-1 ring-cyan-400/30 flex items-center justify-center overflow-hidden bg-black">
        <img
          src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/7e50a555a_generated_image.png"
          alt="Vision Agent"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1.5 min-w-0 flex-1 max-w-[90%]">
        <div className="text-[10px] text-cyan-300/80 font-medium px-1 tracking-wide">
          Vision Agent · plan ({plan.filter((p) => p.status === "done").length}/{plan.length})
        </div>

        <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-gradient-to-br from-cyan-500/[0.06] to-violet-500/[0.04] ring-1 ring-cyan-400/20 backdrop-blur-sm">
          <ol className="space-y-2">
            <AnimatePresence initial={false}>
              {plan.map((item, i) => (
                <motion.li
                  key={item.id || i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : item.status === "running" ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : item.status === "failed" ? (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/25" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] leading-snug transition-colors ${
                        item.status === "done"
                          ? "text-white/50 line-through"
                          : item.status === "running"
                          ? "text-white font-medium"
                          : item.status === "failed"
                          ? "text-amber-300/90"
                          : "text-white/65"
                      }`}
                    >
                      <span className="text-white/30 font-mono mr-1.5">{i + 1}.</span>
                      {item.title}
                    </div>
                    {item.status === "running" && item.note && (
                      <div className="text-[11px] text-cyan-300/70 mt-0.5">{item.note}</div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </div>
      </div>
    </motion.div>
  );
}