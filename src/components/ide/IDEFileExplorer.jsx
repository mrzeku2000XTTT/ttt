import React, { useState } from "react";
import { ChevronRight, ChevronDown, FileJson, FileCode, Settings, FolderOpen, Folder } from "lucide-react";

const FILE_ICONS = {
  json: <FileJson className="w-3.5 h-3.5 text-yellow-400" />,
  jsx: <FileCode className="w-3.5 h-3.5 text-cyan-400" />,
  js: <Settings className="w-3.5 h-3.5 text-emerald-400" />,
};

function FileItem({ name, ext, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] font-mono transition-colors ${
        isActive ? "bg-cyan-500/15 text-cyan-300" : "text-white/60 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      {FILE_ICONS[ext] || <FileCode className="w-3.5 h-3.5 text-white/40" />}
      <span className="truncate">{name}</span>
    </button>
  );
}

function FolderSection({ label, icon, files, activeFile, onSelectFile, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (!files || files.length === 0) return null;

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {open ? <FolderOpen className="w-3.5 h-3.5 text-white/30" /> : <Folder className="w-3.5 h-3.5 text-white/30" />}
        {label}
        <span className="ml-auto text-[10px] text-white/20">{files.length}</span>
      </button>
      {open && (
        <div className="ml-2">
          {files.map((f) => (
            <FileItem
              key={f.id}
              name={f.name}
              ext={f.ext}
              isActive={activeFile === f.id}
              onClick={() => onSelectFile(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function IDEFileExplorer({ files, activeFile, onSelectFile }) {
  const entities = files.filter(f => f.type === "entity");
  const pages = files.filter(f => f.type === "page");
  const functions = files.filter(f => f.type === "function");

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "rgba(14,14,22,0.98)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/25" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
        <FolderSection label="Entities" files={entities} activeFile={activeFile} onSelectFile={onSelectFile} />
        <FolderSection label="Pages" files={pages} activeFile={activeFile} onSelectFile={onSelectFile} />
        <FolderSection label="Functions" files={functions} activeFile={activeFile} onSelectFile={onSelectFile} />
        {files.length === 0 && (
          <div className="px-3 py-8 text-center text-[11px] text-white/20">
            No files yet — describe your app in the chat to generate code
          </div>
        )}
      </div>
    </div>
  );
}