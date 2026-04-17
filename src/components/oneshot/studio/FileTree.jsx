import React, { useState } from "react";
import { FileCode, FileText, Palette, File, Plus, Trash2, Edit2, Check, X } from "lucide-react";

const iconFor = (path) => {
  if (path.endsWith(".jsx") || path.endsWith(".tsx")) return FileCode;
  if (path.endsWith(".css")) return Palette;
  if (path.endsWith(".md")) return FileText;
  return File;
};

export default function FileTree({ files, activePath, onSelect, onCreate, onDelete, onRename }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingPath, setRenamingPath] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) { setCreating(false); return; }
    const path = name.startsWith("/") ? name : "/" + name;
    onCreate(path);
    setNewName("");
    setCreating(false);
  };

  const submitRename = (oldPath) => {
    const name = renameValue.trim();
    if (!name || name === oldPath) { setRenamingPath(null); return; }
    const path = name.startsWith("/") ? name : "/" + name;
    onRename(oldPath, path);
    setRenamingPath(null);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Files</span>
        <button
          onClick={() => { setCreating(true); setNewName(""); }}
          className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10"
          title="New file"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {files.map((f) => {
          const Icon = iconFor(f.path);
          const isActive = f.path === activePath;
          const isRenaming = renamingPath === f.path;
          return (
            <div
              key={f.path}
              className={`group flex items-center gap-2 px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${
                isActive ? "bg-violet-500/15 text-white border-l-2 border-violet-400" : "text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
              }`}
              onClick={() => !isRenaming && onSelect(f.path)}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
              {isRenaming ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename(f.path);
                      if (e.key === "Escape") setRenamingPath(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-[11px] text-white outline-none focus:border-violet-400"
                  />
                  <button onClick={(e) => { e.stopPropagation(); submitRename(f.path); }} className="text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setRenamingPath(null); }} className="text-white/40 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate font-mono">{f.path}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingPath(f.path); setRenameValue(f.path); }}
                      className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${f.path}?`)) onDelete(f.path); }}
                        className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {creating && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-l-2 border-violet-400/50">
            <FileCode className="w-3.5 h-3.5 text-white/40" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCreate();
                if (e.key === "Escape") setCreating(false);
              }}
              placeholder="/NewFile.jsx"
              className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-0.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-violet-400 font-mono"
            />
            <button onClick={submitCreate} className="text-emerald-400 hover:text-emerald-300">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={() => setCreating(false)} className="text-white/40 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}