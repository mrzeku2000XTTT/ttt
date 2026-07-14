import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, MessageCircle, HelpCircle } from "lucide-react";

const GLASS = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.10) 100%)",
  backdropFilter: "blur(20px) saturate(170%)",
  WebkitBackdropFilter: "blur(20px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -6px 12px rgba(255,255,255,0.04)",
};

const ACTIONS = {
  launch_computer: { icon: Monitor, label: "LAUNCHING COMPUTER", color: "#22d3ee" },
  reply: { icon: MessageCircle, label: "REPLYING", color: "#f59e0b" },
  ask_for_info: { icon: HelpCircle, label: "NEEDS INFO", color: "#f472b6" },
};

/**
 * ZKGlassThought — an iOS-glass thought bubble mirroring a real one:
 * a main bubble with animated dots + two trailing mini-bubbles.
 * Tap to expand and reveal ZK's inner thoughts and decided action.
 */
export default function ZKGlassThought({ msg }) {
  const [open, setOpen] = useState(false);
  const action = ACTIONS[msg.decidedAction] || ACTIONS.reply;
  const ActionIcon = action.icon;

  return (
    <div className="relative pl-1 pb-3">
      {/* Trailing mini-bubbles — the real-life thought bubble tail */}
      <div className="absolute left-0 bottom-0 w-2 h-2 rounded-full" style={GLASS} />
      <div className="absolute left-2.5 bottom-2 w-3.5 h-3.5 rounded-full" style={GLASS} />

      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.96 }}
        layout
        className="relative text-left rounded-[26px] overflow-hidden ml-5"
        style={{ ...GLASS, maxWidth: open ? "min(480px, 88%)" : undefined }}
        title="Tap to see ZK's thoughts & actions"
      >
        {/* Glass top highlight streak */}
        <div className="absolute top-0 left-3 right-3 h-[38%] rounded-full pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.22), transparent)" }} />

        {!open ? (
          <div className="flex items-center gap-1.5 px-5 py-3">
            {[0, 1, 2].map(j => (
              <motion.span key={j}
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.1, 0.85] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: j * 0.22 }}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", boxShadow: "0 0 8px rgba(245,158,11,0.55)" }} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 space-y-2.5">
              <div className="text-[8px] font-black uppercase tracking-[0.35em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                💭 ZK · INNER THOUGHTS
              </div>
              {msg.thought && (
                <p className="text-[12px] italic leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                  “{msg.thought}”
                </p>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full w-fit"
                style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${action.color}55` }}>
                <ActionIcon className="w-3 h-3" style={{ color: action.color }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: action.color }}>{action.label}</span>
              </div>
              {msg.goal && (
                <div className="px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(0,0,0,0.25)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                  <div className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>MISSION GOAL</div>
                  <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{msg.goal}</p>
                </div>
              )}
              {msg.missing && (
                <p className="text-[11px]" style={{ color: "#f472b6" }}>Missing: {msg.missing}</p>
              )}
              <div className="text-[8px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.25)" }}>tap to collapse</div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.button>
    </div>
  );
}