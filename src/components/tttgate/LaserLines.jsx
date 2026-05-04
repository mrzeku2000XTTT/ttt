import React from "react";
import { motion } from "framer-motion";

/**
 * LaserLines — pure UI laser-themed overlay.
 * Crisscrossing animated laser beams + corner brackets. No interaction.
 */
export default function LaserLines() {
  const beams = [
    { angle: -18, top: "22%", color: "rgba(255,40,40,0.9)", delay: 0, dur: 3.2 },
    { angle: 12, top: "38%", color: "rgba(255,80,80,0.7)", delay: 0.6, dur: 4 },
    { angle: -8, top: "58%", color: "rgba(80,255,180,0.85)", delay: 1.1, dur: 3.6 },
    { angle: 22, top: "74%", color: "rgba(120,255,200,0.7)", delay: 0.3, dur: 4.4 },
  ];

  return (
    <div className="absolute inset-0 z-[16] pointer-events-none overflow-hidden">
      {/* Laser beams */}
      {beams.map((b, i) => (
        <div
          key={i}
          className="absolute left-[-10%] right-[-10%]"
          style={{ top: b.top, transform: `rotate(${b.angle}deg)` }}
        >
          {/* Beam core */}
          <motion.div
            className="h-[1px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${b.color} 50%, transparent 100%)`,
              boxShadow: `0 0 8px ${b.color}, 0 0 18px ${b.color}`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: b.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay,
            }}
          />
          {/* Traveling photon */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-12 h-[2px] rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${b.color}, transparent)`,
              boxShadow: `0 0 14px ${b.color}`,
            }}
            initial={{ left: "-10%" }}
            animate={{ left: ["-10%", "110%"] }}
            transition={{
              duration: b.dur * 0.9,
              repeat: Infinity,
              ease: "linear",
              delay: b.delay,
            }}
          />
        </div>
      ))}

      {/* Corner targeting brackets */}
      {[
        { top: 16, left: 16, rot: 0 },
        { top: 16, right: 16, rot: 90 },
        { bottom: 16, right: 16, rot: 180 },
        { bottom: 16, left: 16, rot: 270 },
      ].map((c, i) => (
        <motion.div
          key={`c-${i}`}
          className="absolute w-8 h-8"
          style={{ ...c, transform: `rotate(${c.rot}deg)` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500"
            style={{ boxShadow: "0 0 8px rgba(255,40,40,0.9)" }} />
          <div className="absolute top-0 left-0 w-[2px] h-full bg-red-500"
            style={{ boxShadow: "0 0 8px rgba(255,40,40,0.9)" }} />
        </motion.div>
      ))}

      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          style={{ width: 120, height: 120 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,40,40,0.9), transparent)",
              boxShadow: "0 0 6px rgba(255,40,40,0.7)",
            }} />
          <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(80,255,180,0.9), transparent)",
              boxShadow: "0 0 6px rgba(80,255,180,0.7)",
            }} />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
            style={{ width: 14, height: 14 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}