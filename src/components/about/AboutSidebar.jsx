import React from "react";
import { motion } from "framer-motion";
import { ABOUT_TABS } from "./aboutData";

export default function AboutSidebar({ active, onChange }) {
  return (
    <nav className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible scrollbar-hide pb-1 sm:pb-0">
      {ABOUT_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
              isActive ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="about-tab-bg"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-400/10 ring-1 ring-emerald-400/30"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className={`relative w-4 h-4 ${isActive ? "text-emerald-300" : ""}`} />
            <span className="relative text-[13px] font-medium tracking-tight whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}