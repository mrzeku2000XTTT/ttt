import React from 'react';
import { Sparkles } from 'lucide-react';
import ETAFormField, { etaInput } from './ETAFormField';
import { buildAutoKeyframes } from '@/lib/etaAutoKeyframes';

export default function ETAAutoKeyframesPanel({ scene, advanced, setAdvanced }) {
  const enabled = advanced.autoMotionEnabled !== false;
  const preset = advanced.autoMotionPreset || 'auto';
  const intensity = Number(advanced.autoMotionIntensity ?? 1);
  const frames = buildAutoKeyframes(scene.component, scene.duration, preset, intensity);
  return <section className="space-y-4 rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Auto keyframes</h2><p className="text-xs text-muted-foreground">Universal 3D transform track at 60 FPS</p></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={enabled} onChange={(e) => setAdvanced('autoMotionEnabled', e.target.checked)} /> Enabled</label></div><div className="grid gap-3 sm:grid-cols-2"><ETAFormField label="Motion preset"><select className={etaInput} value={preset} onChange={(e) => setAdvanced('autoMotionPreset', e.target.value)}><option value="auto">Auto by component</option><option value="spin">Spin</option><option value="float">Float</option><option value="tilt">Tilt</option></select></ETAFormField><ETAFormField label="Motion strength"><input className={etaInput} type="number" min="0" max="3" step=".1" value={intensity} onChange={(e) => setAdvanced('autoMotionIntensity', Number(e.target.value))} /></ETAFormField></div><div className="relative h-9 rounded-lg border border-border bg-background"><div className="absolute inset-x-3 top-1/2 h-px bg-border" />{frames.map((frame, index) => <span key={index} title={`${Number(frame.time).toFixed(1)}s`} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-primary bg-card" style={{ left: `${(frame.time / Math.max(1, Number(scene.duration) || 3)) * 100}%` }} />)}</div></section>;
}