import React from 'react';
export default function CameraXYZOverlay({ transform, time }) {
  return <div className="camera-xyz-overlay" aria-label="Live camera XYZ transform">
    <span>Auto transform</span>
    {['x', 'y', 'z'].map(axis => <b key={axis}><small>{axis.toUpperCase()}</small>{transform[axis].toFixed(1)}°</b>)}
    <time>{time.toFixed(1)}s</time>
  </div>;
}