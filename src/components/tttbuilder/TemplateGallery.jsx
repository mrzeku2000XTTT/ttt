import React from "react";
import { KASPA_TEMPLATES } from "@/components/tttbuilder/kaspaTemplates";

export default function TemplateGallery({ onPick, disabled }) {
  return (
    <div className="mt-14 max-w-5xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-xs font-black tracking-widest text-white/40 uppercase">
          Kaspa app templates
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KASPA_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            disabled={disabled}
            className="group text-left p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#70C7BA]/50 hover:bg-[#70C7BA]/[0.06] disabled:opacity-40 transition-colors"
          >
            <div className="text-xl mb-1.5">{t.emoji}</div>
            <div className="text-[13px] font-bold text-white leading-tight">{t.name}</div>
            <div className="text-[10px] text-white/40 mt-1 leading-snug">{t.blurb}</div>
            <div className="mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/40 group-hover:text-[#70C7BA]">
              {t.tag}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}