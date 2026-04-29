import React from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, CheckCircle2 } from "lucide-react";

/**
 * AgentReasoningBubble — renders a sub-agent "thinking" turn inline in the chat.
 * Shows: step number, current thought, action being taken, and a live status.
 */
export default function AgentReasoningBubble({ msg }) {
  const { step, thought, action, status = "thinking", say } = msg.reasoning || {};

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      {/* Sub-agent avatar — distinct from main agent */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 ring-1 ring-fuchsia-400/30 flex items-center justify-center">
        {status === "done" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Brain className="w-4 h-4 text-fuchsia-300" />
        )}
      </div>

      <div className="flex flex-col gap-1.5 min-w-0 flex-1 max-w-[85%]">
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium px-1">
          <span className="text-fuchsia-300/80">Sub-agent</span>
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

        <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-gradient-to-br from-fuchsia-500/[0.08] to-cyan-500/[0.05] ring-1 ring-fuchsia-400/20 backdrop-blur-sm space-y-1.5">
          {say && (
            <p className="text-[13px] text-white/85 leading-snug">{say}</p>
          )}
          {thought && thought !== say && (
            <p className="text-[11px] text-white/50 italic leading-snug">
              <span className="text-fuchsia-300/70 not-italic font-medium">thought: </span>
              {thought}
            </p>
          )}
          {actionLabel && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300/90 bg-black/30 rounded-md px-2 py-1 mt-1">
              <span className="text-white/30">→</span>
              <span>{actionLabel}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}