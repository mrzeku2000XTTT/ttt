import React from "react";
import { MessageSquare, Layers, SlidersHorizontal } from "lucide-react";

/**
 * Pill-style tab switcher (Chat / Content / Controls) — matches the screenshot.
 */
export default function FrameZTabs({ active, onChange }) {
  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "content", label: "Content", icon: Layers },
    { id: "controls", label: "Controls", icon: SlidersHorizontal },
  ];

  return (
    <div className="px-3 pt-3">
      <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}