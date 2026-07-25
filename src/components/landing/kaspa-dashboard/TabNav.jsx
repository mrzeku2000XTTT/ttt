import React from "react";
import { LayoutGrid, ArrowUpRight, ArrowDownLeft, BarChart3, Bot, Settings } from "lucide-react";
import { IOS_FONT } from "./shared";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "send", label: "Send", icon: ArrowUpRight },
  { id: "receive", label: "Receive", icon: ArrowDownLeft },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "ai", label: "AI", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function TabNav({ activeTab, onChange }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-5 pb-1.5" style={{ fontFamily: IOS_FONT }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all active:scale-95 ${
              isActive ? "text-black" : "text-white/45 hover:text-white/80"
            }`}
            style={{
              background: isActive
                ? "linear-gradient(135deg, #fbf3c4 0%, #e8c87a 45%, #d4af37 100%)"
                : "rgba(255,255,255,0.025)",
              border: `1px solid ${isActive ? "rgba(212,175,55,0.6)" : "rgba(212,175,55,0.12)"}`,
              boxShadow: isActive ? "0 2px 14px rgba(212,175,55,0.28)" : "none",
            }}>
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}