import React from 'react';
import { Check, X } from 'lucide-react';
import { PALETTES } from './glyphPalettes';

// "Original" carries no colours of its own — it keeps the photograph's.
const FALLBACK = ['#6BCAFF', '#4A90E2', '#2D3436', '#F5F8FB'];

/**
 * Every palette in one place. The bar carries a single button into here, so the
 * artwork keeps the room a wall of colour chips would have taken.
 */
export default function GlyphPalettePicker({ current, onPick, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[85] flex flex-col"
      style={{ background: 'rgba(4,7,12,0.95)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center gap-2 px-3 sm:px-5 py-3" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <span className="glyph-word glyph-accent-text text-xs">Palettes</span>
        <span className="glyph-muted text-[10px]">{PALETTES.length} to choose from · tap one</span>
        <button onClick={onClose} className="glyph-pill ml-auto flex h-8 w-8 items-center justify-center rounded-full" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-5 py-3 pb-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {PALETTES.map((p) => {
            const active = current === p.id;
            const swatch = p.colors ? p.colors.slice(0, 5).map((c) => `rgb(${c[0]},${c[1]},${c[2]})`) : FALLBACK;
            return (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                className={`glyph-tile flex flex-col gap-2 rounded-xl p-2 text-left ${active ? 'glyph-tile-on' : ''}`}
                title={p.name}
              >
                <span className="flex h-6 overflow-hidden rounded-md">
                  {swatch.map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold" style={{ color: active ? 'var(--g-accent-2)' : 'var(--g-ink)' }}>
                    {p.name}
                  </span>
                  {active && <Check className="h-3 w-3" style={{ color: 'var(--g-accent-2)' }} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}