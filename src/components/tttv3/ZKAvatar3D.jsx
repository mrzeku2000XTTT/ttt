import React from "react";
import { motion } from "framer-motion";

/**
 * ZKAvatar3D — animated orb avatar for ZK's chat responses.
 * Pure CSS/motion (no WebGL) — the previous three.js orb crashed React
 * ("reading 'source'") on some devices. This version can't fail.
 */
export default function ZKAvatar3D({ live = false, size = 32 }) {
  if (!live) {
    return (
      <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }}>
        ZK
      </div>
    );
  }
  return (
    <div className="relative rounded-full overflow-hidden flex-shrink-0 mt-0.5"
      style={{ width: size, height: size, boxShadow: "0 0 14px rgba(245,158,11,0.45), inset 0 0 6px rgba(0,0,0,0.5)", border: "1px solid rgba(245,158,11,0.4)", background: "#0d0d0d" }}>
      {/* Rotating molten core */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ background: "conic-gradient(from 0deg, #f59e0b, #78350f, #fbbf24, #8b5cf6, #f59e0b)" }}
      />
      {/* Breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.85, 1.05, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,245,204,0.9) 0%, rgba(245,158,11,0.5) 35%, transparent 70%)" }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none"
        style={{ color: "rgba(0,0,0,0.75)", textShadow: "0 0 4px rgba(255,255,255,0.4)" }}>
        ZK
      </span>
    </div>
  );
}