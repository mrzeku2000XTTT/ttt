import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { PALETTES } from './glyphPalettes';
import { FEATURED, STYLES, styleById } from './glyphLibrary';

/**
 * The render bar: which style is on, a few quick picks, and the way into the
 * full library. The library itself is a browser, so the bar stays small.
 */
export default function GlyphStyleBar({ params, onStyle, onPalette, onBrowse }) {
  if (!params) return null;
  const active = styleById(params.style);
  const quick = FEATURED.filter((s) => s.id !== active.id).slice(0, 5);

  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={onBrowse}
          className="glyph-chip glyph-chip-on flex items-center gap-1.5"
          title="Browse the style library"
        >
          <span className="text-[12px] leading-none">{active.icon}</span>
          <span>{active.name}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {quick.map((s) => (
          <button
            key={s.id}
            onClick={() => onStyle(s.id)}
            className="glyph-chip flex items-center gap-1"
            title={`${s.name} — ${s.tags}`}
          >
            <span className="text-[11px] leading-none">{s.icon}</span>
            {s.name}
          </button>
        ))}
        <button onClick={onBrowse} className="glyph-chip flex items-center gap-1" title="Every style in the library">
          <Sparkles className="h-3 w-3" />
          All {STYLES.length} styles
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="glyph-muted pr-0.5 text-[9px] uppercase tracking-[0.16em]">Palette</span>
        {PALETTES.map((p) => {
          const isActive = params.palette === p.id;
          const swatch = p.colors
            ? p.colors.slice(0, 4).map((c) => `rgb(${c[0]},${c[1]},${c[2]})`)
            : ['#6BCAFF', '#4A90E2', '#2D3436', '#F5F8FB'];
          return (
            <button
              key={p.id}
              onClick={() => onPalette(p.id)}
              className={`glyph-chip flex items-center gap-1 ${isActive ? 'glyph-chip-on' : ''}`}
              title={p.name}
            >
              <span className="flex">
                {swatch.map((c, si) => (
                  <span
                    key={si}
                    className="h-2 w-2 rounded-full border border-white/60"
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