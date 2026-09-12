import React from 'react';
import { Film, Layers, Camera as CameraIcon, Plus, MousePointerClick, Sliders } from 'lucide-react';
import { MOVES } from './camMoves';

export default function CamInspector({
  moveId, onMovePick, autoKey, setAutoKey,
  intensity, setIntensity, duration, setDuration,
  camRig, setCamRig,
  media, onAddMedia, onSelectAsset, refId,
}) {
  const pick = (id) => onMovePick?.(id);
  return (
    <aside id="cam-inspector" className="cm-inspector">
      <div className="cm-panel-heading"><strong>Inspector</strong><span>Camera3D1</span></div>

      <details open>
        <summary><Film size={11} /> Camera Moves</summary>
        <label className="cm-autokey">
          <input type="checkbox" checked={!!autoKey} onChange={(e) => setAutoKey?.(e.target.checked)} />
          <span>Auto Keyframe — each click appends a shot + node</span>
        </label>
        <div className="cm-inspector-grid">
          {MOVES.map((move) => (
            <button key={move.id} className={move.id === moveId ? 'active' : ''} onClick={() => pick(move.id)}>
              <b>{move.label}</b><span>{move.feel}</span>
            </button>
          ))}
        </div>
      </details>

      <details open>
        <summary><Sliders size={11} /> Transform</summary>
        <label><span>Intensity</span><b>{Math.round(intensity * 100)}%</b></label>
        <input type="range" min=".1" max="1" step=".05" value={intensity} onChange={(e) => setIntensity(+e.target.value)} />
        <label><span>Duration</span><b>{duration}s</b></label>
        <input type="range" min="1" max="10" step=".5" value={duration} onChange={(e) => setDuration(+e.target.value)} />
      </details>

      <details open>
        <summary><CameraIcon size={11} /> Camera Rig</summary>
        <label><span>FOV</span><b>{camRig?.fov ?? 48}°</b></label>
        <input type="range" min="20" max="80" step="1" value={camRig?.fov ?? 48} onChange={(e) => setCamRig?.({ ...camRig, fov: +e.target.value })} />
        <label><span>Distance</span><b>{(camRig?.distance ?? 4.2).toFixed(1)}</b></label>
        <input type="range" min="2.5" max="8" step="0.1" value={camRig?.distance ?? 4.2} onChange={(e) => setCamRig?.({ ...camRig, distance: +e.target.value })} />
        <label><span>Roll offset</span><b>{camRig?.roll ?? 0}°</b></label>
        <input type="range" min="-30" max="30" step="1" value={camRig?.roll ?? 0} onChange={(e) => setCamRig?.({ ...camRig, roll: +e.target.value })} />
        <label className="cm-autokey"><input type="checkbox" checked={!!camRig?.autoOrbit} onChange={(e) => setCamRig?.({ ...camRig, autoOrbit: e.target.checked })} /><span>Auto-orbit the rig</span></label>
      </details>

      <details open>
        <summary><Layers size={11} /> Media <span className="cm-insp-count">{media?.length || 0}</span></summary>
        <button className="cm-add-media" onClick={onAddMedia}><Plus size={12} /> Add image media to the rig</button>
        <div className="cm-media-list">
          {media?.map((m) => (
            <button key={m.id} className={`cm-media-item ${refId === m.id ? 'is-ref' : ''}`} onClick={() => onSelectAsset?.(m.id)}>
              <img src={m.url} alt={m.name} />
              <span>{m.name}</span>
              {refId === m.id && <MousePointerClick size={12} />}
            </button>
          ))}
          {!media?.length && <span className="cm-media-empty">Upload an image to begin, then add more assets here.</span>}
        </div>
      </details>

      {['Visibility', 'Lighting', 'Material', 'Blending', 'Normals', 'Object ID'].map((name) => <details key={name}><summary>{name}</summary></details>)}
    </aside>
  );
}