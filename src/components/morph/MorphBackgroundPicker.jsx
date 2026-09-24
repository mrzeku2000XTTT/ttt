import React from 'react';
import { Palette, Ban } from 'lucide-react';
import {
  GRADIENT_PRESETS,
  GRADIENT_TYPES,
  backgroundPreset,
  backgroundStyle,
  makeBackground,
} from './morphBackground';

/**
 * The toolbar button that opens the gradient list — same shape as the prompt
 * presets button beside it.
 */
export default function MorphBackgroundPicker({ open, onToggle, active }) {
  return (
    <button
      onClick={onToggle}
      title="Background gradients"
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
        open ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'
      }`}
    >
      <Palette className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Gradient</span>
      {active && !open && (
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/30"
          style={{ backgroundImage: backgroundStyle(active) }}
        />
      )}
    </button>
  );
}

/** The list itself, shown inside the composer. */
export function MorphBackgroundPanel({ background, onApply }) {
  const current = background?.type ? makeBackground(background) : null;
  const activeId = current?.preset && backgroundPreset(current.preset)?.type === current.type ? current.preset : null;

  // Switching the type keeps the colours you already have; with nothing set yet
  // it seeds from the first preset of that type so the change is always visible.
  const setType = (type) => {
    if (current) {
      onApply(makeBackground({ ...current, type }));
      return;
    }
    const seed = GRADIENT_PRESETS.find((p) => p.type === type) || GRADIENT_PRESETS[0];
    onApply(makeBackground({ ...seed, type }));
  };

  return (
    <div className="mx-2 mb-1 rounded-xl border border-white/12 bg-white/[0.04] p-2">
      <div className="flex items-center justify-between gap-2 px-0.5 pb-1.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Background gradient</p>
        <button
          onClick={() => onApply(null)}
          disabled={!current}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-white/45 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Ban className="w-3 h-3" />
          None
        </button>
      </div>

      <div className="flex items-center gap-1 pb-2">
        {GRADIENT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-colors ${
              current?.type === t.id ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {GRADIENT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onApply(makeBackground(p))}
            title={`${p.label} · ${p.type}`}
            className={`group rounded-lg overflow-hidden border transition-colors text-left ${
              activeId === p.id ? 'border-white/70' : 'border-white/12 hover:border-white/35'
            }`}
          >
            <span className="block h-9 w-full" style={{ backgroundImage: backgroundStyle(p) }} />
            <span className="block px-1.5 py-1 text-[10px] truncate text-white/70 group-hover:text-white">
              {p.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}