import React from "react";
import { KASPA_TEMPLATES } from "@/components/tttbuilder/kaspaTemplates";

export default function TemplateGallery({ onPick, disabled }) {
  return (
    <div className="mt-14 max-w-5xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          Kaspa app templates
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KASPA_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            disabled={disabled}
            className="group text-left p-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
          >
            <div className="text-[13px] font-bold text-zinc-900 leading-tight">{t.name}</div>
            <div className="text-[10px] text-zinc-500 mt-1 leading-snug">{t.blurb}</div>
            <div className="mt-2 inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 group-hover:text-zinc-900">
              {t.tag}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}