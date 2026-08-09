import React from "react";
import { Type } from "lucide-react";

export const TEXT_TEMPLATES = [
  { id: "t1", style: "title", text: "Introducing", position: "top" },
  { id: "t2", style: "title", text: "Now Available", position: "bottom" },
  { id: "t3", style: "subtitle", text: "Swipe to explore", position: "bottom" },
  { id: "t4", style: "caption", text: "Tap to start", position: "center" },
  { id: "t5", style: "badge", text: "NEW", position: "top" },
  { id: "t6", style: "badge", text: "PRO", position: "top" },
];

export default function TextTemplates({ selected, onSelect, onEditText }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-semibold text-sm">Text Templates</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TEXT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
              selected?.id === t.id
                ? "bg-cyan-500/15 border border-cyan-500/40 text-white"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
            }`}
          >
            <span className="block text-[10px] text-white/30 mb-0.5 uppercase tracking-wide">{t.style}</span>
            {t.text}
          </button>
        ))}
      </div>
      {selected && (
        <input
          type="text"
          value={selected.text}
          onChange={(e) => onEditText({ ...selected, text: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          placeholder="Edit text…"
        />
      )}
    </div>
  );
}