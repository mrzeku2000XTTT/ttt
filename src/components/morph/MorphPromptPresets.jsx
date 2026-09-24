import React from 'react';
import { Wand2 } from 'lucide-react';

/**
 * Ready-made briefs for the composer. Picking one writes it straight into the
 * chat box so it can be read and edited before sending — nothing is submitted
 * on its own.
 */
export const MORPH_PROMPTS = [
  {
    label: 'Shape Morph Any',
    prompt: 'Shape Morph Any — take the starting shapes and morph them point-for-point into the logo: resample each shape\'s outline into an even set of points and blend every point straight to its matching point on the logo, pairing shapes left to right by their horizontal position. Move, never cross-fade, so each outline stays continuous the whole way, and land the logo on a subtle spring settle.',
  },
];

/** The toolbar button that opens the preset list. */
export default function MorphPromptPresets({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title="Prompt presets"
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
        open ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'
      }`}
    >
      <Wand2 className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Prompts</span>
    </button>
  );
}

/** The list itself, shown inside the composer. */
export function MorphPromptList({ onPick }) {
  return (
    <div className="mx-2 mb-1 max-h-56 overflow-y-auto scrollbar-hide rounded-xl border border-white/12 bg-white/[0.04] p-1.5">
      <p className="px-1.5 py-1 text-[9px] uppercase tracking-[0.14em] text-white/30">Prompt preset</p>
      {MORPH_PROMPTS.map((p) => (
        <button
          key={p.label}
          onClick={() => onPick(p.prompt)}
          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <span className="block text-[11px] text-white/85">{p.label}</span>
          <span className="block text-[10px] text-white/35 truncate">{p.prompt}</span>
        </button>
      ))}
    </div>
  );
}