import React from 'react';
import { X, Trash2, Clock } from 'lucide-react';

/**
 * Library overlay — saved Kinezma projects (IndexedDB). Open or delete.
 */
export default function KinezmaLibrary({ projects, currentId, onClose, onOpen, onDelete }) {
  const fmt = (ts) => {
    const d = new Date(ts);
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days > 0) return `${d.getMonth() + 1}/${d.getDate()}`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[80dvh] flex flex-col border border-zinc-800 rounded-2xl bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-sm font-bold tracking-wide">LIBRARY</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {projects.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-8">
              Saved projects appear here — your work autosaves as you go.
            </p>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${
                p.id === currentId ? 'border-white/40 bg-white/5' : 'border-zinc-800'
              }`}
            >
              <button onClick={() => onOpen(p.id)} className="flex-1 min-w-0 text-left">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {p.componentCount} components{p.hasMotion ? ' · motion' : ''} · {fmt(p.savedAt)}
                </p>
              </button>
              <span className="text-zinc-600 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" />saved
              </span>
              <button
                onClick={() => onDelete(p.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}