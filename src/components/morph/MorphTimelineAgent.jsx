import React from 'react';
import { Sparkles } from 'lucide-react';
import { EASES } from './morphEngine';
import { MOTIONS } from './morphDynamics';

const PROP_LABEL = {
  x: 'Position X',
  y: 'Position Y',
  scale: 'Scale',
  rotation: 'Rotation',
  opacity: 'Opacity',
  glow: 'Glow',
  morph: 'Path',
};

const EASE_LABEL = {
  linear: 'linear',
  easeIn: 'ease in',
  easeOut: 'ease out',
  easeInOut: 'ease in-out',
  backOut: 'back out',
  spring: 'spring',
  bounce: 'bounce',
  elastic: 'elastic',
  hold: 'hold',
};

const summary = (layer) => Object.entries(layer.tracks || {})
  .filter(([, list]) => list?.length)
  .map(([prop, list]) => {
    const eases = {};
    list.forEach((k) => { eases[k.ease] = (eases[k.ease] || 0) + 1; });
    const dominant = Object.entries(eases).sort((a, b) => b[1] - a[1])[0]?.[0] || 'easeInOut';
    return {
      prop,
      label: PROP_LABEL[prop] || prop,
      from: list[0].t,
      to: list[list.length - 1].t,
      ease: EASE_LABEL[dominant] || dominant,
      count: list.length,
    };
  });

/**
 * Agent mode: the animation described rather than drawn. Everything here is
 * derived from the real tracks — it is what the engine will actually play.
 */
export default function MorphTimelineAgent({ scene, dynamics, onEditDynamics }) {
  const keyCount = scene.layers.reduce(
    (n, l) => n + Object.values(l.tracks || {}).reduce((m, list) => m + (list?.length || 0), 0),
    0
  );

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        <Sparkles className="w-3 h-3" />
        Agent view
      </div>

      {dynamics && (
        <button
          onClick={onEditDynamics}
          className="w-full text-left rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2 hover:border-white/35 transition-colors"
        >
          <span className="block text-[10px] text-white/45">Behaviour</span>
          <span className="block text-[11px] text-white/85">
            {MOTIONS.find((m) => m.id === dynamics.motion)?.label || dynamics.motion}
            <span className="text-white/35"> · energy {dynamics.energy} · overshoot {dynamics.overshoot}% · stagger {dynamics.stagger}ms</span>
          </span>
        </button>
      )}

      <div className="space-y-2">
        {scene.layers.map((layer) => {
          const rows = summary(layer);
          return (
            <div key={layer.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-white/85 truncate">
                  {layer.group ? `${layer.group} · ` : ''}{layer.name}
                </span>
                <span className="text-[9px] text-white/30">{rows.length} animated</span>
              </div>
              {rows.length === 0 ? (
                <span className="text-[10px] text-white/30">static</span>
              ) : (
                <div className="mt-0.5 space-y-0.5">
                  {rows.map((r) => (
                    <div key={r.prop} className="flex items-center gap-2 text-[10px]">
                      <span className="w-20 shrink-0 text-white/40">{r.label}</span>
                      <span className="tabular-nums text-white/60">{r.from.toFixed(2)}s → {r.to.toFixed(2)}s</span>
                      <span className="ml-auto text-white/35">{r.ease}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!!(scene.markers || []).length && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Markers</span>
          {(scene.markers || []).map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-[10px] text-white/60">
              <span className="w-16 shrink-0 tabular-nums text-white/40">{m.t.toFixed(2)}s</span>
              {m.label}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-white/25 leading-relaxed">
        {scene.layers.length} layers · {keyCount} keyframes · {scene.duration.toFixed(2)}s ·{' '}
        {Object.keys(EASES).length} interpolation curves. Drop into Advanced to hand-tune any of it.
      </p>
    </div>
  );
}