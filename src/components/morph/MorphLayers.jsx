import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

const SWATCHES = ['#ffffff', '#ff4d4d', '#3ddc84', '#4d8dff', '#facc15', '#c084fc'];

export default function MorphLayers({ scene, selectedId, onSelect, onAdd, onDelete, onToggleVisible }) {
  return (
    <div className="border-b border-white/10 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Layers</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAdd('shape')}
            className="px-2 py-1 rounded border border-white/15 text-[10px] text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            + Shape
          </button>
          <button
            onClick={() => onAdd('text')}
            className="px-2 py-1 rounded border border-white/15 text-[10px] text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            + Text
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {scene.layers.length === 0 && <p className="text-[11px] text-white/35 py-2">No layers yet.</p>}
        {scene.layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${
              selectedId === layer.id ? 'bg-white/12' : 'hover:bg-white/[0.06]'
            }`}
          >
            <button onClick={() => onSelect(layer.id)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
              <span
                className="w-3 h-3 rounded-sm shrink-0 border border-white/25"
                style={{ background: layer.type === 'text' ? 'transparent' : layer.color }}
              />
              <span className={`truncate text-[11px] ${selectedId === layer.id ? 'text-white' : 'text-white/60'}`}>
                {layer.name}
              </span>
            </button>
            <button
              onClick={() => onToggleVisible(layer.id)}
              className="p-1 text-white/40 hover:text-white transition-colors"
              title={layer.visible === false ? 'Show' : 'Hide'}
            >
              {layer.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => onDelete(layer.id)}
              className="p-1 text-white/40 hover:text-red-400 transition-colors"
              title="Delete layer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SWATCHES };