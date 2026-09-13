import React, { useState } from 'react';
import { ArrowLeft, Eye, Trash2 } from 'lucide-react';
import ETAMotionCard from './ETAMotionCard';
import ETAAdvancedBasics from './ETAAdvancedBasics';
import ETABrowserKeyframes from './ETABrowserKeyframes';
import ETAZoomCursorPanel from './ETAZoomCursorPanel';
import ETAAppearancePanel from './ETAAppearancePanel';
import ETAMatchCutPanel from './ETAMatchCutPanel';
import ETAComponentSettings from './ETAComponentSettings';

export default function ETAAdvancedEditor({ plan, onBack, onSceneChange, onDelete, onPreview }) {
  const [index, setIndex] = useState(0); const scene = plan.scenes[Math.min(index, plan.scenes.length - 1)];
  const setScene = (next) => onSceneChange(Math.min(index, plan.scenes.length - 1), next);
  const setAdvanced = (key, value) => setScene({ ...scene, advanced: { ...(scene.advanced || {}), [key]: value } });
  if (!scene) return null;
  return <main className="mx-auto max-w-6xl px-5 py-8"><div className="mb-5 flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Scene plan</button><button onClick={onPreview} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Eye className="h-4 w-4" /> Preview motion</button></div><div className="mb-5 flex gap-2 overflow-x-auto pb-2">{plan.scenes.map((item, i) => <button key={i} onClick={() => setIndex(i)} className={`shrink-0 rounded-full border px-3 py-2 text-xs ${i === index ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>Scene {String(i + 1).padStart(2, '0')} · {item.component}</button>)}</div><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><div className="space-y-4"><div className="sticky top-4"><ETAMotionCard scene={scene} compact /><button onClick={() => { onDelete(index); setIndex(Math.max(0, index - 1)); }} disabled={plan.scenes.length === 1} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-2.5 text-xs font-semibold text-destructive disabled:opacity-40"><Trash2 className="h-4 w-4" /> Delete scene</button></div></div><div className="space-y-4"><ETAMatchCutPanel value={scene.advanced?.matchCut || {}} onChange={(value) => setAdvanced('matchCut', value)} previous={plan.scenes[index - 1]} /><ETAAdvancedBasics scene={scene} setScene={setScene} advanced={scene.advanced || {}} setAdvanced={setAdvanced} /><ETAComponentSettings scene={scene} advanced={scene.advanced || {}} setAdvanced={setAdvanced} /><ETABrowserKeyframes value={scene.advanced?.browserKeyframes || []} onChange={(value) => setAdvanced('browserKeyframes', value)} /><ETAZoomCursorPanel advanced={scene.advanced || {}} setAdvanced={setAdvanced} /><ETAAppearancePanel advanced={scene.advanced || {}} setAdvanced={setAdvanced} /></div></div></main>;
}