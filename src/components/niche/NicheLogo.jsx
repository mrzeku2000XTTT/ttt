import React from 'react';

// Monochrome compass-target mark — blends into the dark UI with a soft white glow
export default function NicheLogo({ size = 40, glow = true }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)' }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="relative">
        <circle cx="24" cy="24" r="18" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="11" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="3 5" />
        <path d="M24 6 L29 22 L24 19 L19 22 Z" fill="white" />
        <circle cx="24" cy="24" r="3.5" fill="white" />
      </svg>
    </div>
  );
}