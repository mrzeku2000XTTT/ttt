import React, { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, ChevronDown, Rocket, MessageCircleQuestion, MessageSquare } from "lucide-react";

// ZKThoughtBubble — shows ZK's internal reasoning + the action it decided to take
export default function ZKThoughtBubble({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const { thought, decidedAction, goal, missing } = msg;

  const action = {
    launch_computer: { Icon: Rocket, label: "ACTION: LAUNCH COMPUTER", color: "#22d3ee" },
    ask_for_info: { Icon: MessageCircleQuestion, label: `ACTION: ASK USER${missing ? ` — ${missing}` : ""}`, color: "#f59e0b" },
    reply: { Icon: MessageSquare, label: "ACTION: REPLY ONLY", color: "rgba(217,119,6,0.7)" },
  }[decidedAction] || { Icon: MessageSquare, label: "ACTION: REPLY", color: "rgba(217,119,6,0.7)" };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.4)" }}>
        <BrainCircuit className="w-4 h-4" style={{ color: "#f59e0b" }} />
      </div>
      <button
        onClick={() => goal && setExpanded(v => !v)}
        className="max-w-[78%] px-3.5 py-2.5 text-left"
        style={{ background: "rgba(217,119,6,0.05)", border: "1px dashed rgba(217,119,6,0.35)", cursor: goal ? "pointer" : "default" }}
      >
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: "rgba(217,119,6,0.6)" }}>
          ◆ ZK THOUGHT
          {goal && <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />}
        </div>
        {thought && <p className="text-[12px] italic leading-snug mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>{thought}</p>}
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: action.color }}>
          <action.Icon className="w-3 h-3 flex-shrink-0" />
          {action.label}
        </div>
        {expanded && goal && (
          <div className="mt-2 pt-2 text-[10px] font-mono leading-snug" style={{ borderTop: "1px solid rgba(217,119,6,0.2)", color: "rgba(34,211,238,0.8)" }}>
            → goal: {goal}
          </div>
        )}
      </button>
    </motion.div>
  );
}