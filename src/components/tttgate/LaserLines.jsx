import React from "react";
import { motion } from "framer-motion";

/**
 * LaserLines — ultra bright neon laser overlay.
 * Pure UI, no interaction. Crisscrossing high-intensity beams + crosshair.
 */
export default function LaserLines() {
  const beams = [
    { angle: -18, top: "18%", color: "255,30,80", delay: 0, dur: 2.6 },
    { angle: 14, top: "32%", color: "255,80,180", delay: 0.4, dur: 3.2 },
    { angle: -6, top: "48%", color: "80,255,220", delay: 0.9, dur: 2.8 },
    { angle: 20, top: "64%", color: "120,200,255", delay: 0.2, dur: 3.4 },
    { angle: -22, top: "80%", color: "180,80,255", delay: 1.3, dur: 3.0 },
  ];

  return (
    <div className="absolute inset-0 z-[16] pointer-events-none overflow-hidden">
      {/* Bright neon laser beams */}
      {beams.map((b, i) => (
        <div
          key={i}
          className="absolute left-[-15%] right-[-15%]"
          style={{ top: b.top, transform: `rotate(${b.angle}deg)` }}
        >
          {/* Outer glow halo */}
          <motion.div
            className="h-[6px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(${b.color},0.45) 50%, transparent 100%)`,
              filter: "blur(6px)",
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: b.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay,
            }}
          />
          {/* Beam core — razor sharp */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(${b.color},1) 50%, transparent 100%)`,
              boxShadow: `0 0 12px rgba(${b.color},1), 0 0 24px rgba(${b.color},0.9), 0 0 48px rgba(${b.color},0.7), 0 0 96px rgba(${b.color},0.5)`,
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: b.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay,
            }}
          />
          {/* Traveling photon pulse */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-24 h-[3px] rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${b.color},1) 50%, transparent)`,
              boxShadow: `0 0 20px rgba(${b.color},1), 0 0 40px rgba(${b.color},0.8)`,
            }}
            initial={{ left: "-15%" }}
            animate={{ left: ["-15%", "115%"] }}
            transition={{
              duration: b.dur * 0.85,
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
          className="absolute w-10 h-10"
          style={{ ...c, transform: `rotate(${c.rot}deg)` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
        >
          <div
            className="absolute top-0 left-0 w-full h-[2px]"
            style={{
              background: "rgb(255,40,80)",
              boxShadow: "0 0 12px rgba(255,40,80,1), 0 0 24px rgba(255,40,80,0.8)",
            }}
          />
          <div
            className="absolute top-0 left-0 w-[2px] h-full"
            style={{
              background: "rgb(255,40,80)",
              boxShadow: "0 0 12px rgba(255,40,80,1), 0 0 24px rgba(255,40,80,0.8)",
            }}
          />
        </motion.div>
      ))}

    </div>
  );
}