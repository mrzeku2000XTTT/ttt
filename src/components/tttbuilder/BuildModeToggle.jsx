import React from "react";
import { FileCode, Atom } from "lucide-react";

const MODES = [
  { id: "html", label: "HTML", icon: FileCode, hint: "Vanilla HTML/CSS/JS — renders instantly in Preview" },
  { id: "react", label: "React", icon: Atom, hint: "Real npm project (Vite/React/Node) — runs in the Live sandbox" },
];

export default function BuildModeToggle({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1 bg-[#F0F0F2] rounded-lg p-0.5 border border-black/[0.06]">
      {MODES.map(m => {
        const Icon = m.icon;
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-40 ${
              active ? "bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <Icon className="w-3 h-3" /> {m.label}
          </button>
        );
      })}
    </div>
  );
}