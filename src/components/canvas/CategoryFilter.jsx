import React from "react";
import { Layout, Monitor, ShoppingBag, Briefcase, BookOpen, Cloud, Smartphone, Settings } from "lucide-react";

const CATEGORIES = [
  { id: "All", icon: Layout, label: "All" },
  { id: "Landing Page", icon: Monitor, label: "Landing" },
  { id: "Dashboard", icon: Settings, label: "Dashboard" },
  { id: "E-Commerce", icon: ShoppingBag, label: "E-Commerce" },
  { id: "Portfolio", icon: Briefcase, label: "Portfolio" },
  { id: "Blog", icon: BookOpen, label: "Blog" },
  { id: "SaaS", icon: Cloud, label: "SaaS" },
  { id: "Mobile App", icon: Smartphone, label: "Mobile" },
  { id: "Admin Panel", icon: Settings, label: "Admin" },
];

const STYLES = ["All", "Minimal", "Bold", "Glassmorphism", "Dark Mode", "Gradient", "Retro", "Corporate"];

export default function CategoryFilter({ activeCategory, onCategoryChange, activeStyle, onStyleChange }) {
  return (
    <div className="space-y-3 px-4 py-3 border-b border-white/[0.04]">
      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                  : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Styles */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STYLES.map(style => {
          const isActive = activeStyle === style;
          return (
            <button
              key={style}
              onClick={() => onStyleChange(style)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                  : 'text-white/30 border border-transparent hover:text-white/50'
              }`}
            >
              {style}
            </button>
          );
        })}
      </div>
    </div>
  );
}