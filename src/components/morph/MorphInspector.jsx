import React from 'react';
import { SHAPE_NAMES, PROPS, sampleLayer } from './morphEngine';
import { SWATCHES } from './MorphLayers';

const ROWS = [
  { prop: 'x', label: 'X', min: -0.5, max: 1.5, step: 0.005 },
  { prop: 'y', label: 'Y', min: -0.5, max: 1.5, step: 0.005 },
  { prop: 'scale', label: 'Scale', min: 0.05, max: 4, step: 0.01 },
  { prop: 'rotation', label: 'Rotation°', min: -720, max: 720, step: 1 },
  { prop: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
  { prop: 'glow', label: 'Glow', min: 0, max: 1, step: 0.01 },
  { prop: 'morph', label: 'Morph', min: 0, max: 1, step: 0.01, shapes: true },
];

export default function MorphInspector({ layer, time, onTransform, onToggleKey, onGroupTransform }) {
  if (!layer) {
    return <p className="p-3 text-[11px] text-white/35">Select a layer to edit its transform.</p>;
  }
  const p = sampleLayer(layer, time);
  const hasKey = (prop) => (layer.tracks?.[prop] || []).some((k) => Math.abs(k.t - time) < 0.003);

  return (
    <div className="p-2.5 space-y-2.5">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Inspector</span>
        <input
          value={layer.name}
          onChange={(e) => onTransform(layer.id, { name: e.target.value })}
          className="mt-1.5 w-full bg-white/[0.05] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-white/35"
        />
      </div>

      {layer.group && onGroupTransform && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/45">Group · {layer.group}</span>
            <span className="text-[9px] text-white/25">parent</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              ['◀', { dx: -0.01 }, 'Move the whole group left'],
              ['▲', { dy: -0.01 }, 'Move the whole group up'],
              ['▶', { dx: 0.01 }, 'Move the whole group right'],
              ['▼', { dy: 0.01 }, 'Move the whole group down'],
              ['+', { scale: 1.05 }, 'Scale the whole group up'],
              ['−', { scale: 0.95 }, 'Scale the whole group down'],
            ].map(([label, delta, hint]) => (
              <button
                key={label}
                onClick={() => onGroupTransform(layer.group, delta)}
                title={hint}
                className="rounded border border-white/12 py-0.5 text-[11px] text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[9px] leading-relaxed text-white/25">
            Moves every member of {layer.group} and bakes it into their keys — each point keeps its own animation.
          </p>
        </div>
      )}

      {layer.type === 'shape' ? (
        <div className="grid grid-cols-2 gap-1.5">
          <label className="text-[10px] text-white/40">
            Shape
            <select
              value={layer.shape}
              onChange={(e) => onTransform(layer.id, { shape: e.target.value })}
              className="mt-1 w-full bg-white/[0.05] border border-white/10 rounded px-1.5 py-1 text-[11px] text-white outline-none"
            >
              {SHAPE_NAMES.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}
            </select>
          </label>
          <label className="text-[10px] text-white/40">
            Morphs into
            <select
              value={layer.morphTo}
              onChange={(e) => onTransform(layer.id, { morphTo: e.target.value })}
              className="mt-1 w-full bg-white/[0.05] border border-white/10 rounded px-1.5 py-1 text-[11px] text-white outline-none"
            >
              {SHAPE_NAMES.map((s) => <option key={s} value={s} className="bg-black">{s}</option>)}
            </select>
          </label>
        </div>
      ) : layer.type === 'image' ? (
        <label className="block text-[10px] text-white/40">
          Image URL
          <input
            value={layer.src || ''}
            onChange={(e) => onTransform(layer.id, { src: e.target.value })}
            className="mt-1 w-full bg-white/[0.05] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-white/35"
          />
        </label>
      ) : (
        <label className="block text-[10px] text-white/40">
          Text
          <input
            value={layer.text}
            onChange={(e) => onTransform(layer.id, { text: e.target.value })}
            className="mt-1 w-full bg-white/[0.05] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-white/35"
          />
        </label>
      )}

      {layer.type !== 'image' && (
      <div className="flex items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onTransform(layer.id, { color: c })}
            className={`w-4 h-4 rounded-full border ${layer.color === c ? 'border-white' : 'border-white/20'}`}
            style={{ background: c }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={layer.color}
          onChange={(e) => onTransform(layer.id, { color: e.target.value })}
          className="w-6 h-5 bg-transparent border border-white/15 rounded cursor-pointer"
        />
      </div>
      )}

      <label className="block text-[10px] text-white/40">
        Size {layer.size.toFixed(2)}
        <input
          type="range"
          min="0.03"
          max="1"
          step="0.01"
          value={layer.size}
          onChange={(e) => onTransform(layer.id, { size: Number(e.target.value) })}
          className="w-full accent-white"
        />
      </label>

      {ROWS.map((row) => (
        <div key={row.prop} className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/45">
              {row.label}
              {row.shapes && <span className="text-white/25"> ({layer.shape} → {layer.morphTo})</span>}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step={row.step}
                value={Number(p[row.prop].toFixed(3))}
                onChange={(e) => onTransform(layer.id, { [row.prop]: Number(e.target.value) })}
                className="w-16 bg-white/[0.05] border border-white/10 rounded px-1 py-0.5 text-[10px] text-white tabular-nums outline-none focus:border-white/35"
              />
              <button
                onClick={() => onToggleKey(row.prop)}
                title={hasKey(row.prop) ? 'Remove keyframe at playhead' : 'Add keyframe at playhead'}
                className={`w-4 h-4 rotate-45 border transition-colors ${
                  hasKey(row.prop) ? 'bg-white border-white' : 'border-white/30 hover:border-white/70'
                }`}
              />
            </div>
          </div>
          <input
            type="range"
            min={row.min}
            max={row.max}
            step={row.step}
            value={p[row.prop]}
            onChange={(e) => onTransform(layer.id, { [row.prop]: Number(e.target.value) })}
            className="w-full accent-white"
          />
        </div>
      ))}

      <p className="text-[10px] text-white/25 leading-relaxed">
        {PROPS.length} animatable properties · keyframes interpolate between values, morph blends point-for-point.
      </p>
    </div>
  );
}