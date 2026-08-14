import React from "react";

/** Tiny 7-day price sparkline drawn from an array of numbers. */
export default function Sparkline({ points, up = true, width = 56, height = 18 }) {
  if (!points?.length || points.length < 2) return null;
  const sampled = points.filter((_, i) => i % Math.ceil(points.length / 40) === 0);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const span = max - min || 1;
  const d = sampled
    .map((p, i) => `${(i / (sampled.length - 1)) * width},${height - ((p - min) / span) * height}`)
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0 overflow-visible">
      <polyline
        points={d}
        fill="none"
        strokeWidth="1.5"
        stroke={up ? "#34d399" : "#f87171"}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}