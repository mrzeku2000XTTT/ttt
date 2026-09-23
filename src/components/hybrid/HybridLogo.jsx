import React from 'react';

export default function HybridLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#080b09" stroke="#00ff99" strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M15 13.5v21l14-10.5-14-10.5z" fill="#00ff99" />
      <path
        d="M29.5 14.5H36a4.5 4.5 0 0 1 4.5 4.5v4.5A4.5 4.5 0 0 1 36 28h-2.5l-4 3.5V28H29.5"
        stroke="#00ff99"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}