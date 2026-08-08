import React from "react";
import { KASPA_TEMPLATES } from "@/components/tttbuilder/kaspaTemplates";

export default function TemplateGallery({ onPick, disabled }) {
  return (
    <div className="mt-20 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-medium tracking-wide text-zinc-400 text-center">
          Or start from a template
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KASPA_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            disabled={disabled}
            className="group text-left p-4 rounded-2xl bg-white border border-zinc-200/60 hover:border-zinc-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] disabled:opacity-40 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center text-lg mb-3 transition-colors duration-200">
              {t.emoji}
            </div>
            <div className="text-[13px] font-semibold text-zinc-900 leading-tight">{t.name}</div>
            <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{t.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}