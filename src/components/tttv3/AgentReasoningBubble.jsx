import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

/**
 * AgentReasoningBubble — renders the agent extension's "thinking" turn inline in the chat.
 * Collapsed by default — click to expand the full thought process & action.
 */
export default function AgentReasoningBubble({ msg }) {
  const { step, thought, action, status = "thinking", say } = msg.reasoning || {};
  const [expanded, setExpanded] = useState(false);

  const actionLabel = (() => {
    if (!action?.type) return null;
    switch (action.type) {
      case "navigate": return `navigate → ${action.url}`;
      case "click_text": return `click → "${action.text}"`;
      case "type_into": return `type into "${action.label}" → "${(action.text || "").slice(0, 40)}${action.text?.length > 40 ? "…" : ""}"`;
      case "scroll": return `scroll → ${action.y}px`;
      case "wait": return `wait → ${action.ms}ms`;
      case "finish": return "finish ✓";
      default: return action.type;
    }
  })();

  const hasDetails = !!(thought && thought !== say) || !!actionLabel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 ring-1 ring-fuchsia-400/30 flex items-center justify-center">
        {status === "done" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Brain className="w-4 h-4 text-fuchsia-300" />
        )}
      </div>

      <div className="flex flex-col gap-1.5 min-w-0 flex-1 max-w-[85%]">
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium px-1">
          <span className="text-fuchsia-300/80">Vision Agent · extension</span>
          <span>·</span>
          <span>step {step}</span>
          {status === "thinking" && (
            <>
              <span>·</span>
              <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-400" />
              <span className="text-cyan-300/80">reasoning</span>
            </>
          )}
        </div>

        <button
          onClick={() => hasDetails && setExpanded((v) => !v)}
          disabled={!hasDetails}
          className={`text-left px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-gradient-to-br from-fuchsia-500/[0.08] to-cyan-500/[0.05] ring-1 ring-fuchsia-400/20 backdrop-blur-sm transition-all ${
            hasDetails ? "hover:ring-fuchsia-400/40 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {say && (
                <p className="text-[13px] text-white/85 leading-snug">{say}</p>
              )}
            </div>
            {hasDetails && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-fuchsia-300/60 flex-shrink-0 mt-0.5 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>

          <AnimatePresence initial={false}>
            {expanded && hasDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 mt-2 border-t border-fuchsia-400/15 space-y-1.5">
                  {thought && thought !== say && (
                    <p className="text-[11px] text-white/55 italic leading-snug">
                      <span className="text-fuchsia-300/70 not-italic font-medium">thought: </span>
                      {thought}
                    </p>
                  )}
                  {actionLabel && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300/90 bg-black/30 rounded-md px-2 py-1">
                      <span className="text-white/30">→</span>
                      <span>{actionLabel}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {hasDetails && !expanded && (
          <span className="text-[9px] text-fuchsia-300/40 px-1">click to see thought process</span>
        )}
      </div>
    </motion.div>
  );
}