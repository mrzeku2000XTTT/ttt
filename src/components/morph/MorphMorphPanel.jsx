import React, { useEffect, useState } from 'react';
import { ArrowRight, Link2, Sparkles, Trash2 } from 'lucide-react';
import { EASE_NAMES } from './morphEngine';
import { MOTION_STYLES, UI_MORPHS } from './morphMorphs';
import MorphSequenceControls from './MorphSequenceControls';

const sel = 'w-full rounded border border-white/12 bg-black/40 px-1.5 py-1 text-[10px] text-white/80 outline-none focus:border-white/40';

/**
 * The morph editor. Create a relation between two layers, then shape it: how
 * long it takes, how it eases, how far the arrow curves, how brightly it glows.
 * Everything writes straight into the scene, so both panes update as you type.
 */
export default function MorphMorphPanel({
  scene, morphSel, onSelect, onCreate, onUpdate, onDelete, onApplyPreset, onApplyStyle, onDemo,
  sequenceWord, onBuildSequence,
}) {
  const layers = scene.layers || [];
  const morphs = scene.morphs || [];
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [duration, setDuration] = useState(1.2);
  const [easing, setEasing] = useState('easeInOut');

  // Keep the pickers pointing at layers that still exist.
  useEffect(() => {
    if (fromId && !layers.some((l) => l.id === fromId)) setFromId('');
    if (toId && !layers.some((l) => l.id === toId)) setToId('');
  }, [layers, fromId, toId]);

  const selected = morphs.find((m) => m.id === morphSel) || null;
  const nameOf = (id) => layers.find((l) => l.id === id)?.name || '—';

  return (
    <section className="border-b border-white/10 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Morph</span>
        <button
          onClick={onDemo}
          title="Load the Music → Thriller card morph"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/15 text-[9px] text-white/50 hover:text-white hover:border-white/40 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Music → Thriller
        </button>
      </div>

      {/* create */}
      <div className="rounded-lg border border-white/10 p-2 space-y-1.5">
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/35">
          <Link2 className="w-3 h-3" /> New morph
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={sel}>
            <option value="">Source…</option>
            {layers.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className={sel}>
            <option value="">Target…</option>
            {layers.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 text-[9px] text-white/40">
            Secs
            <input
              type="number"
              min="0.2"
              max="6"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(Math.max(0.2, Number(e.target.value) || 1))}
              className="w-12 rounded border border-white/12 bg-black/40 px-1 py-0.5 text-[10px] text-white/80 outline-none"
            />
          </label>
          <select value={easing} onChange={(e) => setEasing(e.target.value)} className={sel}>
            {EASE_NAMES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            onCreate(fromId, toId, { duration, easing });
            setFromId('');
            setToId('');
          }}
          disabled={!fromId || !toId || fromId === toId}
          className="w-full rounded bg-white text-black text-[10px] font-bold py-1 hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          Create morph
        </button>
      </div>

      <MorphSequenceControls word={sequenceWord} onBuild={onBuildSequence} />

      {/* existing relations */}
      {morphs.length > 0 && (
        <div className="space-y-1">
          {morphs.map((m) => {
            const on = m.id === morphSel;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-1.5 rounded border px-1.5 py-1 ${
                  on ? 'border-white/35 bg-white/10' : 'border-white/10'
                }`}
              >
                <button onClick={() => onSelect(m.id)} className="flex-1 min-w-0 flex items-center gap-1 text-[10px] text-left">
                  <span className={`truncate ${on ? 'text-white' : 'text-white/60'}`}>{nameOf(m.from)}</span>
                  <ArrowRight className="w-2.5 h-2.5 shrink-0 text-white/35" />
                  <span className={`truncate ${on ? 'text-white' : 'text-white/60'}`}>{nameOf(m.to)}</span>
                </button>
                <span className="text-[9px] tabular-nums text-white/30">{m.duration.toFixed(1)}s</span>
                <button onClick={() => onDelete(m.id)} className="text-white/30 hover:text-red-300" title="Remove">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* selected relation */}
      {selected && (
        <div className="rounded-lg border border-white/15 bg-white/[0.03] p-2 space-y-2">
          <span className="text-[9px] uppercase tracking-wider text-white/35">Shape the morph</span>
          <label className="block text-[9px] text-white/40">
            Duration · {selected.duration.toFixed(2)}s
            <input
              type="range"
              min="0.2"
              max="4"
              step="0.05"
              value={selected.duration}
              onChange={(e) => onUpdate(selected.id, { duration: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <label className="block text-[9px] text-white/40">
            Start · {selected.start.toFixed(2)}s
            <input
              type="range"
              min="0"
              max={Math.max(0.5, (scene.duration || 3) - selected.duration)}
              step="0.05"
              value={selected.start}
              onChange={(e) => onUpdate(selected.id, { start: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={selected.easing}
              onChange={(e) => onUpdate(selected.id, { easing: e.target.value })}
              className={sel}
            >
              {EASE_NAMES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-[9px] text-white/40">
              <input
                type="checkbox"
                checked={selected.arrow !== false}
                onChange={(e) => onUpdate(selected.id, { arrow: e.target.checked })}
              />
              Arrow
            </label>
          </div>
          <label className="block text-[9px] text-white/40">
            Curve · {Number(selected.curve ?? 0.35).toFixed(2)}
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={selected.curve ?? 0.35}
              onChange={(e) => onUpdate(selected.id, { curve: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <label className="block text-[9px] text-white/40">
            Glow · {Number(selected.glow ?? 0.8).toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selected.glow ?? 0.8}
              onChange={(e) => onUpdate(selected.id, { glow: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/40">Light</span>
            <input
              type="color"
              value={selected.glowColor || '#7DDCFF'}
              onChange={(e) => onUpdate(selected.id, { glowColor: e.target.value })}
              className="h-5 w-8 rounded border border-white/15 bg-transparent"
            />
          </div>

          <div>
            <span className="text-[9px] text-white/35">Motion style</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {MOTION_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onApplyStyle(selected.id, s.id)}
                  title={`${s.duration}s · ${s.easing}`}
                  className={`px-1.5 py-0.5 rounded border text-[9px] transition-colors ${
                    selected.easing === s.easing && Math.abs(selected.duration - s.duration) < 0.01
                      ? 'border-white bg-white text-black'
                      : 'border-white/15 text-white/50 hover:text-white hover:border-white/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* presets */}
      <div>
        <span className="text-[9px] uppercase tracking-wider text-white/35">UI morph presets</span>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {UI_MORPHS.map((p) => (
            <button
              key={p.id}
              onClick={() => onApplyPreset(p.id)}
              className="rounded border border-white/10 px-1.5 py-1 text-[9px] text-left text-white/55 hover:text-white hover:border-white/35 transition-colors truncate"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}