import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Trash2, Crosshair } from 'lucide-react';
export default function CameraVideoTimeline({ duration, time, playing, togglePlay, points, activeId, select, remove, seek }) {
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
      <span className="camera-timeline-label"><Crosshair size={12}/>{points.length} interest {points.length === 1 ? 'point' : 'points'}</span>
    </div>
    <div className="camera-timeline-track" onClick={scrub}>
      <div className="camera-timeline-fill" style={{ width: `${(time / duration) * 100}%` }}/>
      <span className="camera-playhead" style={{ left: `${(time / duration) * 100}%` }}/>
      {points.map((point, index) => <button key={point.id} className={`camera-timeline-point ${activeId === point.id ? 'is-active' : ''}`} style={{ left: `${(point.time / duration) * 100}%` }} onClick={event => { event.stopPropagation(); select(point.id); seek(point.time); }} title={`Interest point ${index + 1} at ${point.time.toFixed(1)} seconds`}>{index + 1}</button>)}
    </div>
    <div className="camera-timeline-items">{points.map((point, index) => <button key={point.id} className={activeId === point.id ? 'is-active' : ''} onClick={() => { select(point.id); seek(point.time); }}><span>{index + 1}</span>{point.time.toFixed(1)}s<i>X {Math.round(point.x * 100)} · Y {Math.round(point.y * 100)}</i><b onClick={event => { event.stopPropagation(); remove(point.id); }} aria-label={`Delete interest point ${index + 1}`}><Trash2 size={11}/></b></button>)}</div>
  </section>;
}