import React from 'react';
import { RotateCcw } from 'lucide-react';

// X and Y slide the artwork, Z pushes it toward or away from the viewer, so the
// card can be placed exactly where it belongs instead of only dragged around.
const AXES = [
  { key: 'x', label: 'X', min: -400, max: 400 },
  { key: 'y', label: 'Y', min: -400, max: 400 },
  { key: 'z', label: 'Z', min: -500, max: 500 },
];

export default function GlyphAxisControls({ value, onChange, onReset }) {
  return (
    <div className="glyph-glass mt-2 flex w-full max-w-[470px] flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-2">
      {AXES.map((axis) => (
        <label key={axis.key} className="flex min-w-[118px] flex-1 items-center gap-2">
          <span className="glyph-mono w-3 text-[10px] font-semibold" style={{ color: 'var(--g-ink)' }}>
            {axis.label}
          </span>
          <input
            type="range"
            min={axis.min}
            max={axis.max}
            step={1}
            value={Math.round(value[axis.key])}
            onChange={(e) => onChange({ [axis.key]: Number(e.target.value) })}
            className="glyph-range flex-1"
            title={`Move the artwork along ${axis.label}`}
          />
          <span className="glyph-mono w-9 text-right text-[10px] glyph-muted">{Math.round(value[axis.key])}</span>
        </label>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="glyph-pill flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] uppercase tracking-[0.16em]"
        title="Put the artwork back in the middle"
      >
        <RotateCcw className="w-3 h-3" />
        reset
      </button>
    </div>
  );
}