import React, { useRef, useState } from "react";
import { Sparkles, Upload, StickyNote, Droplet, Trash2, Loader2 } from "lucide-react";

// Tool bar for the Igra Mood Board — AI image, upload, note, color swatch, clear
export default function MoodToolbar({ onGenerate, onUpload, onAddNote, onAddColor, onClear, generating, uploading }) {
  const [prompt, setPrompt] = useState("");
  const fileRef = useRef(null);
  const colorRef = useRef(null);

  const toolBtn = "flex items-center gap-2 px-3.5 py-2 rounded-full text-[9px] tracking-[0.2em] uppercase focus:outline-none flex-shrink-0";
  const toolStyle = {
    border: "1px solid rgba(255,140,90,0.25)", background: "rgba(255,255,255,0.05)",
    color: "#fdba74", fontFamily: "monospace",
  };

  return (
    <div className="w-full rounded-2xl p-3 flex flex-col gap-3"
      style={{ border: "1px solid rgba(255,140,90,0.18)", background: "rgba(24,10,6,0.6)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}>
      {/* AI generation */}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (prompt.trim() && !generating) { onGenerate(prompt.trim()); setPrompt(""); } }}>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a mood image… e.g. molten orange city at dusk"
          className="flex-1 bg-transparent px-3 py-2 rounded-xl text-xs focus:outline-none"
          style={{ border: "1px solid rgba(255,140,90,0.18)", color: "#ffedd5", fontFamily: "monospace" }} />
        <button type="submit" disabled={generating || !prompt.trim()} className={toolBtn}
          style={{ ...toolStyle, opacity: generating || !prompt.trim() ? 0.5 : 1 }}>
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {generating ? "FORGING…" : "AI IMAGE"}
        </button>
      </form>
      {/* Tools */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className={toolBtn} style={{ ...toolStyle, opacity: uploading ? 0.5 : 1 }}>
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} UPLOAD
        </button>
        <button onClick={onAddNote} className={toolBtn} style={toolStyle}>
          <StickyNote className="w-3.5 h-3.5" /> NOTE
        </button>
        <button onClick={() => colorRef.current?.click()} className={toolBtn} style={toolStyle}>
          <Droplet className="w-3.5 h-3.5" /> SWATCH
        </button>
        <button onClick={onClear} className={toolBtn}
          style={{ ...toolStyle, border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5" }}>
          <Trash2 className="w-3.5 h-3.5" /> CLEAR
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      <input ref={colorRef} type="color" defaultValue="#fb923c" className="hidden"
        onChange={(e) => onAddColor(e.target.value)} />
    </div>
  );
}