import React from "react";

// Custom faceted-gem monogram — replaces default third-party crypto logos
// for a luxurious, brand-neutral identity. Pure SVG, no external assets.
export default function LuxMark({ size = 28, className = "", glow = true }) {
  const uid = React.useId();
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className}
      fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      style={glow ? { filter: "drop-shadow(0 0 10px rgba(212,175,55,0.35))" } : undefined}>
      <defs>
        <linearGradient id={`luxGold-${uid}`} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbf3c4" />
          <stop offset="0.45" stopColor="#e8c87a" />
          <stop offset="0.75" stopColor="#d4af37" />
          <stop offset="1" stopColor="#8a6d1f" />
        </linearGradient>
        <linearGradient id={`luxGoldV-${uid}`} x1="24" y1="3" x2="24" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbf3c4" />
          <stop offset="1" stopColor="#8a6d1f" />
        </linearGradient>
      </defs>
      {/* Outer gem silhouette */}
      <path d="M24 3 L42 18 L24 45 L6 18 Z" stroke={`url(#luxGold-${uid})`} strokeWidth="1.5" fill="rgba(212,175,55,0.05)" />
      {/* Crown facets */}
      <path d="M6 18 H42" stroke={`url(#luxGold-${uid})`} strokeWidth="1.1" />
      <path d="M15 18 L24 3" stroke={`url(#luxGold-${uid})`} strokeWidth="0.9" opacity="0.55" />
      <path d="M33 18 L24 3" stroke={`url(#luxGold-${uid})`} strokeWidth="0.9" opacity="0.55" />
      {/* Pavilion */}
      <path d="M15 18 L24 45" stroke={`url(#luxGold-${uid})`} strokeWidth="0.8" opacity="0.4" />
      <path d="M33 18 L24 45" stroke={`url(#luxGold-${uid})`} strokeWidth="0.8" opacity="0.4" />
      <path d="M24 18 L24 45" stroke={`url(#luxGoldV-${uid})`} strokeWidth="0.7" opacity="0.5" />
    </svg>
  );
}