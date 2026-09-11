import React from 'react';
import { Brush, Square, Circle, ArrowUpRight, Type, Crop, Undo2, Redo2, Download, Trash2, Upload } from 'lucide-react';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';

const TOOLS = [
  { id: 'brush', icon: Brush, label: 'Brush' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'crop', icon: Crop, label: 'Crop' },
];
const COLORS = ['#00ff99', '#ffffff', '#ff3b6b', '#3b82f6', '#f59e0b', '#a855f7'];
const SIZES = [2, 5, 10, 20];

export default function KanvasToolbar({ tool, setTool, color, setColor, size, setSize, onUndo, onRedo, onClear, onExport, onUpload, onApplyCrop, cropping, canUndo, canRedo, hasImage, address, onHome, onExit }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur">
      <button onClick={onHome} className="flex items-center gap-2 pr-3 border-r border-white/10" title="Back to landing">
        <span className="text-base font-bold tracking-tight">Kan<span className="text-[hsl(var(--kv-accent))]">vas</span></span>
      </button>
      <div className="flex items-center gap-1.5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className={`kv-tool ${tool === t.id ? 'kv-tool-active' : ''}`}>
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} title={c}
            className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-white/20'}`}
            style={{ background: c }} />
        ))}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded bg-transparent border border-white/20 cursor-pointer" title="Custom color" />
      </div>
      <div className="flex items-center gap-1.5">
        {SIZES.map((s) => (
          <button key={s} onClick={() => setSize(s)} title={`${s}px`}
            className={`w-7 h-7 rounded-md border ${size === s ? 'border-[hsl(var(--kv-accent))] bg-[hsl(var(--kv-accent))]/15' : 'border-white/15'}`}>
            <span className="block mx-auto rounded-full bg-white" style={{ width: Math.min(s, 14), height: Math.min(s, 14) }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={onUndo} disabled={!canUndo} className="kv-tool disabled:opacity-30" title="Undo"><Undo2 className="w-4 h-4" /></button>
        <button onClick={onRedo} disabled={!canRedo} className="kv-tool disabled:opacity-30" title="Redo"><Redo2 className="w-4 h-4" /></button>
        <button onClick={onClear} disabled={!hasImage} className="kv-tool disabled:opacity-30" title="Clear all"><Trash2 className="w-4 h-4" /></button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {cropping && <button onClick={onApplyCrop} className="kv-btn kv-btn-primary"><Crop className="w-4 h-4" /> Apply crop</button>}
        <button onClick={onUpload} className="kv-btn"><Upload className="w-4 h-4" /> Upload</button>
        <button onClick={onExport} disabled={!hasImage} className="kv-btn kv-btn-primary disabled:opacity-40"><Download className="w-4 h-4" /> Export PNG</button>
        <button onClick={onExit} className="kv-btn" title="Exit to Store">Exit</button>
        <div className="kv-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--kv-accent))]" />
          <span className="font-mono text-[hsl(var(--kv-muted))]">{shortKaspaAddress(address)}</span>
        </div>
      </div>
    </div>
  );
}