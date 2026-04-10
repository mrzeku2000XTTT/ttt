import React from "react";
import { TrendingUp, Trophy, Cloud, Flame, BarChart3 } from "lucide-react";

const categoryIcons = {
  'All': Flame,
  'Sports': Trophy,
  'Crypto': TrendingUp,
  'Weather': Cloud,
};

export default function CategoryTabs({ categories, active, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {categories.map(cat => {
        const Icon = categoryIcons[cat] || BarChart3;
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
                : 'text-white/30 hover:text-white/50 border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat}
          </button>
        );
      })}
    </div>
  );
}