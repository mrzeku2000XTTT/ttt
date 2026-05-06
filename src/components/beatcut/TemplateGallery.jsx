import React from "react";
import { TEMPLATES } from "./beatcutTemplates";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateGallery({ selectedId, onSelect }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/60">Vibe</div>
        <div className="text-[10px] text-white/40">{TEMPLATES.length} templates</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TEMPLATES.map((t) => {
          const active = selectedId === t.id;
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(t.id)}
              className={`relative overflow-hidden rounded-xl p-3 text-left transition-all ${active ? "ring-2 ring-white shadow-lg" : "ring-1 ring-white/10 hover:ring-white/30"}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.accent} ${active ? "opacity-100" : "opacity-70"}`} />
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-[13px] font-black text-white tracking-tight">{t.label}</span>
                  {active && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="text-[9px] text-white/80 leading-tight font-medium">{t.vibe}</div>
                <div className="text-[8px] text-white/60 mt-1 font-mono">{t.bpmRange[0]}–{t.bpmRange[1]} BPM</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}