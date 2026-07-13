import React from "react";

// Animated radial lines + rings layer — matches the gold HUD aesthetic.
// When `warping` is true the lines spin fast for the zoom-out effect.
export default function WorldMotionLines({ warping = false }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <style>{`
        @keyframes wml-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wml-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes wml-pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.18; } 50% { transform: translate(-50%,-50%) scale(1.05); opacity: 0.4; } }
      `}</style>

      {/* Rotating radial rays */}
      <div className="absolute left-1/2 top-1/2" style={{
        width: "170vmax", height: "170vmax", marginLeft: "-85vmax", marginTop: "-85vmax",
        background: "repeating-conic-gradient(from 0deg, rgba(200,150,40,0.10) 0deg 0.4deg, transparent 0.4deg 11deg)",
        WebkitMaskImage: "radial-gradient(circle, transparent 16%, black 28%, black 52%, transparent 68%)",
        maskImage: "radial-gradient(circle, transparent 16%, black 28%, black 52%, transparent 68%)",
        animation: `wml-spin ${warping ? 1.4 : 110}s linear infinite`,
      }} />

      {/* Counter-rotating fine rays */}
      <div className="absolute left-1/2 top-1/2" style={{
        width: "170vmax", height: "170vmax", marginLeft: "-85vmax", marginTop: "-85vmax",
        background: "repeating-conic-gradient(from 5deg, rgba(240,200,60,0.06) 0deg 0.3deg, transparent 0.3deg 17deg)",
        WebkitMaskImage: "radial-gradient(circle, transparent 12%, black 26%, black 58%, transparent 72%)",
        maskImage: "radial-gradient(circle, transparent 12%, black 26%, black 58%, transparent 72%)",
        animation: `wml-spin-rev ${warping ? 2 : 160}s linear infinite`,
      }} />

      {/* Pulsing rings */}
      {[34, 52, 70].map((size, i) => (
        <div key={size} className="absolute left-1/2 top-1/2 rounded-full" style={{
          width: `${size}vmin`, height: `${size}vmin`,
          border: "1px solid rgba(200,150,40,0.25)",
          animation: `wml-pulse ${6 + i * 2}s ease-in-out infinite`,
          animationDelay: `${i * 1.2}s`,
        }} />
      ))}
    </div>
  );
}