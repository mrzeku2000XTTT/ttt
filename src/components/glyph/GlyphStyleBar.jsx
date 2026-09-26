import React from 'react';
import { PALETTES } from './glyphPalettes';
import { STYLES } from './glyphStyles';

/** Style selector + palette row. Clicking a style re-renders immediately. */
export default function GlyphStyleBar({ params, onStyle, onPalette }) {
  if (!params) return null;
  return (
    <div className="mt-3">
      <div className="glyph-stylebar flex gap-1.5 overflow-x-auto pb-1">
        {STYLES.map((s, i) => {
          const active = params.style === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onStyle(s.id)}
              className={`glyph-btn whitespace-nowrap ${active ? 'glyph-btn-primary' : 'glyph-btn-ghost'}`}
              title={`${s.name} (${i + 1})`}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="glyph-stylebar flex items-center gap-1.5 overflow-x-auto pt-2">
        <span className="glyph-muted text-[10px] uppercase tracking-[0.18em] shrink-0 pr-1">Palette</span>
        {PALETTES.map((p) => {
          const active = params.palette === p.id;
          const swatch = p.colors
            ? p.colors.slice(0, 4).map((c) => `rgb(${c[0]},${c[1]},${c[2]})`)
            : ['#6BCAFF', '#4A90E2', '#2D3436', '#F5F8FB'];
          return (
            <button
              key={p.id}
              onClick={() => onPalette(p.id)}
              className={`shrink-0 flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors ${
                active ? 'text-[#04202f]' : 'glyph-pill'
              }`}
              style={active ? { background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' } : undefined}
              title={p.name}
            >
              <span className="flex">
                {swatch.map((c, i) => (
                  <span
                    key={i}
                    className="w-3 h-3 rounded-full border border-white/70"
                    style={{ background: c, marginLeft: i ? -4 : 0 }}
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