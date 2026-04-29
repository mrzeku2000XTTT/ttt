import React, { useMemo } from "react";

/**
 * SakuraPetals — animated falling cherry blossom petals across the viewport.
 * Pure CSS animation, fixed position, pointer-events disabled.
 */
export default function SakuraPetals({ count = 25 }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100, // %
        size: 10 + Math.random() * 14, // px
        duration: 8 + Math.random() * 10, // s
        delay: Math.random() * 12, // s
        sway: 30 + Math.random() * 60, // px
        rotation: Math.random() * 360,
        opacity: 0.4 + Math.random() * 0.5,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-[-40px]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `petalFall ${p.duration}s linear ${p.delay}s infinite, petalSway ${p.duration / 2}s ease-in-out ${p.delay}s infinite alternate`,
            "--sway": `${p.sway}px`,
          }}
        >
          <svg
            viewBox="0 0 20 20"
            className="w-full h-full"
            style={{
              transform: `rotate(${p.rotation}deg)`,
              animation: `petalSpin ${4 + Math.random() * 4}s linear infinite`,
              filter: "drop-shadow(0 1px 2px rgba(255, 192, 203, 0.3))",
            }}
          >
            <path
              d="M10 2 C 6 5, 4 9, 6 13 C 7 16, 9 17, 10 18 C 11 17, 13 16, 14 13 C 16 9, 14 5, 10 2 Z"
              fill="url(#petalGrad)"
            />
            <defs>
              <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd1dc" />
                <stop offset="50%" stopColor="#ffb6c1" />
                <stop offset="100%" stopColor="#ff8fa3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}

      <style>{`
        @keyframes petalFall {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(110vh) translateX(var(--sway)); }
        }
        @keyframes petalSway {
          0% { margin-left: 0; }
          100% { margin-left: calc(var(--sway) * -0.5); }
        }
        @keyframes petalSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}