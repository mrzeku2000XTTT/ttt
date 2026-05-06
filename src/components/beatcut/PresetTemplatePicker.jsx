import React from "react";
import { Sparkles } from "lucide-react";
import { ANIMATION_TEMPLATES } from "./animationTemplates";

export default function PresetTemplatePicker({ selectedId, onSelect }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">Animation template</div>
      <div className="grid gap-2">
        {ANIMATION_TEMPLATES.map((template) => {
          const selected = selectedId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`relative overflow-hidden rounded-2xl p-3 text-left border transition-all ${
                selected ? "border-white/40 bg-white/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${template.accent} opacity-20`} />
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-white truncate">{template.name}</div>
                  <div className="text-[10px] text-white/50 truncate">{template.description}</div>
                </div>
                {selected && <div className="text-[10px] font-black text-cyan-200">ACTIVE</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}