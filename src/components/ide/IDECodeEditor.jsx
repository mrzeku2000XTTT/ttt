import React, { useState } from "react";
import { Copy, Check, FileCode, FileJson, Settings } from "lucide-react";

const ICON_MAP = {
  json: <FileJson className="w-3.5 h-3.5 text-yellow-400" />,
  jsx: <FileCode className="w-3.5 h-3.5 text-cyan-400" />,
  js: <Settings className="w-3.5 h-3.5 text-emerald-400" />,
};

export default function IDECodeEditor({ file, onCodeChange }) {
  const [copied, setCopied] = useState(false);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "rgba(10,10,18,0.98)" }}>
        <div className="text-center text-white/20">
          <FileCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm font-medium">Select a file to view & edit</div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "rgba(10,10,18,0.98)" }}>
      {/* File tab bar */}
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{ background: "rgba(20,20,30,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          {ICON_MAP[file.ext] || <FileCode className="w-3.5 h-3.5 text-white/40" />}
          <span className="text-[12px] font-mono text-white/70">{file.name}</span>
          <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">{file.type}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all hover:bg-white/10"
          style={{ color: copied ? "rgba(52,211,153,1)" : "rgba(6,182,212,0.8)" }}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code content — editable */}
      <div className="flex-1 overflow-auto p-0">
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-3 pl-3 pr-2 text-right select-none" style={{ minWidth: "3rem" }}>
            {(file.code || "").split("\n").map((_, i) => (
              <div key={i} className="text-[11px] font-mono leading-5 text-white/15">{i + 1}</div>
            ))}
          </div>
          {/* Editable code */}
          <textarea
            value={file.code || ""}
            onChange={(e) => onCodeChange && onCodeChange(file.id, e.target.value)}
            className="flex-1 py-3 pr-4 bg-transparent text-[12px] font-mono leading-5 text-emerald-300/90 outline-none resize-none overflow-hidden"
            style={{ fontSize: "16px", tabSize: 2, minHeight: "100%" }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}