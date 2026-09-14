import React from 'react';
import { Crosshair } from 'lucide-react';
export default function CameraFocusOverlay({ points, activeId, armed, onSelect, onPlace }) {
  const place = event => {
    if (!armed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onPlace({ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
  };
  return <div className={`camera-focus-layer ${armed ? 'is-armed' : ''}`} onClick={place} role={armed ? 'button' : undefined} aria-label={armed ? 'Click to set camera interest point' : undefined}>
    {armed && <div className="camera-focus-instruction"><Crosshair size={13}/>Click the subject to set interest point {points.length + 1}</div>}
    {points.map((point, index) => <button key={point.id} type="button" className={`camera-focus-point ${activeId === point.id ? 'is-active' : ''}`} style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} onClick={event => { event.stopPropagation(); onSelect(point.id); }} aria-label={`Interest point ${index + 1}`}><span>{index + 1}</span></button>)}
  </div>;
}