import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ETAFormField, { etaInput } from './ETAFormField';
import { MORPH_SHAPES, MORPH_EASINGS, getMorphKeyframes } from '@/lib/etaShapeMorph';

export default function ETAShapeMorphSettings({ scene, advanced, setAdvanced }) {
  const duration = Math.max(1, Number(scene.duration) || 3);
  const frames = getMorphKeyframes(advanced, duration);
  const setFrames = (next) => setAdvanced('shapeKeyframes', next);
  const setFrame = (i, key, value) => setFrames(frames.map((f, n) => (n === i ? { ...f, [key]: value } : f)));
  const addFrame = () => setFrames([...frames, {
    time: Math.min(duration, (frames.at(-1)?.time ?? 0) + 1),
    shape: frames.at(-1)?.shape || 'square',
    x: 0, y: 0, rotate: 0, scale: 1, hold: 0.25, easing: 'ease-in-out',
  }]);
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">ShapeMorph</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <ETAFormField label="Fill color"><input className={etaInput} value={advanced.shapeFillColor || ''} onChange={(e) => setAdvanced('shapeFillColor', e.target.value)} placeholder="#ffffff" /></ETAFormField>
        <ETAFormField label="Stroke color"><input className={etaInput} value={advanced.shapeStrokeColor || ''} onChange={(e) => setAdvanced('shapeStrokeColor', e.target.value)} placeholder="#ffffff" /></ETAFormField>
        <ETAFormField label="Stroke width"><input className={etaInput} type="number" step="0.5" value={advanced.shapeStrokeWidth ?? 2} onChange={(e) => setAdvanced('shapeStrokeWidth', Number(e.target.value))} /></ETAFormField>
        <ETAFormField label="Fill opacity (0–1)"><input className={etaInput} type="number" step="0.05" min="0" max="1" value={advanced.shapeFillOpacity ?? 0.12} onChange={(e) => setAdvanced('shapeFillOpacity', Number(e.target.value))} /></ETAFormField>
        <ETAFormField label="Background"><input className={etaInput} value={advanced.shapeBackground || ''} onChange={(e) => setAdvanced('shapeBackground', e.target.value)} placeholder="transparent" /></ETAFormField>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold">Morph keyframes</h3>
            <p className="text-[11px] text-muted-foreground">shape · time · transform · hold</p>
          </div>
          <button onClick={addFrame} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs"><Plus className="h-3 w-3" /> Add</button>
        </div>
        {frames.map((frame, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
            <p className="text-xs font-semibold sm:col-span-3">Keyframe {i + 1}</p>
            <ETAFormField label="Shape">
              <select className={etaInput} value={frame.shape} onChange={(e) => setFrame(i, 'shape', e.target.value)}>
                {MORPH_SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </ETAFormField>
            <ETAFormField label="Time (s)"><input className={etaInput} type="number" step="0.1" min="0" max={duration} value={frame.time} onChange={(e) => setFrame(i, 'time', Number(e.target.value))} /></ETAFormField>
            <ETAFormField label="Hold (0–0.8)"><input className={etaInput} type="number" step="0.05" min="0" max="0.8" value={frame.hold ?? 0.25} onChange={(e) => setFrame(i, 'hold', Number(e.target.value))} /></ETAFormField>
            <ETAFormField label="X"><input className={etaInput} type="number" value={frame.x ?? 0} onChange={(e) => setFrame(i, 'x', Number(e.target.value))} /></ETAFormField>
            <ETAFormField label="Y"><input className={etaInput} type="number" value={frame.y ?? 0} onChange={(e) => setFrame(i, 'y', Number(e.target.value))} /></ETAFormField>
            <ETAFormField label="Rotate (deg)"><input className={etaInput} type="number" value={frame.rotate ?? 0} onChange={(e) => setFrame(i, 'rotate', Number(e.target.value))} /></ETAFormField>
            <ETAFormField label="Scale"><input className={etaInput} type="number" step="0.1" value={frame.scale ?? 1} onChange={(e) => setFrame(i, 'scale', Number(e.target.value))} /></ETAFormField>
            <ETAFormField label="Easing">
              <select className={etaInput} value={frame.easing || 'ease-in-out'} onChange={(e) => setFrame(i, 'easing', e.target.value)}>
                {MORPH_EASINGS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </ETAFormField>
            <button onClick={() => setFrames(frames.filter((_, n) => n !== i))} className="flex items-center gap-1 text-xs text-destructive sm:col-span-3"><Trash2 className="h-3 w-3" /> Delete this keyframe</button>
          </div>
        ))}
      </div>
    </section>
  );
}