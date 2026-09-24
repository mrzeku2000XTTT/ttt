import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2, Wand2 } from 'lucide-react';

const SWATCHES = ['#ffffff', '#ff4d4d', '#3ddc84', '#4d8dff', '#facc15', '#c084fc'];

/**
 * Layers, grouped. Tick two or more rows to group them — a group carries its
 * own collapsible header in the timeline, moves and scales as one, and can be
 * staggered in a single click while each member keeps its own animation.
 */
export default function MorphLayers({
  scene,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onToggleVisible,
  checked = [],
  onCheck,
  onGroup,
  onUngroup,
  onStagger,
}) {
  const [collapsed, setCollapsed] = useState([]);

  const groupNames = [];
  scene.layers.forEach((l) => {
    if (l.group && !groupNames.includes(l.group)) groupNames.push(l.group);
  });
  const loose = scene.layers.filter((l) => !l.group);
  const checkedGroup = scene.layers.find((l) => checked.includes(l.id) && l.group)?.group;

  const row = (layer) => (
    <div
      key={layer.id}
      className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${
        selectedId === layer.id ? 'bg-white/12' : 'hover:bg-white/[0.06]'
      }`}
    >
      <button
        onClick={() => onCheck?.(layer.id)}
        title="Select for group / stagger"
        className={`w-3 h-3 shrink-0 rounded-sm border transition-colors ${
          checked.includes(layer.id) ? 'bg-white border-white' : 'border-white/30 hover:border-white/70'
        }`}
      />
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
  );

  const groupHeader = (name) => {
    const members = scene.layers.filter((l) => l.group === name);
    const isCollapsed = collapsed.includes(name);
    return (
      <div key={name} className="flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-1">
        <button
          onClick={() => setCollapsed((c) => (isCollapsed ? c.filter((x) => x !== name) : [...c, name]))}
          className="p-0.5 text-white/50 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <span className="flex-1 truncate text-[11px] font-semibold text-white/85">{name}</span>
        <span className="text-[9px] text-white/30">{members.length}</span>
        <button
          onClick={() => onStagger?.(members.map((m) => m.id))}
          title="Stagger this group by 100ms"
          className="p-1 text-white/40 hover:text-white transition-colors"
        >
          <Wand2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => onUngroup?.(name)}
          title="Ungroup"
          className="px-1 text-[9px] text-white/40 hover:text-white transition-colors"
        >
          ungroup
        </button>
      </div>
    );
  };

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

      {checked.length >= 2 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-white/40">{checked.length} selected</span>
          <button
            onClick={onGroup}
            className="px-2 py-0.5 rounded bg-white/15 text-[10px] text-white hover:bg-white/25 transition-colors"
          >
            Group
          </button>
          <button
            onClick={() => onStagger?.(checked)}
            className="px-2 py-0.5 rounded border border-white/15 text-[10px] text-white/70 hover:text-white transition-colors"
          >
            Stagger 100ms
          </button>
          {checkedGroup && (
            <button
              onClick={() => onUngroup?.(checkedGroup)}
              className="px-2 py-0.5 rounded border border-white/15 text-[10px] text-white/70 hover:text-white transition-colors"
            >
              Ungroup
            </button>
          )}
        </div>
      )}

      <div className="mt-2 space-y-1">
        {scene.layers.length === 0 && <p className="text-[11px] text-white/35 py-2">No layers yet.</p>}
        {groupNames.map((name) => (
          <React.Fragment key={name}>
            {groupHeader(name)}
            {!collapsed.includes(name) && (
              <div className="pl-3 space-y-1">
                {scene.layers.filter((l) => l.group === name).map((l) => row(l))}
              </div>
            )}
          </React.Fragment>
        ))}
        {loose.map((l) => row(l))}
      </div>
    </div>
  );
}

export { SWATCHES };