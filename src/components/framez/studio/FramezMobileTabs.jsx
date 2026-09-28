import React from 'react';
import { Clapperboard, MessageSquare, Code2 } from 'lucide-react';

/**
 * Phone navigation — one panel at a time so the studio always fits the screen,
 * with the home-indicator inset reserved at the bottom.
 */
export default function FramezMobileTabs({ active, onChange }) {
  const tabs = [
    { id: 'director', label: 'Director', icon: MessageSquare },
    { id: 'film', label: 'Film', icon: Clapperboard },
    { id: 'code', label: 'Code', icon: Code2 }
  ];

  return (
    <div
      className="flex items-center gap-1.5 px-3 pt-2 border-t border-white/10 bg-black/85 backdrop-blur-xl"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[12px] font-semibold transition-colors ${
              on ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}