import React from 'react';
import { Circle, Square, Play, Pause, Plus, Scissors, Trash2, ZoomIn, ZoomOut, SkipBack, SkipForward, Copy, Slice } from 'lucide-react';
import CamTimelineSelection from '@/components/cam/CamTimelineSelection';

export default function CamTimelineToolbar({ timeline: t, zoom, setZoom, onAddMedia, hasMedia, onFit }) {
  const clips = [...t.project.cuts, ...t.project.tracks.flatMap((track) => track.clips)];
  const selected = clips.find((c) => c.id === t.selected);
  const sceneIndex=t.project.cuts.findIndex((c)=>c.id===t.selected), track=t.project.tracks.find((r)=>r.clips.some((c)=>c.id===t.selected));
  const selection=selected?{clip:selected,kind:sceneIndex>=0?'SCENE':'LAYER',label:sceneIndex>=0?`Scene ${sceneIndex+1}`:track?.name||'Layer'}:null;
  const canCut=selected && t.time > selected.start+.01 && t.time < selected.start+selected.duration-.01;
  const stops = [...new Set([0, ...t.project.cuts.map((c) => c.start), t.total])].sort((a, b) => a - b);
  return <>
    <div className="cm-tl-tools">
      <button className={t.recording ? 'is-active' : ''} onClick={t.record} disabled={!hasMedia} title="Record asset and camera changes as keyframes">{t.recording ? <Square /> : <Circle />}{t.recording ? 'Stop recording' : 'Record'}</button>
      <button onClick={() => t.seek([...stops].reverse().find((s) => s < t.time - 0.01) ?? 0)} disabled={t.recording} title="Previous cut"><SkipBack /></button>
      <button onClick={t.play} disabled={!t.total || t.recording} title="Play timeline">{t.running ? <Pause /> : <Play />}</button>
      <button onClick={() => t.seek(stops.find((s) => s > t.time + 0.01) ?? t.total)} disabled={t.recording} title="Next cut"><SkipForward /></button>
      <button onClick={() => { t.add(t.total); t.seek(t.total); }} disabled={!hasMedia || t.recording}><Plus />Scene</button>
      <button onClick={onAddMedia} disabled={t.recording}><Plus />Layer</button>
      <span className="cm-tl-divider" />
      <button onClick={() => t.splitSelected(t.selected)} disabled={t.recording || !canCut} title="Cut selected scene or layer at playhead (Ctrl/Cmd+Shift+D)"><Scissors />Cut</button>
      <button onClick={t.split} disabled={t.recording || !t.total} title="Split every layer at the playhead"><Slice />Split All</button>
      <button onClick={() => t.duplicate(t.selected)} disabled={!selected || t.recording} title="Duplicate selected scene or layer (Ctrl/Cmd+D)"><Copy />Duplicate</button>
      <button onClick={() => { t.remove(t.selected); t.setSelected(null); }} disabled={!selected || t.recording} title="Delete selected scene or layer"><Trash2 /></button>
      <span className="cm-tl-clock">{t.time.toFixed(2)} / {t.total.toFixed(2)}s</span>
      <button onClick={() => setZoom(Math.max(12, zoom / 1.25))} title="Zoom timeline out"><ZoomOut /></button>
      <button onClick={() => setZoom(Math.min(240, zoom * 1.25))} title="Zoom timeline in"><ZoomIn /></button>
      <button onClick={onFit} title="Fit the complete edit in view">Fit</button>
    </div>
    <div className="cm-tl-properties"><CamTimelineSelection item={selection} timeline={t}/><span className="cm-tl-help">Space play · ⌘D duplicate · ⌘⇧D cut · Delete remove</span></div>
  </>;
}