import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { PALETTES, paletteById } from './glyphPalettes';
import { FEATURED, STYLES, styleById } from './glyphLibrary';

// "Original" carries no colours of its own — it keeps the photograph's.
const FALLBACK = ['#6BCAFF', '#4A90E2', '#2D3436', '#F5F8FB'];

/**
 * The render bar: which style is on, a few quick picks, the way into the full
 * library, and one button for every palette. The palettes live behind that one
 * button, so the bar is a single strip and the artwork keeps the room.
 */
export default function GlyphStyleBar({ params, onStyle, onPalettes, onBrowse }) {
  if (!params) return null;
  const active = styleById(params.style);
  const quick = FEATURED.filter((s) => s.id !== active.id).slice(0, 5);
  const palette = paletteById(params.palette);
  const swatch = palette.colors
    ? palette.colors.slice(0, 4).map((c) => `rgb(${c[0]},${c[1]},${c[2]})`)
    : FALLBACK;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1">
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
      <button
        onClick={onPalettes}
        className="glyph-chip flex items-center gap-1.5"
        title={`Every palette — ${PALETTES.length} of them`}
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
        <span>{palette.name}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    </div>
  );
}