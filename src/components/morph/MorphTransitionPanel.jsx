import React, { useMemo, useState } from 'react';
import { Link2, Play, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { EASE_NAMES } from './morphEngine';
import { MATCH_CUT_PRESETS, TRANSITION_TYPES, transitionContext } from './morphTransitions';
import { COMMAND_EXAMPLES } from './transitionCommands';

const sel = 'w-full rounded border border-white/12 bg-black/40 px-1.5 py-1 text-[10px] text-white/80 outline-none focus:border-white/40';

const row = 'flex items-center justify-between gap-2 text-[9px] text-white/40';

/**
 * The match-cut editor. It shows what the matcher found, why, and lets every
 * part of the plan be overruled — pair, mode, preset, timing, camera, mask.
 */
export default function MorphTransitionPanel({
  scene, transitionSel, onSelect, onCreate, onUpdate, onDelete, onReplan, onCommand, onPreview, onDemo,
}) {
  const layers = scene.layers || [];
  const transitions = scene.transitions || [];
  const [command, setCommand] = useState('');
  const [feedback, setFeedback] = useState('');

  const ctx = useMemo(() => transitionContext(scene), [scene]);
  const selected = transitions.find((t) => t.id === transitionSel) || null;
  const nameOf = (id) => layers.find((l) => l.id === id)?.name || '—';

  const applyCommand = () => {
    const text = command.trim();
    if (!text) return;
    const res = onCommand(text);
    setFeedback(res?.message || 'Could not read that.');
    if (res?.ok) setCommand('');
  };

  return (
    <section className="border-b border-white/10 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Match cut</span>
        <button
          onClick={onDemo}
          title="Load the Music → Thriller match cut"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/15 text-[9px] text-white/50 hover:text-white hover:border-white/40 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Music → Thriller
        </button>
      </div>

      {/* natural language */}
      <div className="rounded-lg border border-white/10 p-2 space-y-1.5">
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/35">
          <Wand2 className="w-3 h-3" /> Say what should happen
        </div>
        <div className="flex gap-1">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyCommand()}
            placeholder={COMMAND_EXAMPLES[Math.floor(Date.now() / 60000) % COMMAND_EXAMPLES.length]}
            className="flex-1 rounded border border-white/12 bg-black/40 px-1.5 py-1 text-[10px] text-white/85 outline-none focus:border-white/40 placeholder:text-white/25"
          />
          <button
            onClick={applyCommand}
            disabled={!command.trim()}
            className="rounded bg-white text-black text-[10px] font-bold px-2 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Apply
          </button>
        </div>
        {feedback && <p className="text-[9px] text-white/45">{feedback}</p>}
      </div>

      {/* what the matcher sees */}
      <div className="rounded-lg border border-white/10 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-white/35">
            Candidates · {ctx.ids[0]} → {ctx.ids[1]}
          </span>
          <button
            onClick={() => onCreate({})}
            disabled={!ctx.candidates.length}
            className="text-[9px] px-1.5 py-0.5 rounded border border-white/15 text-white/55 hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
          >
            Best match
          </button>
        </div>
        {ctx.candidates.length === 0 && (
          <p className="text-[9px] text-white/30">Tag layers into two scenes to find matches.</p>
        )}
        {ctx.candidates.slice(0, 4).map((c) => (
          <button
            key={`${c.source}-${c.target}`}
            onClick={() => onCreate({ source: c.source, target: c.target })}
            className="w-full rounded border border-white/10 px-1.5 py-1 text-left hover:border-white/35 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 min-w-0 text-[10px] text-white/70">
                <span className="truncate">{c.sourceAnchor.name}</span>
                <Link2 className="w-2.5 h-2.5 shrink-0 text-white/30" />
                <span className="truncate">{c.targetAnchor.name}</span>
              </span>
              <span className="text-[9px] tabular-nums text-white/45">{Math.round(c.score * 100)}%</span>
            </div>
            <span className="text-[8px] text-white/30">{c.reasons.slice(0, 3).join(' · ')}</span>
          </button>
        ))}
      </div>

      {/* existing transitions */}
      {transitions.map((t) => {
        const on = t.id === transitionSel;
        return (
          <div key={t.id} className={`rounded border px-1.5 py-1 ${on ? 'border-white/35 bg-white/10' : 'border-white/10'}`}>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onSelect(t.id)} className="flex-1 min-w-0 text-left">
                <span className="flex items-center gap-1 text-[10px]">
                  <span className={on ? 'text-white truncate' : 'text-white/60 truncate'}>{nameOf(t.from)}</span>
                  <span className="text-white/30 shrink-0">→</span>
                  <span className={on ? 'text-white truncate' : 'text-white/60 truncate'}>{nameOf(t.to)}</span>
                </span>
                <span className="text-[8px] text-white/30">
                  {TRANSITION_TYPES.find((x) => x.id === t.type)?.label || t.type} · {t.duration.toFixed(2)}s · {Math.round((t.score || 0) * 100)}% match
                  {t.overridden ? ' · by hand' : ''}
                </span>
              </button>
              <button onClick={() => onDelete(t.id)} className="text-white/30 hover:text-red-300" title="Remove">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* editor for the selected transition */}
      {selected && (
        <div className="rounded-lg border border-white/15 bg-white/[0.03] p-2 space-y-2">
          <span className="text-[9px] uppercase tracking-wider text-white/35">Transition</span>

          <div className="grid grid-cols-2 gap-1.5">
            <select value={selected.from} onChange={(e) => onReplan(selected.id, { source: e.target.value })} className={sel}>
              {layers.filter((l) => (l.scene || 'A') === ctx.ids[0]).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <select value={selected.to} onChange={(e) => onReplan(selected.id, { target: e.target.value })} className={sel}>
              {layers.filter((l) => (l.scene || 'A') === ctx.ids[1]).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <label className={row}>
            <span>Style</span>
            <select value={selected.type} onChange={(e) => onReplan(selected.id, { type: e.target.value })} className={`${sel} w-32`}>
              {TRANSITION_TYPES.map((t) => (
                <option key={t.id} value={t.id} title={t.hint}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className={row}>
            <span>Preset</span>
            <select
              value={selected.preset || ''}
              onChange={(e) => onReplan(selected.id, { preset: e.target.value || null, type: null })}
              className={`${sel} w-32`}
            >
              <option value="">Custom</option>
              {MATCH_CUT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>

          <label className={row}>
            <span>Easing</span>
            <select value={selected.easing} onChange={(e) => onUpdate(selected.id, { easing: e.target.value })} className={`${sel} w-32`}>
              {EASE_NAMES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>

          <label className="block text-[9px] text-white/40">
            Duration · {selected.duration.toFixed(2)}s
            <input
              type="range"
              min="0.2"
              max="3"
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
          <label className="block text-[9px] text-white/40">
            Camera zoom · {Number(selected.camera?.scaleTo ?? 1).toFixed(2)}×
            <input
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={selected.camera?.scaleTo ?? 1}
              onChange={(e) => onUpdate(selected.id, { camera: { ...selected.camera, scaleTo: Number(e.target.value) } })}
              className="w-full"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-[9px] text-white/45">
              <input
                type="checkbox"
                checked={selected.camera?.enabled !== false}
                onChange={(e) => onUpdate(selected.id, { camera: { ...selected.camera, enabled: e.target.checked } })}
              />
              Camera
            </label>
            <label className="flex items-center gap-1 text-[9px] text-white/45">
              <input
                type="checkbox"
                checked={selected.mask?.enabled !== false}
                onChange={(e) => onUpdate(selected.id, { mask: { ...selected.mask, enabled: e.target.checked } })}
              />
              Mask reveal
            </label>
            <label className="flex items-center gap-1 text-[9px] text-white/45">
              <input
                type="checkbox"
                checked={selected.hero !== false}
                onChange={(e) => onUpdate(selected.id, { hero: e.target.checked })}
              />
              Hero
            </label>
          </div>

          <button
            onClick={() => onPreview(selected.start)}
            className="w-full flex items-center justify-center gap-1.5 rounded border border-white/20 py-1 text-[10px] text-white/80 hover:border-white/50 hover:text-white transition-colors"
          >
            <Play className="w-3 h-3" /> Play transition
          </button>

          {selected.reasons?.length > 0 && (
            <p className="text-[9px] leading-relaxed text-white/30">
              Matched on {selected.reasons.join(', ')}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}