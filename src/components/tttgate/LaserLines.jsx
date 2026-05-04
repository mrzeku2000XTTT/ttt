import React from "react";
import { motion } from "framer-motion";

/**
 * LaserLines — bright neon laser SLICING through the landing image.
 * The actual image split is handled by TTTGate (clipped halves).
 * This component renders only the bright laser beam + traveling photon
 * along the cut line, plus corner brackets.
 */
export default function LaserLines() {
  return (
    <div className="absolute inset-0 z-[18] pointer-events-none overflow-hidden">
      {/* THE CUT — a razor sharp horizontal neon laser at 50% */}
      <div className="absolute left-0 right-0" style={{ top: "50%", transform: "translateY(-50%)" }}>
        {/* Wide outer halo */}
        <motion.div
          className="absolute left-0 right-0 h-[40px] -translate-y-1/2 top-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,40,80,0.35) 20%, rgba(255,80,180,0.45) 50%, rgba(255,40,80,0.35) 80%, transparent 100%)",
            filter: "blur(20px)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Mid glow */}
        <motion.div
          className="absolute left-0 right-0 h-[10px] -translate-y-1/2 top-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,80,180,0.9) 50%, transparent)",
            filter: "blur(4px)",
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Razor-sharp core */}
        <div
          className="absolute left-0 right-0 h-[2px] -translate-y-1/2 top-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 10%, rgba(255,80,180,1) 50%, rgba(255,255,255,1) 90%, transparent 100%)",
            boxShadow:
              "0 0 8px rgba(255,255,255,1), 0 0 20px rgba(255,80,180,1), 0 0 40px rgba(255,40,80,0.9), 0 0 80px rgba(255,40,80,0.6)",
          }}
        />
        {/* Traveling photon */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-40 h-[4px] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,1) 50%, transparent)",
            boxShadow:
              "0 0 30px rgba(255,255,255,1), 0 0 60px rgba(255,80,180,1), 0 0 100px rgba(255,40,80,0.9)",
          }}
          initial={{ left: "-20%" }}
          animate={{ left: ["-20%", "120%"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        />
        {/* Sparks at the cut edges */}
        <motion.div
          className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{
            background: "white",
            boxShadow: "0 0 20px rgba(255,255,255,1), 0 0 40px rgba(255,80,180,1)",
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{
            background: "white",
            boxShadow: "0 0 20px rgba(255,255,255,1), 0 0 40px rgba(255,80,180,1)",
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
      </div>

    </div>
  );
}