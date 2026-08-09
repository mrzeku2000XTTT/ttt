import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function OriginKitBackground({ variant = "particles" }) {
  const particles = useMemo(
    () => Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      dur: Math.random() * 6 + 8,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
        style={{ background: "#06b6d4" }}
        animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
        style={{ background: "#a855f7" }}
        animate={{ x: [0, -60, 0], y: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      {variant === "particles" && particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-400"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.3 }}
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}