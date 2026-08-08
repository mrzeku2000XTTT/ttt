import React from "react";
import { fileLang } from "./projectFiles";

export default function FileEditor({ file, onChange }) {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#86868B] text-xs">
        Select a file to view its code
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.06] bg-[#F0F0F2] flex-shrink-0">
        <span className="font-mono text-[11px] text-[#1D1D1F] truncate">{file.path}</span>
        <span className="text-[9px] uppercase tracking-wide text-[#86868B]">{fileLang(file.path)}</span>
      </div>
      <textarea
        value={file.content}
        onChange={(e) => onChange(file.path, e.target.value)}
        spellCheck={false}
        className="flex-1 w-full bg-white text-[11px] font-mono text-[#1D1D1F] leading-relaxed p-4 outline-none resize-none"
      />
    </div>
  );
}