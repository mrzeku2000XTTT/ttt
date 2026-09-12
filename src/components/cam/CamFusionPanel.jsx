import React from 'react';
import { Layers, Loader2, MousePointer2, RotateCcw, Sparkles } from 'lucide-react';

const KIND_LABEL = { text: 'Text', crop: 'Artwork', bg: 'Backdrop', shape: 'Shape' };

export default function CamFusionPanel({ hasImage, busy, elapsed, error, layers, selectedId, onSelect, onDecompose, onPos, onReset }) {
  const sel = layers.find((l) => l.id === selectedId);
  return (
    <aside className="cm-inspector">
      <div className="cm-panel-heading"><strong>Fusion</strong><span>{layers.length} layers</span></div>
      <div>
        <button onClick={onDecompose} disabled={!hasImage || busy} className="cm-fus-decompose">
          {busy ? <><Loader2 className="animate-spin" /> Exploding… {elapsed}s</> : <><Sparkles /> Explode into 3D layers</>}
        </button>
        {!hasImage && <p className="cm-fus-hint">Upload an image first — Media Pool in the header.</p>}
        {error && <p className="cm-fus-error">{error}</p>}
      </div>
      <div className="cm-fus-list">
        {layers.map((l, i) => (
          <button key={l.id} className={l.id === selectedId ? 'active' : ''} onClick={() => onSelect(l.id)}>
            <i>{String(i + 1).padStart(2, '0')}</i><Layers />
            <span>{l.kind === 'text' ? (l.text || '').slice(0, 18) : KIND_LABEL[l.kind]}</span>
          </button>
        ))}
        {!layers.length && !busy && <p className="cm-fus-hint">No layers yet — exploding pulls the image's text and assets apart so each becomes an individual 3D object.</p>}
      </div>
      {sel && (
        <div className="cm-fus-transform">
          <p className="cm-fus-transform-title"><MousePointer2 /> Transform — {KIND_LABEL[sel.kind] || sel.kind}</p>
          {[['x', 'X'], ['y', 'Y'], ['z', 'Z']].map(([axis, label]) => (
            <label key={axis} className={`cm-fus-axis cm-fus-${axis}`}>
              <b>{label}</b>
              <input type="number" step="0.01" value={sel.pos[axis]} onChange={(e) => onPos(sel.id, axis, parseFloat(e.target.value) || 0)} />
            </label>
          ))}
          <button onClick={() => onReset(sel.id)}><RotateCcw /> Reset position</button>
          <p className="cm-fus-hint">Or grab the red / green / blue arrows in the viewer.</p>
        </div>
      )}
    </aside>
  );
}