import React from 'react';
import { Wand2 } from 'lucide-react';

/**
 * Ready-made briefs for the composer. Picking one writes it straight into the
 * chat box so it can be read and edited before sending — nothing is submitted
 * on its own.
 */
export const MORPH_PROMPTS = [
  {
    label: 'Shape → Text → Logo',
    prompt: 'Morph the circle into the word TTT, then resolve it into the logo and let it land on a subtle spring.',
  },
  {
    label: 'Text → Logo',
    prompt: 'Take the word KASPA and turn it into the logo with a premium, satisfying bounce.',
  },
  {
    label: 'Button → Card',
    prompt: 'Turn the music button into a thriller card with a clean UI morph and a soft glow.',
  },
  {
    label: 'Staggered entrance',
    prompt: 'Stagger every layer in from below with a soft spring and keep the whole thing premium and calm.',
  },
  {
    label: 'Logo reveal',
    prompt: 'Reveal the logo one letter at a time, then settle it into place.',
  },
  {
    label: 'Match cut',
    prompt: 'Add a match cut between the two scenes, matching the card edges.',
  },
  {
    label: 'Camera push',
    prompt: 'Push the camera slowly into the title and fade the background out.',
  },
  {
    label: 'Seamless loop',
    prompt: 'Make the whole thing loop seamlessly with a gentle breathing motion.',
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
      <p className="px-1.5 py-1 text-[9px] uppercase tracking-[0.14em] text-white/30">Prompt presets</p>
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