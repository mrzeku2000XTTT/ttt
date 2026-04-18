import React from "react";

export const STYLE_COLORS = {
  kaspa: "#00c8b4",
  fire: "#ff6b35",
  neon: "#ff00ff",
  luxury: "#d4af37",
  minimal: "#888888",
  ocean: "#0077b6",
  dark: "#333333",
  auto: "#06b6d4",
};

export const STYLE_OPTIONS = ["kaspa", "fire", "neon", "luxury", "minimal", "ocean", "dark", "auto"];

export default function StyleDot({ style, size = 10 }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        background: STYLE_COLORS[style] || STYLE_COLORS.auto,
        boxShadow: `0 0 8px ${STYLE_COLORS[style] || STYLE_COLORS.auto}80`,
      }}
    />
  );
}