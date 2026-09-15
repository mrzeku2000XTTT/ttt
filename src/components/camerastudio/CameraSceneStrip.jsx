import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

export default function CameraSceneStrip({ scenes, assets, duration, time, activeSceneId, seek, addScene, moveScene }) {
  const lane = useRef(null);
  const [drag, setDrag] = useState(null);
  const previews = useMemo(() => assets.filter(item => item.file).slice(0, 3).map(item => ({ id: item.id, url: URL.createObjectURL(item.file) })), [assets]);
  useEffect(() => () => previews.forEach(preview => URL.revokeObjectURL(preview.url)), [previews]);
  const laneTime = event => { const rect = lane.current.getBoundingClientRect(); return Math.max(0, Math.min(duration, (event.clientX - rect.left) / rect.width * duration)); };
  const beginDrag = (event, scene, edge) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id: scene.id, edge, time: scene[edge] }); };
  const dragMarker = event => { if (!drag) return; setDrag({ ...drag, time: laneTime(event) }); };
  const endDrag = event => { if (!drag) return; event.stopPropagation(); moveScene(drag.id, drag.edge, drag.time); setDrag(null); };
  const seconds = Array.from({ length: Math.floor(duration) + 1 }, (_, index) => index);
  const ordered = [...(scenes || [])].sort((a, b) => a.start - b.start);
  const edgeAt = (scene, edge) => drag?.id === scene.id && drag.edge === edge ? drag.time : scene[edge];
  return <div className="camera-scene-strip" aria-label="Scene clips">
    <div className="camera-scene-flex">
      <div className="camera-scene-column">
        <div className="camera-scene-ruler">{seconds.map(second => <span className="camera-scene-tick" key={second} style={{ left: `${second / duration * 100}%` }}><em>{second}s</em></span>)}</div>
        <div className="camera-scene-lane" ref={lane}>
          {ordered.map((scene, index) => <div key={scene.id} className={`camera-scene-clip ${scene.id === activeSceneId ? 'is-active' : ''}`} style={{ left: `${edgeAt(scene, 'start') / duration * 100}%`, width: `${(edgeAt(scene, 'end') - edgeAt(scene, 'start')) / duration * 100}%` }} role="button" tabIndex={0} onClick={() => seek(scene.start)} onKeyDown={event => event.key === 'Enter' && seek(scene.start)} title={`${scene.name} · ${scene.start.toFixed(1)}s – ${scene.end.toFixed(1)}s`}>
            <span className="camera-scene-clip-name">{scene.name || `Scene ${index + 1}`}</span>
            <div className="camera-scene-thumbs">{assets.slice(0, 3).map(item => { const preview = previews.find(entry => entry.id === item.id); return preview ? <img key={item.id} src={preview.url} alt=""/> : <span key={item.id}>T</span>; })}</div>
            <button className="camera-scene-marker camera-scene-marker-start" onPointerDown={event => beginDrag(event, scene, 'start')} onPointerMove={dragMarker} onPointerUp={endDrag} aria-label="Scene start" title="Drag to move scene start"/>
            <button className="camera-scene-marker camera-scene-marker-end" onPointerDown={event => beginDrag(event, scene, 'end')} onPointerMove={dragMarker} onPointerUp={endDrag} aria-label="Scene end" title="Drag to move scene end"/>
          </div>)}
          <span className="camera-scene-playhead" style={{ left: `${time / duration * 100}%` }}/>
          <span className="camera-scene-timepill" style={{ left: `${Math.min(94, Math.max(6, time / duration * 100))}%` }}>{time.toFixed(1)}</span>
        </div>
      </div>
      <button className="camera-scene-add" onClick={addScene} title="Add scene" aria-label="Add scene"><Plus size={14}/></button>
    </div>
  </div>;
}