import React from 'react';
import { Clapperboard, Layers3 } from 'lucide-react';

export default function ETAShowroomControls({ scenes, selected, onSelect }) {
  return <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
    <button onClick={() => onSelect(-1)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${selected === -1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>
      <Layers3 className="h-3.5 w-3.5" /> Combined film
    </button>
    {scenes.map((scene, index) => <button key={`${scene.component}-${index}`} onClick={() => onSelect(index)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${selected === index ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>
      <Clapperboard className="h-3.5 w-3.5" /> {index + 1}. {scene.component}
    </button>)}
  </div>;
}