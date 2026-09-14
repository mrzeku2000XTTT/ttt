import React, { useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Trash2, Crosshair } from 'lucide-react';
export default function CameraVideoTimeline({ duration, time, playing, togglePlay, points, activeId, select, remove, move, preview, seek }) {
  const [drag, setDrag] = useState(null), markerDrag = useRef(null), ignoreClick = useRef(false);
  const markerTime = event => { const rect = event.currentTarget.parentElement.getBoundingClientRect(); return Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration)); };
  const beginMarker = (event, point) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); markerDrag.current = { id: point.id, moved: false }; setDrag({ id: point.id, time: point.time }); select(point.id); };
  const dragMarker = event => { if (!markerDrag.current) return; const next = markerTime(event); markerDrag.current.moved = true; setDrag({ id: markerDrag.current.id, time: next }); preview(markerDrag.current.id, { time: next }); };
  const endMarker = event => { if (!markerDrag.current || !drag) return; event.stopPropagation(); ignoreClick.current = markerDrag.current.moved; move(drag.id, { time: drag.time }); seek(drag.time); markerDrag.current = null; setDrag(null); };
  const scrub = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    seek(Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration)));
  };
  const jump = direction => {
    const ordered = [...points].sort((a, b) => a.time - b.time);
    const candidates = direction < 0 ? ordered.filter(point => point.time < time - .05).reverse() : ordered.filter(point => point.time > time + .05);
    seek(candidates[0]?.time ?? (direction < 0 ? 0 : duration));
  };
  return <section className="camera-timeline" aria-label="Video focus timeline">
    <div className="camera-timeline-head">
      <div className="camera-timeline-controls"><button onClick={() => jump(-1)} title="Previous interest point"><SkipBack size={13}/></button><button onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={14}/> : <Play size={14}/>}</button><button onClick={() => jump(1)} title="Next interest point"><SkipForward size={13}/></button></div>
      <span className="camera-timecode">{time.toFixed(1)}s / {duration.toFixed(1)}s</span>
      <span className="camera-timeline-label"><Crosshair size={12}/>{points.length} interest {points.length === 1 ? 'point' : 'points'}<em>Auto keyframes</em></span>
    </div>
    <div className="camera-timeline-track" onClick={scrub}>
      <div className="camera-timeline-fill" style={{ width: `${(time / duration) * 100}%` }}/>
      <span className="camera-playhead" style={{ left: `${(time / duration) * 100}%` }}/>
      {points.map((point, index) => { const markerTime = drag?.id === point.id ? drag.time : point.time; return <button key={point.id} className={`camera-timeline-point ${activeId === point.id ? 'is-active' : ''}`} style={{ left: `${(markerTime / duration) * 100}%` }} onPointerDown={event => beginMarker(event, point)} onPointerMove={dragMarker} onPointerUp={endMarker} onClick={event => { event.stopPropagation(); if (ignoreClick.current) { ignoreClick.current = false; return; } select(point.id); }} title={`Drag interest point ${index + 1} to change its time`}>{index + 1}</button>; })}
    </div>
    <div className="camera-timeline-items">{points.map((point, index) => <button key={point.id} className={activeId === point.id ? 'is-active' : ''} onClick={() => { select(point.id); seek(point.time); }}><span>{index + 1}</span>{point.time.toFixed(1)}s<i>X {Math.round(point.x * 100)} · Y {Math.round(point.y * 100)}</i><b onClick={event => { event.stopPropagation(); remove(point.id); }} aria-label={`Delete interest point ${index + 1}`}><Trash2 size={11}/></b></button>)}</div>
  </section>;
}