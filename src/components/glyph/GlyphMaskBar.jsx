import React from 'react';
import { Check, Eraser, Trash2 } from 'lucide-react';

/** The paint tool's own little bar: brush size, erase, clear, done. */
export default function GlyphMaskBar({ brush, onBrush, erase, onErase, hasMask, onClear, onDone }) {
  return (
    <div
      className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-2.5 py-2"
      style={{ border: '1px solid var(--g-line)', background: 'rgba(107,202,255,0.05)' }}
    >
      <span className="glyph-word text-[10px] glyph-accent-text">Paint mask</span>
      <span className="glyph-muted text-[10px] uppercase tracking-[0.16em]">drag on the artwork</span>

      <label className="flex items-center gap-2">
        <span className="glyph-muted text-[9px] uppercase tracking-[0.16em]">Brush</span>
        <input
          type="range"
          min="2"
          max="30"
          value={brush}
          onChange={(e) => onBrush(Number(e.target.value))}
          className="glyph-range w-24"
        />
      </label>

      <button onClick={() => onErase(!erase)} className={`glyph-chip flex items-center gap-1 ${erase ? 'glyph-chip-on' : ''}`}>
        <Eraser className="w-3 h-3" />
        Erase
      </button>
      <button
        onClick={onClear}
        disabled={!hasMask}
        className="glyph-chip flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3 h-3" />
        Clear
      </button>
      <button onClick={onDone} className="glyph-chip flex items-center gap-1">
        <Check className="w-3 h-3" />
        Done
      </button>
    </div>
  );
}