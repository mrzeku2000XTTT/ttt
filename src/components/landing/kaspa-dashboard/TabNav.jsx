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
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-5 pb-1" style={{ fontFamily: IOS_FONT }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
              isActive ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
            style={{
              background: isActive ? "#0A84FF" : "rgba(28,28,30,0.6)",
              border: `1px solid ${isActive ? "rgba(10,132,255,0.4)" : "rgba(255,255,255,0.08)"}`,
            }}>
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}