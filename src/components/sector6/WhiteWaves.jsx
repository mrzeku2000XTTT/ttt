import React from "react";

// Thin wavy-line decoration like the reference "white lines" artwork
export default function WhiteWaves({ className, flip = false }) {
  const lines = Array.from({ length: 28 });
  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      fill="none"
    >
      {lines.map((_, i) => (
        <path
          key={i}
          d={`M ${-50 + i * 4} ${80 + i * 14}
              C ${150 + i * 6} ${-40 + i * 10},
                ${320 - i * 3} ${360 - i * 8},
                ${520 + i * 4} ${140 + i * 12}`}
          stroke="#9ca3af"
          strokeOpacity={0.35}
          strokeWidth="0.7"
        />
      ))}
    </svg>
  );
}