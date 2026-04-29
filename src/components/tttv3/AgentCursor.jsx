import React from "react";
import { motion } from "framer-motion";

/**
 * AgentCursor — animated fake cursor overlay that moves across the agent computer.
 * Position is in % (relative to parent), animated via framer-motion.
 */
export default function AgentCursor({ x = 50, y = 50, clicking = false, visible = true }) {
  if (!visible) return null;
  return (
    <motion.div
      animate={{
        left: `${x}%`,
        top: `${y}%`,
        scale: clicking ? 0.7 : 1,
      }}
      transition={{ type: "spring", damping: 18, stiffness: 90, mass: 0.8 }}
      className="absolute pointer-events-none z-30"
      style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 3 L21 12 L13 13 L9 21 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {clicking && (
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-cyan-400/40"
        />
      )}
    </motion.div>
  );
}