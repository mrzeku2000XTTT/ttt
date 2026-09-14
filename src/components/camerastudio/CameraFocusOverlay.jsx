import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
export default function CameraFocusOverlay({ points, activeId, armed, onSelect, onPlace, onPreview, onMove }) {
  const [drag, setDrag] = useState(null);
  const coordinates = event => {
    const rect = event.currentTarget.parentElement.getBoundingClientRect(), width = drag?.width || .18, height = drag?.height || width * rect.width / rect.height;
    return { x: Math.max(width / 2, Math.min(1 - width / 2, (event.clientX - rect.left) / rect.width)), y: Math.max(height / 2, Math.min(1 - height / 2, (event.clientY - rect.top) / rect.height)) };
  };
  const place = event => {
    if (!armed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = .18, height = Math.min(.8, width * rect.width / rect.height);
    onPlace({ x: Math.max(width / 2, Math.min(1 - width / 2, (event.clientX - rect.left) / rect.width)), y: Math.max(height / 2, Math.min(1 - height / 2, (event.clientY - rect.top) / rect.height)), width, height });
  };
  const begin = (event, point) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); onSelect(point.id); setDrag({ id: point.id, x: point.x, y: point.y, width: point.width || .18, height: point.height || .32 }); };
  const move = event => { if (!drag) return; const next = { id: drag.id, ...coordinates(event) }; setDrag(next); onPreview(next.id, { x: next.x, y: next.y, width: next.width, height: next.height }); };
  const end = event => { if (!drag) return; event.stopPropagation(); onMove(drag.id, { x: drag.x, y: drag.y, width: drag.width, height: drag.height }); setDrag(null); };
  return <div className={`camera-focus-layer ${armed ? 'is-armed' : ''}`} onClick={place} role={armed ? 'button' : undefined} aria-label={armed ? 'Click to set camera interest point' : undefined}>
    {armed && <div className="camera-focus-instruction"><Crosshair size={13}/>Click the subject to set interest point {points.length + 1}</div>}
    {points.map((point, index) => { const shown = drag?.id === point.id ? drag : point; return <button key={point.id} type="button" className={`camera-focus-point ${activeId === point.id ? 'is-active' : ''} ${drag?.id === point.id ? 'is-dragging' : ''}`} style={{ left: `${shown.x * 100}%`, top: `${shown.y * 100}%`, width: `${(shown.width || .18) * 100}%`, height: 'auto', aspectRatio: '1' }} onPointerDown={event => begin(event, point)} onPointerMove={move} onPointerUp={end} onClick={event => event.stopPropagation()} aria-label={`Drag interest point ${index + 1}`}><span>{index + 1}</span></button>; })}
  </div>;
}