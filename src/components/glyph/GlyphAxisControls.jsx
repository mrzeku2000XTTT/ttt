import React from 'react';
import { RotateCcw } from 'lucide-react';

// Two rows of three axes, the way a 3D viewport works: move slides the artwork
// through space, angle turns the camera on it. Z is depth and roll, so it gets
// the wider range.
const ROWS = [
  {
    key: 'position',
    label: 'move',
    unit: 'px',
    axes: [
      { key: 'x', label: 'X', min: -400, max: 400 },
      { key: 'y', label: 'Y', min: -400, max: 400 },
      { key: 'z', label: 'Z', min: -500, max: 500 },
    ],
  },
  {
    key: 'angle',
    label: 'angle',
    unit: '°',
    axes: [
      { key: 'x', label: 'X', min: -90, max: 90 },
      { key: 'y', label: 'Y', min: -90, max: 90 },
      { key: 'z', label: 'Z', min: -180, max: 180 },
    ],
  },
];

export default function GlyphAxisControls({ position, angle, onPosition, onAngle, onReset }) {
  const values = { position, angle };
  const setters = { position: onPosition, angle: onAngle };

  return (
    <div className="glyph-glass mt-2 flex w-full max-w-[500px] flex-col gap-1.5 rounded-2xl px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="glyph-mono text-[9px] uppercase tracking-[0.18em] glyph-muted">3D pose</span>
        <button
          type="button"
          onClick={onReset}
          className="glyph-pill flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] uppercase tracking-[0.16em]"
          title="Put the artwork back to its starting pose"
        >
          <RotateCcw className="w-3 h-3" />
          reset
        </button>
      </div>

      {ROWS.map((row) => (
        <div key={row.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="glyph-mono w-9 shrink-0 text-[9px] uppercase tracking-[0.14em] glyph-muted">
            {row.label}
          </span>
          {row.axes.map((axis) => (
            <label key={axis.key} className="flex min-w-[112px] flex-1 items-center gap-1.5">
              <span className="glyph-mono w-3 text-[10px] font-semibold" style={{ color: 'var(--g-ink)' }}>
                {axis.label}
              </span>
              <input
                type="range"
                min={axis.min}
                max={axis.max}
                step={1}
                value={Math.round(values[row.key][axis.key])}
                onChange={(e) => setters[row.key]({ [axis.key]: Number(e.target.value) })}
                className="glyph-range flex-1"
                title={`${row.label} ${axis.label}`}
              />
              <span className="glyph-mono w-10 text-right text-[10px] glyph-muted">
                {Math.round(values[row.key][axis.key])}
                {row.unit}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}