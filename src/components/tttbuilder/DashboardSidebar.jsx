import React from "react";
import { Home, Code2, Server, Bot, Database, Brain, Settings, ChevronRight } from "lucide-react";

const ITEMS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "code", label: "Code", icon: Code2 },
  { id: "live", label: "Live", icon: Server },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "database", label: "Database", icon: Database },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({ active, onChange, fileCount = 0 }) {
  return (
    <div className="h-full flex flex-col bg-[#F0F0F2] border-r border-black/[0.06]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#0051D5] flex items-center justify-center">
            <span className="text-white font-black text-xs">D</span>
          </div>
          <span className="font-semibold text-sm text-[#1D1D1F] tracking-tight">Dashboard</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-[#007AFF] text-white shadow-[0_1px_3px_rgba(0,122,255,0.3)]"
                  : "text-[#6B7280] hover:text-[#1D1D1F] hover:bg-black/[0.04]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "code" && fileCount > 0 && (
                <span className={`text-[10px] font-bold ${isActive ? "text-white/60" : "text-[#86868B]"}`}>{fileCount}</span>
              )}
              {isActive && <ChevronRight className="w-3 h-3 text-white/60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-black/[0.06]">
        <div className="text-[10px] text-[#86868B] leading-relaxed">
          Keys generated locally.
          <br />
          Never sent to any server.
        </div>
      </div>
    </div>
  );
}