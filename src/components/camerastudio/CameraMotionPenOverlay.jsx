import React, { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
export default function CameraMotionPenOverlay({ active, onComplete }) {
  const [points, setPoints] = useState([]), drawing = useRef(false);
  const point = event => { const rect = event.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }; };
  const begin = event => { if (!active) return; event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; setPoints([point(event)]); };
  const move = event => { if (!drawing.current) return; const next = point(event); setPoints(items => [...items, next]); };
  const end = event => { if (!drawing.current) return; drawing.current = false; event.currentTarget.releasePointerCapture(event.pointerId); setPoints(items => { if (items.length > 1) onComplete(items); return []; }); };
  const path = points.map(item => `${item.x * 100},${item.y * 100}`).join(' ');
  return <div className={`camera-pen-layer ${active ? 'is-active' : ''}`} onPointerDown={begin} onPointerMove={move} onPointerUp={end}>{active && !points.length && <span><Pencil size={12}/>Draw on empty canvas; layers stay draggable</span>}{path && <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={path}/></svg>}</div>;
}