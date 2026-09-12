import React from 'react';
import { MOVES } from './camMoves';

export default function CamInspector({ moveId, setMoveId, setMode, intensity, setIntensity, duration, setDuration }) {
  return (
    <aside id="cam-inspector" className="cm-inspector"><div className="cm-panel-heading"><strong>Inspector</strong><span>Camera3D1</span></div>
      <details open><summary>Camera Moves</summary><div className="cm-inspector-grid">{MOVES.map((move) => <button key={move.id} className={move.id === moveId ? 'active' : ''} onClick={() => { setMoveId(move.id); setMode('move'); }}><b>{move.label}</b><span>{move.feel}</span></button>)}</div></details>
      <details open><summary>Transform</summary><label><span>Intensity</span><b>{Math.round(intensity * 100)}%</b></label><input type="range" min=".1" max="1" step=".05" value={intensity} onChange={(e) => setIntensity(+e.target.value)} /><label><span>Duration</span><b>{duration}s</b></label><input type="range" min="1" max="10" step=".5" value={duration} onChange={(e) => setDuration(+e.target.value)} /></details>
      {['Visibility', 'Lighting', 'Material', 'Blending', 'Normals', 'Object ID'].map((name) => <details key={name}><summary>{name}</summary></details>)}
    </aside>
  );
}