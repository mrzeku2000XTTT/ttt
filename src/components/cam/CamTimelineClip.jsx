import React, { useRef } from 'react';

export default function CamTimelineClip({ clip, image, title, zoom, selected, onSelect, onUpdate, disabled }) {
  const drag = useRef(null);
  return <button className={`cm-tl-clip ${selected ? 'is-selected' : ''}`} style={{ left: clip.start * zoom, width: Math.max(12, clip.duration * zoom) }} title={`${title} · ${clip.start.toFixed(2)}–${(clip.start + clip.duration).toFixed(2)}s`}
    onClick={(e) => { e.stopPropagation(); onSelect(clip); }} onPointerDown={(e) => { e.stopPropagation(); if (disabled) return; drag.current = { x: e.clientX, start: clip.start }; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={(e) => { if (drag.current) onUpdate(clip.id, { start: Math.max(0, Math.round((drag.current.start + (e.clientX - drag.current.x) / zoom) * 100) / 100) }); }}
    onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
    {image && <img src={image} alt="" draggable={false} />}<span>{title}</span><small>{clip.duration.toFixed(1)}s</small>
    <div className="cm-tl-keys">{clip.keys.filter((k) => k.t <= clip.duration).map((key, i) => <i key={i} style={{ left: Math.min(99, key.t / clip.duration * 100) + '%' }} />)}</div>
  </button>;
}