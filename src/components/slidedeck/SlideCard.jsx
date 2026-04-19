import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { STYLE_OPTIONS, STYLE_COLORS } from "./StyleDot";

export default function SlideCard({ slide, index, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const [local, setLocal] = useState({
    prompt: slide.prompt || "",
    voiceover: slide.voiceover || "",
    duration: slide.duration || 5,
    style: slide.style || "auto",
  });

  const save = () => {
    onUpdate(slide.id, {
      prompt: local.prompt,
      voiceover: local.voiceover,
      duration: Number(local.duration) || 5,
      style: local.style,
    });
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(15,18,25,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: `${STYLE_COLORS[local.style]}22`, color: STYLE_COLORS[local.style] }}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-white text-[13px] font-semibold truncate">
              {local.prompt ? local.prompt.slice(0, 50) : "Untitled slide"}
            </div>
            <div className="text-white/40 text-[10px] mt-0.5">
              {local.duration}s · {local.style}
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>
        <button
          onClick={() => onDelete(slide.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 ml-2"
          title="Delete slide"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Visual Prompt</label>
            <textarea
              value={local.prompt}
              onChange={(e) => setLocal({ ...local, prompt: e.target.value })}
              onBlur={save}
              placeholder="Describe the visual scene"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10 focus:border-teal-400/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Voiceover Text</label>
            <textarea
              value={local.voiceover}
              onChange={(e) => setLocal({ ...local, voiceover: e.target.value })}
              onBlur={save}
              placeholder="What the narrator says"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10 focus:border-teal-400/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Duration (s)</label>
              <input
                type="number"
                min={2}
                max={30}
                value={local.duration}
                onChange={(e) => setLocal({ ...local, duration: e.target.value })}
                onBlur={save}
                className="w-full px-3 py-2 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10 focus:border-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Style</label>
              <select
                value={local.style}
                onChange={(e) => { const v = e.target.value; setLocal({ ...local, style: v }); onUpdate(slide.id, { ...local, duration: Number(local.duration) || 5, style: v }); }}
                className="w-full px-3 py-2 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10 focus:border-teal-400/50"
              >
                {STYLE_OPTIONS.map(s => <option key={s} value={s} style={{ background: "#0f1219" }}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}