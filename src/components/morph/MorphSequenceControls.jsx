import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { SHAPE_NAMES } from './morphEngine';
import { MOTION_STYLES } from './morphMorphs';
import { BOUNCE_PROFILES, SPRING_PRESETS, SEQUENCE_DEFAULTS, SEQUENCE_WORD } from './morphSequence';

const field = 'w-full rounded border border-white/12 bg-black/40 px-1 py-0.5 text-[10px] text-white/80 outline-none focus:border-white/40';
const cap = 'text-[9px] text-white/40';

/**
 * The shape → text → logo controls. A sequence is a plan, so the controls
 * describe the plan — how it starts, how the letters arrive, how long each step
 * takes and how hard the logo lands — and then build it in one go.
 */
export default function MorphSequenceControls({ word, onBuild }) {
  const [o, setO] = useState({ ...SEQUENCE_DEFAULTS, style: '', spring: 'satisfying' });
  const set = (patch) => setO((v) => ({ ...v, ...patch }));

  const pickStyle = (id) => {
    const s = MOTION_STYLES.find((x) => x.id === id);
    set(s ? { style: id, easing: s.easing, morphDuration: s.duration } : { style: id });
  };
  const pickSpring = (id) => {
    const p = SPRING_PRESETS.find((x) => x.id === id);
    if (p) set({ spring: p.id, stiffness: p.stiffness, damping: p.damping });
  };

  const shown = (word || '').trim() || SEQUENCE_WORD;

  return (
    <div className="rounded-lg border border-white/10 p-2 space-y-1.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/35">
        <Wand2 className="w-3 h-3" /> Shape → Text → Logo
      </div>
      <p className="text-[9px] leading-relaxed text-white/30">
        A shape deforms, the letters arrive one at a time, the word resolves into the logo, and the
        logo lands with a spring. Reveals “{shown}”.
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        <label className={cap}>
          Shape
          <select value={o.shape} onChange={(e) => set({ shape: e.target.value })} className={field}>
            {SHAPE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className={cap}>
          Morph style
          <select value={o.style} onChange={(e) => pickStyle(e.target.value)} className={field}>
            <option value="">Spring settle</option>
            {MOTION_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <label className={cap}>
          Glyph ms
          <input
            type="number" min="0" max="240" step="10" value={o.glyphStagger}
            onChange={(e) => set({ glyphStagger: Number(e.target.value) })} className={field}
          />
        </label>
        <label className={cap}>
          Morph s
          <input
            type="number" min="0.3" max="3" step="0.1" value={o.morphDuration}
            onChange={(e) => set({ morphDuration: Number(e.target.value) })} className={field}
          />
        </label>
        <label className={cap}>
          Settle s
          <input
            type="number" min="0.12" max="1.2" step="0.02" value={o.settleDuration}
            onChange={(e) => set({ settleDuration: Number(e.target.value) })} className={field}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <label className={cap}>
          Bounce
          <select value={o.bounce} onChange={(e) => set({ bounce: e.target.value })} className={field}>
            {Object.entries(BOUNCE_PROFILES).map(([id, p]) => (
              <option key={id} value={id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className={cap}>
          Overshoot %
          <input
            type="number" min="0" max="20" step="0.5" value={o.overshoot}
            onChange={(e) => set({ overshoot: Number(e.target.value) })} className={field}
            placeholder="auto"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <label className={cap}>
          Spring
          <select value={o.spring} onChange={(e) => pickSpring(e.target.value)} className={field}>
            {SPRING_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className={cap}>
          Stiff
          <input
            type="number" min="20" max="600" step="10" value={o.stiffness}
            onChange={(e) => set({ stiffness: Number(e.target.value), spring: '' })} className={field}
          />
        </label>
        <label className={cap}>
          Damp
          <input
            type="number" min="4" max="60" step="1" value={o.damping}
            onChange={(e) => set({ damping: Number(e.target.value), spring: '' })} className={field}
          />
        </label>
      </div>

      <button
        onClick={() => onBuild(o)}
        className="w-full rounded bg-white text-black text-[10px] font-bold py-1 hover:opacity-90 transition-opacity"
      >
        Build the sequence
      </button>
    </div>
  );
}