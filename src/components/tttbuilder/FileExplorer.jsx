import React, { useState } from "react";
import { FileCode2, FileJson, FileText, Palette, Plus, Trash2, Folder } from "lucide-react";
import { norm, sortFiles } from "./projectFiles";

const iconFor = (path) => {
  const ext = path.split(".").pop().toLowerCase();
  if (ext === "css") return Palette;
  if (ext === "json") return FileJson;
  if (ext === "js" || ext === "mjs") return FileCode2;
  if (ext === "html") return FileText;
  return FileText;
};

export default function FileExplorer({ files, activePath, onSelect, onCreate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [newPath, setNewPath] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const p = norm(newPath);
    if (!p) return;
    onCreate(p);
    setNewPath("");
    setAdding(false);
  };

  return (
    <div className="w-40 sm:w-52 flex-shrink-0 border-r border-black/[0.06] bg-[#F0F0F2] flex flex-col min-h-0">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-black/[0.06]">
        <Folder className="w-3.5 h-3.5 text-[#007AFF]" />
        <span className="text-[11px] font-bold text-[#1D1D1F]">Files</span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="ml-auto w-6 h-6 rounded flex items-center justify-center text-[#86868B] hover:text-[#007AFF] hover:bg-black/[0.04]"
          title="New file"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="px-2 py-2 border-b border-black/[0.06]">
          <input
            autoFocus
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="styles/app.css"
            className="w-full bg-white border border-black/[0.08] rounded px-2 py-1.5 text-[11px] text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 transition-colors"
          />
        </form>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {sortFiles(files).map((f) => {
          const Icon = iconFor(f.path);
          const active = f.path === activePath;
          return (
            <div
              key={f.path}
              onClick={() => onSelect(f.path)}
              className={`group flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer text-[11px] ${
                active ? "bg-[#007AFF]/10 text-[#007AFF]" : "text-[#6B7280] hover:text-[#1D1D1F] hover:bg-black/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: active ? "#007AFF" : "#86868B" }} />
              <span className="truncate font-mono">{f.path}</span>
              {f.path !== "index.html" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(f.path); }}
                  className="ml-auto opacity-0 group-hover:opacity-100 text-[#86868B] hover:text-[#FF3B30]"
                  title="Delete file"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        {files.length === 0 && (
          <p className="px-3 py-4 text-[10px] text-[#86868B] leading-relaxed">
            No files yet. Describe your app and the agent will create them.
          </p>
        )}
      </div>
    </div>
  );
}