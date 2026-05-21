import React from "react";
import { Moon, Sun } from "lucide-react";

export default function StoryboardModeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black backdrop-blur-2xl transition ${
        isDark
          ? "border-white/15 bg-white/10 text-white shadow-2xl shadow-black/40 hover:bg-white/15"
          : "border-zinc-200 bg-white/80 text-zinc-900 shadow-lg shadow-zinc-200/60 hover:bg-white"
      }`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? "Cream mode" : "Dark glass mode"}
    </button>
  );
}