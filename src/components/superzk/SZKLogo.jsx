import React from "react";
import { motion } from "framer-motion";

const LETTERS = ["S", "Z", "K"];
const COLORS = ["#f59e0b", "#d97706", "#fbbf24"];

export default function SZKLogo({ size = 48, animated = true }) {
  return (
    <div className="flex items-center justify-center gap-0.5" style={{ height: size }}>
      {LETTERS.map((letter, i) => (
        <motion.span
          key={letter}
          className="font-black leading-none"
          style={{
            fontSize: size * 0.7,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            color: COLORS[i],
            textShadow: `0 0 ${size * 0.3}px ${COLORS[i]}55`,
            display: "inline-block",
          }}
          animate={
            animated
              ? {
                  y: [0, -size * 0.12, 0],
                  opacity: [0.85, 1, 0.85],
                  scale: [1, 1.08, 1],
                }
              : {}
          }
          transition={{
            duration: 2 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
}