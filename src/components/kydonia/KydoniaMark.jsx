import React, { useId } from "react";

// The header mark. The hero draws the globe in ASCII at full size; at 34px the
// characters are only a few pixels tall and read as noise, so the mark is the
// same disc drawn as crisp vector — same palette, same survey sweep, with the
// character grid kept as fine ticks across the surface.
export default function KydoniaMark({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const discId = `kyd-disc-${uid}`;
  const clipId = `kyd-clip-${uid}`;

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-[9px] border border-[#23262d] bg-[#0b0d11] p-[3px] ${className}`}
      style={{ width: 34, height: 34 }}
    >
      <svg viewBox="0 0 32 32" className="h-full w-full" role="img" aria-label="KYDONIA">
        <defs>
          <radialGradient id={discId} cx="36%" cy="30%" r="74%">
            <stop offset="0%" stopColor="#ff8f5e" />
            <stop offset="52%" stopColor="#d1471f" />
            <stop offset="100%" stopColor="#5e2110" />
          </radialGradient>
          <clipPath id={clipId}>
            <circle cx="16" cy="16" r="11" />
          </clipPath>
        </defs>

        <circle cx="16" cy="16" r="11" fill={`url(#${discId})`} />

        <g clipPath={`url(#${clipId})`} opacity="0.24" stroke="#ffe6d5" strokeWidth="0.8">
          {[6, 9.5, 13, 16.5, 20, 23.5, 26.5].map((y) => (
            <line key={y} x1="4" y1={y} x2="28" y2={y} strokeDasharray="1.3 1.7" />
          ))}
        </g>

        <g clipPath={`url(#${clipId})`}>
          <rect x="3" y="13.4" width="26" height="2.1" fill="#ffd9c4" opacity="0.85" />
          <rect x="3" y="16.2" width="26" height="0.9" fill="#ff9d6e" opacity="0.5" />
        </g>

        <circle cx="16" cy="16" r="11" fill="none" stroke="#43220f" strokeWidth="1.1" />
      </svg>
    </div>
  );
}