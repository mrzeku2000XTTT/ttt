import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
export default function CameraFocusOverlay({ points, activeId, armed, onSelect, onPlace, onPreview, onMove }) {
  const [drag, setDrag] = useState(null);
  const coordinates = event => {
    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const place = event => {
    if (!armed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onPlace({ x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
  };
  const begin = (event, point) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); onSelect(point.id); setDrag({ id: point.id, x: point.x, y: point.y }); };
  const move = event => { if (!drag) return; const next = { id: drag.id, ...coordinates(event) }; setDrag(next); onPreview(next.id, { x: next.x, y: next.y }); };
  const end = event => { if (!drag) return; event.stopPropagation(); onMove(drag.id, { x: drag.x, y: drag.y }); setDrag(null); };
  return <div className={`camera-focus-layer ${armed ? 'is-armed' : ''}`} onClick={place} role={armed ? 'button' : undefined} aria-label={armed ? 'Click to set camera interest point' : undefined}>
    {armed && <div className="camera-focus-instruction"><Crosshair size={13}/>Click the subject to set interest point {points.length + 1}</div>}
    {points.map((point, index) => { const shown = drag?.id === point.id ? drag : point; return <button key={point.id} type="button" className={`camera-focus-point ${activeId === point.id ? 'is-active' : ''} ${drag?.id === point.id ? 'is-dragging' : ''}`} style={{ left: `${shown.x * 100}%`, top: `${shown.y * 100}%` }} onPointerDown={event => begin(event, point)} onPointerMove={move} onPointerUp={end} onClick={event => event.stopPropagation()} aria-label={`Drag interest point ${index + 1}`}><span>{index + 1}</span></button>; })}
  </div>;
}