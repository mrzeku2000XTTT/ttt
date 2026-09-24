import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { DEFAULT_DYNAMICS, MOTIONS, overshootFor } from './morphDynamics';

const SLIDERS = [
  { key: 'energy', label: 'Energy', min: 0, max: 100, step: 1, unit: '' },
  { key: 'overshoot', label: 'Overshoot', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'stagger', label: 'Stagger', min: 0, max: 400, step: 5, unit: 'ms' },
  { key: 'randomness', label: 'Randomness', min: 0, max: 40, step: 1, unit: '' },
];

/**
 * Dynamic mode: describe the motion, not the keyframes. Baking writes real
 * tracks, so the result is still fully editable in Advanced mode.
 */
export default function MorphDynamics({ value = DEFAULT_DYNAMICS, onChange, onBake, hasSelection }) {
  const [scope, setScope] = useState('all');
  const set = (patch) => onChange({ ...value, ...patch });

  const tab = (id, label, disabled) => (
    <button
      onClick={() => setScope(id)}
      disabled={disabled}
      className={`px-2 py-0.5 text-[10px] transition-colors disabled:opacity-30 ${
        scope === id ? 'bg-white/20 text-white' : 'text-white/45 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-2.5 space-y-2 border-b border-white/10">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          <Sparkles className="w-3 h-3" />
          Dynamic
        </span>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {tab('all', 'All', false)}
          {tab('layer', 'Layer', !hasSelection)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {MOTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => set({ motion: m.id })}
            title={m.hint}
            className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
              value.motion === m.id ? 'border-white/50 bg-white/[0.09]' : 'border-white/10 bg-white/[0.03] hover:border-white/30'
            }`}
          >
            <span className="block text-[10px] font-semibold text-white/85">{m.label}</span>
            <span className="block text-[9px] leading-tight text-white/35">{m.hint}</span>
          </button>
        ))}
      </div>

      {SLIDERS.map((s) => (
        <label key={s.key} className="block text-[10px] text-white/40">
          <span className="flex items-center justify-between">
            {s.label}
            <span className="tabular-nums text-white/60">{value[s.key]}{s.unit}</span>
          </span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={value[s.key]}
            onChange={(e) => set({ [s.key]: Number(e.target.value) })}
            className="w-full accent-white"
          />
        </label>
      ))}

      <div className="flex items-center justify-between">
        <button
          onClick={() => set({ loop: !value.loop })}
          className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
            value.loop ? 'border-white/50 bg-white/15 text-white' : 'border-white/15 text-white/50 hover:text-white'
          }`}
        >
          Loop {value.loop ? 'on' : 'off'}
        </button>
        <span className="text-[9px] text-white/30">
          spring overshoot ≈ {overshootFor(value.energy, value.overshoot)}%
        </span>
      </div>

      <button
        onClick={() => onBake(scope)}
        className="w-full rounded-lg bg-white text-black text-[11px] font-bold py-1.5 hover:opacity-90 transition-opacity"
      >
        Bake to keyframes
      </button>
      <p className="text-[9px] leading-relaxed text-white/25">
        Bakes real keys with the spring curve — drop into Advanced to fine-tune what it produced.
      </p>
    </div>
  );
}