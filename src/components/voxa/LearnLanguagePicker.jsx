import React from "react";
import { LEARN_LANGUAGES } from "./voxaLanguages";

export default function LearnLanguagePicker({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {LEARN_LANGUAGES.map((l) => {
        const active = l.code === value;
        return (
          <button
            key={l.code}
            onClick={() => onChange(l.code)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md transition-all ${
              active
                ? "bg-blue-500/30 border-blue-400/60 text-white shadow-lg shadow-blue-500/20"
                : "bg-white/8 border-white/15 text-white/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            <span className="text-lg">{l.flag}</span>
            <span className="text-sm font-semibold">{l.name}</span>
          </button>
        );
      })}
    </div>
  );
}