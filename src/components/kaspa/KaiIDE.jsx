import React, { useState } from "react";
import { motion } from "framer-motion";
import KaiIDETab from "./KaiIDETab";

const TABS = [
  { key: "plan", label: "📋 Plan" },
  { key: "entities", label: "🗄️ Entities" },
  { key: "pages", label: "📄 Pages" },
  { key: "functions", label: "⚙️ Functions" },
  { key: "deploy", label: "🚀 Deploy" },
];

export default function KaiIDE({ ideData }) {
  const [activeTab, setActiveTab] = useState("plan");

  if (!ideData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden max-w-[95%]"
      style={{
        background: "rgba(15, 15, 25, 0.95)",
        border: "1px solid rgba(6,182,212,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.1)",
      }}
    >
      {/* IDE header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "rgba(6,182,212,0.08)", borderBottom: "1px solid rgba(6,182,212,0.15)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] font-bold text-cyan-400 tracking-wide">KAI IDE</span>
        </div>
        <span className="text-[9px] font-mono text-white/30">{ideData.app_name || "app"}</span>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto scrollbar-hide" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          // Count items for badge
          let count = 0;
          if (tab.key === "entities") count = (ideData.entities || []).length;
          if (tab.key === "pages") count = (ideData.pages || []).length;
          if (tab.key === "functions") count = (ideData.functions || []).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-shrink-0 px-3 py-2 text-[10px] font-bold transition-all relative whitespace-nowrap"
              style={{
                background: isActive ? "rgba(6,182,212,0.12)" : "transparent",
                color: isActive ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)",
                borderBottom: isActive ? "2px solid rgba(6,182,212,0.8)" : "2px solid transparent",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1 px-1 py-0 rounded text-[8px]" style={{ background: "rgba(6,182,212,0.2)", color: "rgba(6,182,212,0.8)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-hide">
        <KaiIDETab tab={activeTab} data={ideData} />
      </div>
    </motion.div>
  );
}