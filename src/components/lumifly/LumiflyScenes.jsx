import React from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { textAnimation } from './lumiflyPresets';

export default function LumiflyScenes({ scenes, selectedId, onSelect, onAdd, onDuplicate, onDelete }) {
  return (
    <aside className="w-full shrink-0 border-b border-white/10 bg-[#0e0e0f] p-2.5 lg:w-60 lg:border-b-0 lg:border-r">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">Scenes</span>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/60 transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      <div className="space-y-1.5">
        {scenes.map((scene, i) => {
          const active = scene.id === selectedId;
          return (
            <div
              key={scene.id}
              className={`rounded-lg border px-2 py-1.5 transition-colors ${
                active ? 'border-[#00c29f]/50 bg-[#00c29f]/10' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <button onClick={() => onSelect(scene.id)} className="w-full text-left">
                <span className="block text-[11px] font-medium text-white/85">scene-{i + 1}</span>
                <span className="block truncate text-[10px] text-white/35">
                  {textAnimation(scene.animation).label} · {(Number(scene.duration) || 6).toFixed(1)}s
                </span>
              </button>
              <div className="mt-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => onDuplicate(scene.id)}
                  title="Duplicate scene"
                  className="rounded p-1 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(scene.id)}
                  title="Delete scene"
                  className="rounded p-1 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}