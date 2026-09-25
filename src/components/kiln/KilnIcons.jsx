import React from 'react';

// Custom blocky icon set — drawn as pixel rects, deliberately not a stock icon pack.

const base = { fill: 'none', shapeRendering: 'crispEdges', 'aria-hidden': 'true' };

export function IconPixelFrame({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="3" width="18" height="18" fill="currentColor" opacity="0.1" />
      <rect x="3" y="3" width="18" height="3" fill="currentColor" />
      <rect x="3" y="18" width="18" height="3" fill="currentColor" />
      <rect x="3" y="6" width="3" height="12" fill="currentColor" />
      <rect x="18" y="6" width="3" height="12" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
    </svg>
  );
}

export function IconCodeSheet({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="2" width="16" height="20" fill="currentColor" opacity="0.1" />
      <rect x="4" y="2" width="16" height="3" fill="currentColor" />
      <rect x="7" y="8" width="7" height="2" fill="currentColor" />
      <rect x="10" y="12" width="7" height="2" fill="currentColor" />
      <rect x="7" y="16" width="10" height="2" fill="currentColor" />
      <rect x="4" y="19" width="16" height="3" fill="currentColor" />
    </svg>
  );
}

export function IconLinkDrop({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="2" y="4" width="11" height="3" fill="currentColor" />
      <rect x="2" y="4" width="3" height="16" fill="currentColor" />
      <rect x="2" y="17" width="11" height="3" fill="currentColor" />
      <rect x="14" y="10" width="8" height="3" fill="currentColor" />
      <rect x="11" y="13" width="3" height="8" fill="currentColor" />
      <rect x="14" y="18" width="8" height="3" fill="currentColor" />
    </svg>
  );
}

export function IconLayers({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="6" y="2" width="14" height="14" fill="currentColor" opacity="0.14" />
      <rect x="4" y="6" width="14" height="14" fill="currentColor" opacity="0.22" />
      <rect x="2" y="10" width="14" height="12" fill="currentColor" opacity="0.4" />
      <rect x="2" y="10" width="14" height="2" fill="currentColor" />
    </svg>
  );
}

export function IconEye({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="2" y="9" width="20" height="6" fill="currentColor" opacity="0.14" />
      <rect x="5" y="6" width="14" height="3" fill="currentColor" />
      <rect x="5" y="15" width="14" height="3" fill="currentColor" />
      <rect x="2" y="9" width="3" height="6" fill="currentColor" />
      <rect x="19" y="9" width="3" height="6" fill="currentColor" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

export function IconSpark({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="10" y="2" width="4" height="20" fill="currentColor" />
      <rect x="2" y="10" width="20" height="4" fill="currentColor" />
      <rect x="6" y="6" width="3" height="3" fill="currentColor" opacity="0.55" />
      <rect x="15" y="15" width="3" height="3" fill="currentColor" opacity="0.55" />
      <rect x="15" y="6" width="3" height="3" fill="currentColor" opacity="0.55" />
      <rect x="6" y="15" width="3" height="3" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function IconPixelWallet({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="2" y="5" width="20" height="14" fill="currentColor" opacity="0.12" />
      <rect x="2" y="5" width="20" height="3" fill="currentColor" />
      <rect x="2" y="16" width="20" height="3" fill="currentColor" />
      <rect x="2" y="8" width="3" height="8" fill="currentColor" />
      <rect x="19" y="8" width="3" height="8" fill="currentColor" />
      <rect x="14" y="11" width="4" height="3" fill="currentColor" />
    </svg>
  );
}