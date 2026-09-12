import React from 'react';
import { Circle, Square, Play, Pause, Plus, Scissors, Trash2, ZoomIn, ZoomOut, SkipBack, SkipForward } from 'lucide-react';

export default function CamTimelineToolbar({ timeline: t, zoom, setZoom, onAddMedia, hasMedia }) {
  const clips = [...t.project.cuts, ...t.project.tracks.flatMap((track) => track.clips)];
  const selected = clips.find((c) => c.id === t.selected);
  const stops = [...new Set([0, ...t.project.cuts.map((c) => c.start), t.total])].sort((a, b) => a - b);
  return <>
    <div className="cm-tl-tools">
      <button className={t.recording ? 'is-active' : ''} onClick={t.record} disabled={!hasMedia} title="Record asset and camera changes as keyframes">{t.recording ? <Square /> : <Circle />}{t.recording ? 'Stop recording' : 'Record'}</button>
      <button onClick={() => t.seek([...stops].reverse().find((s) => s < t.time - 0.01) ?? 0)} disabled={t.recording} title="Previous cut"><SkipBack /></button>
      <button onClick={t.play} disabled={!t.total || t.recording} title="Play timeline">{t.running ? <Pause /> : <Play />}</button>
      <button onClick={() => t.seek(stops.find((s) => s > t.time + 0.01) ?? t.total)} disabled={t.recording} title="Next cut"><SkipForward /></button>
      <button onClick={() => { t.add(t.total); t.seek(t.total); }} disabled={!hasMedia || t.recording}><Plus />Scene</button>
      <button onClick={onAddMedia} disabled={t.recording}><Plus />Layer</button>
      <button onClick={t.split} disabled={t.recording || !t.total} title="Split all clips at playhead"><Scissors /></button>
      <button onClick={() => { t.remove(t.selected); t.setSelected(null); }} disabled={!selected || t.recording} title="Delete selected clip"><Trash2 /></button>
      <span className="cm-tl-clock">{t.time.toFixed(2)} / {t.total.toFixed(2)}s</span>
      <button onClick={() => setZoom(Math.max(12, zoom / 1.25))} title="Zoom timeline out"><ZoomOut /></button>
      <button onClick={() => setZoom(Math.min(240, zoom * 1.25))} title="Zoom timeline in"><ZoomIn /></button>
    </div>
    <div className="cm-tl-properties">{selected ? <><span>Selected clip</span><label>Start <input type="number" min="0" step="0.1" value={Number(selected.start.toFixed(2))} disabled={t.recording} onChange={(e) => t.update(selected.id, { start: Math.max(0, Number(e.target.value)) })} /></label><label>Duration <input type="number" min="0.1" step="0.1" value={Number(selected.duration.toFixed(2))} disabled={t.recording} onChange={(e) => t.update(selected.id, { duration: Math.max(0.1, Number(e.target.value)) })} /></label><span>{selected.keys.length} keyframes</span></> : <span>{t.recording ? 'Recording — drag asset axes or adjust camera controls.' : 'Click a clip to preview · drag to move · scrub the ruler · Record captures your movements.'}</span>}</div>
  </>;
}