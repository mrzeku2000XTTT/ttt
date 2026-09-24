import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { SEQUENCES } from './morphSequences';

/**
 * The prebuilt sequence library. Each button writes its keyframes onto the
 * whole scene or just the selected layer — apply several, in any order, and
 * they merge into one animation.
 */
export default function MorphSequences({ onApply, hasSelection }) {
  const [scope, setScope] = useState('all');

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
          <Wand2 className="w-3 h-3" />
          Sequences
        </span>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {tab('all', 'All', false)}
          {tab('layer', 'Layer', !hasSelection)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {SEQUENCES.map((s) => (
          <button
            key={s.name}
            onClick={() => onApply(s.name, scope)}
            title={s.description}
            className="text-left rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 hover:border-white/35 hover:bg-white/[0.07] transition-colors"
          >
            <span className="block text-[10px] font-semibold text-white/85">{s.label}</span>
            <span className="block text-[9px] leading-tight text-white/35">{s.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}