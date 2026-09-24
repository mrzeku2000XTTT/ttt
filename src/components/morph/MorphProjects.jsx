import React, { useState } from 'react';
import { Clock, FilePlus2, FolderOpen, RotateCcw, Trash2, X } from 'lucide-react';

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'history', label: 'History', icon: Clock },
];

const when = (t) => {
  const d = new Date(t);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Projects and version history. A project holds its own scene; history holds
 * snapshots you can restore.
 */
export default function MorphProjects({
  projects,
  activeId,
  onNew,
  onOpen,
  onDelete,
  onRestore,
  onSnapshot,
  onClose,
}) {
  const [tab, setTab] = useState('projects');
  const [name, setName] = useState('');

  const active = projects.find((p) => p.id === activeId) || projects[0];
  const history = active?.history || [];

  const create = () => {
    onNew(name);
    setName('');
    setTab('projects');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg my-6 rounded-2xl border border-white/12 bg-[#0d0d0d] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-1 px-3 py-2.5 border-b border-white/10">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                  tab === t.id ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
          <button onClick={onClose} className="ml-auto p-1 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'projects' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
                placeholder="New project name"
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-white/35"
              />
              <button
                onClick={create}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-black hover:opacity-90 transition-opacity"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                New project
              </button>
            </div>

            <div className="space-y-1.5">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                    p.id === activeId ? 'border-white/40 bg-white/[0.07]' : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <button onClick={() => onOpen(p.id)} className="flex-1 min-w-0 text-left">
                    <span className="block truncate text-[11px] text-white/85">{p.name}</span>
                    <span className="block text-[9px] text-white/35">
                      {p.scene?.layers?.length || 0} layers · {when(p.updated)}
                      {p.id === activeId ? ' · open' : ''}
                    </span>
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={() => onDelete(p.id)}
                      title="Delete project"
                      className="p-1 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-white/40">
                Versions of {active?.name || 'this project'} — the last 12 are kept.
              </span>
              <button
                onClick={onSnapshot}
                className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-[10px] text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                Save this version
              </button>
            </div>

            {history.length === 0 ? (
              <p className="text-[10px] text-white/30 py-2">
                Nothing saved yet. Versions are captured automatically when the AI builds a scene or you apply
                sequences.
              </p>
            ) : (
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-[11px] text-white/80">{h.label}</span>
                      <span className="block text-[9px] text-white/35">
                        {when(h.t)} · {h.scene?.layers?.length || 0} layers
                      </span>
                    </div>
                    <button
                      onClick={() => onRestore(h.id)}
                      className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/70 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}