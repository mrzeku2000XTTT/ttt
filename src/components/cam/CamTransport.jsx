import React from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';

export default function CamTransport({ playing, canPlay, onPlay, onRestart, barRef, zoom, setZoom, label }) {
  return (
    <div className="cm-transport">
      <div className="cm-ruler">{Array.from({ length: 13 }, (_, i) => <span key={i}>{i * 10}</span>)}</div>
      <div className="cm-progress"><i ref={barRef} /></div>
      <div className="cm-transport-row"><small>0.0</small><div><button onClick={onRestart}><SkipBack /></button><button onClick={onRestart}><RotateCcw /></button><button onClick={onPlay} disabled={!canPlay}>{playing ? <Pause /> : <Play />}</button><button onClick={onRestart}><SkipForward /></button></div><small>{label}</small></div>
      <div className="cm-toolstrip"><button onClick={() => setZoom((v) => Math.max(.4, v - .05))}><ZoomOut /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((v) => Math.min(1.5, v + .05))}><ZoomIn /></button><i />Select · Transform · Camera · Light · Renderer</div>
    </div>
  );
}