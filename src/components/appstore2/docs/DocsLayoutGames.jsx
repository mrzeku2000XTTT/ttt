import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle, Trophy } from "lucide-react";
import DocsHero from "./DocsHero";
import { TabBar } from "./DocsLayoutDefault";
import DocsHowItWorksBrowser from "./DocsHowItWorksBrowser";

// Playful, achievement-style layout for Games.
export default function DocsLayoutGames({ app, docs, activeTab, onTab, onBack }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "features", label: "Features", icon: ListChecks },
    { id: "how", label: "How to Play", icon: Play },
    { id: "start", label: "Jump In", icon: HelpCircle },
  ];

  return (
    <div>
      <DocsHero app={app} docs={docs} onBack={onBack} accent="amber" />
      <TabBar tabs={tabs} active={activeTab} onChange={onTab} />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "overview" && (
            <div className="space-y-5">
              <p className="text-[15px] leading-relaxed text-zinc-700">{docs.overview}</p>
              <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 ring-1 ring-amber-200/60 p-3">
                <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-[12px] text-amber-700">Earn on-chain rewards as you play. Every win settles directly on Kaspa.</p>
              </div>
            </div>
          )}
          {activeTab === "features" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {docs.features.map((f, i) => (
                <motion.div key={i} whileHover={{ y: -2 }} className="rounded-2xl bg-white ring-1 ring-zinc-200/70 p-4 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-400">LVL {i + 1}</div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1">{f.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          )}
          {activeTab === "how" && (
            <DocsHowItWorksBrowser app={app} docs={docs} />
          )}
          {activeTab === "start" && (
            <div className="space-y-3">
              {docs.getStarted.map((s, i) => (
                <div key={i} className="rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 ring-1 ring-amber-200/60 p-4 flex gap-3">
                  <span className="text-2xl">{["🎮", "🏆", "🚀"][i] || "→"}</span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">{s.title}</h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}