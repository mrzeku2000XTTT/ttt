import React from "react";
import { motion } from "framer-motion";

/**
 * OrganicOrb — a custom, looping, transparent organic orb.
 * Morphing border-radius + radial gradient + soft glow + inner highlight.
 * No background of its own — sits cleanly over any surface.
 */
export default function OrganicOrb({
  size = 40,
  colors = ["#22d3ee", "#6366f1", "#a855f7"],
  glow = true,
  spin = true,
  className = "",
}) {
  const grad = `radial-gradient(circle at 35% 28%, ${colors[0]} 0%, ${colors[1]} 55%, ${colors[colors.length - 1]} 100%)`;
  const radiusA = "42% 58% 63% 37% / 41% 44% 56% 59%";
  const radiusB = "58% 42% 37% 63% / 56% 59% 41% 44%";
  const radiusC = "50% 50% 60% 40% / 40% 60% 50% 50%";

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {glow && (
        <div
          className="absolute inset-0 rounded-full opacity-70"
          style={{ background: grad, filter: `blur(${size * 0.22}px)`, transform: "scale(1.15)" }}
        />
      )}
      <motion.div
        className="absolute inset-0"
        style={{ background: grad }}
        animate={{
          borderRadius: [radiusA, radiusB, radiusC, radiusA],
          rotate: spin ? [0, 180, 360] : 0,
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          top: size * 0.16,
          left: size * 0.2,
          background: "rgba(255,255,255,0.55)",
          filter: `blur(${size * 0.07}px)`,
        }}
      />
    </div>
  );
}