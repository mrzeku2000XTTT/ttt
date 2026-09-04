import React from 'react';

export const HYPER_LOGO =
  'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d87c0d602_generated_image.png';

export default function HyperLogo({ size = 40, glow = true, className = '' }) {
  return (
    <img
      src={HYPER_LOGO}
      alt="HYPER"
      className={`rounded-xl object-cover ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: glow ? '0 0 24px rgba(255,255,255,0.18)' : undefined,
      }}
    />
  );
}