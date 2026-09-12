import React, { useRef } from 'react';

// Touch + mouse draggable XYZ gizmo — each axis is a vertical slider.
// Dragging an axis moves the background image asset in the 3D rig world.
// Pointer Events are used so the same code path handles finger and mouse.
function AxisSlider({ axis, color, value, onChange }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const update = (clientY) => {
    const r = trackRef.current.getBoundingClientRect();
    const mid = r.top + r.height / 2;
    const v = Math.max(-1, Math.min(1, (mid - clientY) / (r.height / 2)));
    onChange(axis, v);
  };
  const onDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    update(e.clientY);
  };
  const onMove = (e) => { if (dragging.current) update(e.clientY); };
  const onUp = (e) => {
    dragging.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const topPct = (1 - (value + 1) / 2) * 100;
  return (
    <div className="cmxyz-axis">
      <span className="cmxyz-label" style={{ color }}>{axis.toUpperCase()}</span>
      <div
        ref={trackRef}
        className="cmxyz-track"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="cmxyz-mid" />
        <div className="cmxyz-knob" style={{ top: `${topPct}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
      <span className="cmxyz-val">{value > 0 ? '+' : ''}{value.toFixed(2)}</span>
    </div>
  );
}

export default function CamXYZGizmo({ offset, onChange, onReset }) {
  const colors = { x: '#ff5f56', y: '#8dff6a', z: '#4d9fff' };
  return (
    <div className="cmxyz">
      <div className="cmxyz-row">
        {['x', 'y', 'z'].map((ax) => (
          <AxisSlider key={ax} axis={ax} color={colors[ax]} value={offset?.[ax] || 0} onChange={onChange} />
        ))}
      </div>
      <button className="cmxyz-reset" onClick={onReset}>Reset</button>
      <span className="cmxyz-hint">Drag an axis — the background follows</span>
    </div>
  );
}