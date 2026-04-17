import React, { useRef, useEffect } from "react";
import { Save } from "lucide-react";

/**
 * Lightweight code editor: textarea with monospace, tab support, auto-save on blur.
 * No new npm dependencies.
 */
export default function CodeEditor({ file, onChange, onSave, saving, dirty }) {
  const taRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = taRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;
      const newValue = value.slice(0, start) + "  " + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      onSave();
    }
  };

  useEffect(() => {
    if (taRef.current) taRef.current.scrollTop = 0;
  }, [file?.path]);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-white/30 text-sm">
        Select a file to edit
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-zinc-950">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-white/80 font-mono">{file.path}</span>
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
        </div>
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-2.5 py-1 transition-all"
        >
          <Save className="w-3 h-3" />
          {saving ? "Saving…" : "Save"}
          <kbd className="hidden sm:inline text-[9px] bg-white/10 rounded px-1 ml-1">⌘S</kbd>
        </button>
      </div>
      <textarea
        ref={taRef}
        value={file.content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="flex-1 w-full p-4 bg-transparent text-emerald-200/90 font-mono text-[12.5px] leading-relaxed outline-none resize-none"
        style={{
          tabSize: 2,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      />
    </div>
  );
}