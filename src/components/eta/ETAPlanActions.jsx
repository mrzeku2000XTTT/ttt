import React, { useState } from 'react';
import { Plus, SlidersHorizontal, WandSparkles } from 'lucide-react';
import { ETA_COMPONENTS } from '@/lib/etaPlan';

export default function ETAPlanActions({ onAdd, onCompile, onEdit }) {
  const [component, setComponent] = useState('TitleCard');
  return <div className="mt-6 rounded-2xl border border-border bg-card p-4"><div className="flex flex-col gap-2 sm:flex-row"><select value={component} onChange={(e) => setComponent(e.target.value)} className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm">{ETA_COMPONENTS.map((item) => <option key={item}>{item}</option>)}</select><button onClick={() => onAdd(component)} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Plus className="h-4 w-4" /> Add component</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><button onClick={onEdit} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4" /> Advanced edit scenes</button><button onClick={onCompile} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><WandSparkles className="h-4 w-4" /> Compile animation</button></div></div>;
}