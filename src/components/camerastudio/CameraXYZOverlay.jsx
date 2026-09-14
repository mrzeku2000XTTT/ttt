import React from 'react';
export default function CameraXYZOverlay({ transform, time }) {
  return <div className="camera-xyz-overlay" aria-label="Live camera XYZ transform">
    <span>Auto transform</span><b>{time.toFixed(1)}s</b>
    {['x', 'y', 'z'].map(axis => <div key={axis}><small>{axis.toUpperCase()}</small><strong>{transform[axis].toFixed(1)}°</strong></div>)}
  </div>;
}