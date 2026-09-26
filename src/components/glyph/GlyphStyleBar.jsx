import React from 'react';
import { PALETTES } from './glyphPalettes';
import { STYLES } from './glyphStyles';

/** Compact style + palette chip cloud. Clicking a style re-renders immediately. */
export default function GlyphStyleBar({ params, onStyle, onPalette }) {
  if (!params) return null;
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {STYLES.map((s, i) => {
          const active = params.style === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onStyle(s.id)}
              className={`glyph-chip ${active ? 'glyph-chip-on' : ''}`}
              title={`${s.name} (${i + 1})`}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="glyph-muted text-[9px] uppercase tracking-[0.16em] pr-0.5">Palette</span>
        {PALETTES.map((p) => {
          const active = params.palette === p.id;
          const swatch = p.colors
            ? p.colors.slice(0, 4).map((c) => `rgb(${c[0]},${c[1]},${c[2]})`)
            : ['#6BCAFF', '#4A90E2', '#2D3436', '#F5F8FB'];
          return (
            <button
              key={p.id}
              onClick={() => onPalette(p.id)}
              className={`glyph-chip flex items-center gap-1 ${active ? 'glyph-chip-on' : ''}`}
              title={p.name}
            >
              <span className="flex">
                {swatch.map((c, si) => (
                  <span
                    key={si}
                    className="w-2 h-2 rounded-full border border-white/60"
                    style={{ background: c, marginLeft: si ? -3 : 0 }}
                  />
                ))}
              </span>
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}