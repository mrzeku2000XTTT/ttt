import React, { useRef } from 'react';

// Native interactive XYZ position tool — lives in the Inspector.
// Each axis is a vertical slider you drag (mouse or touch). The knob color
// matches the 3D viewport axis (X red, Y green, Z blue). Dragging moves the
// currently selected asset in the 3D rig world. Every clicked asset shows
// its own values, so the tool always edits whichever asset is selected.
function AxisSlider({ axis, color, value, range, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const clamp = (v) => Math.max(-range, Math.min(range, v));
  const update = (clientY) => {
    const r = trackRef.current.getBoundingClientRect();
    const mid = r.top + r.height / 2;
    const norm = Math.max(-1, Math.min(1, (mid - clientY) / (r.height / 2)));
    onChange(axis, clamp(norm * range));
  };
  const onDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    update(e.clientY);
  };
  const onMove = (e) => { if (dragging.current) update(e.clientY); };
  const onUp = (e) => { dragging.current = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} };
  const topPct = (1 - (value / range + 1) / 2) * 100;
  return (
    <div className="cmaxis-axis">
      <span className="cmaxis-label" style={{ color }}>{axis.toUpperCase()}</span>
      <div
        ref={trackRef}
        className="cmaxis-track"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="cmaxis-mid" />
        <div className="cmaxis-knob" style={{ top: `${topPct}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
      <span className="cmaxis-val">{value > 0 ? '+' : ''}{value.toFixed(2)}</span>
    </div>
  );
}

export default function CamAxisTool({ offset, range = 1, targetName, onChange, onReset }) {
  const colors = { x: '#ff6b6b', y: '#69ff69', z: '#69aaff' };
  return (
    <div className="cmaxis">
      <div className="cmaxis-head">
        <span className="cmaxis-target">{targetName || 'No asset selected'}</span>
      </div>
      <div className="cmaxis-row">
        {['x', 'y', 'z'].map((ax) => (
          <AxisSlider key={ax} axis={ax} color={colors[ax]} value={offset?.[ax] || 0} range={range} onChange={onChange} />
        ))}
      </div>
      <button className="cmaxis-reset" onClick={onReset}>Reset</button>
      <span className="cmaxis-hint">Drag an axis — the asset follows</span>
    </div>
  );
}