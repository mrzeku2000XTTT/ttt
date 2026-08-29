import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle, Cpu } from "lucide-react";
import DocsHero from "./DocsHero";
import { TabBar } from "./DocsLayoutDefault";
import DocsHowItWorksBrowser from "./DocsHowItWorksBrowser";

// Neural/terminal aesthetic for AI apps.
export default function DocsLayoutAI({ app, docs, activeTab, onTab, onBack }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "features", label: "Capabilities", icon: ListChecks },
    { id: "how", label: "The Loop", icon: Play },
    { id: "start", label: "Deploy", icon: HelpCircle },
  ];

  return (
    <div>
      <DocsHero app={app} docs={docs} onBack={onBack} accent="cyan" />
      <TabBar tabs={tabs} active={activeTab} onChange={onTab} />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-2xl bg-cyan-50 ring-1 ring-cyan-200/60 p-3">
                <Cpu className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <p className="text-[12px] text-cyan-700 font-mono">agent ready · tools loaded · awaiting task</p>
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-700">{docs.overview}</p>
            </div>
          )}
          {activeTab === "features" && (
            <div className="space-y-2.5">
              {docs.features.map((f, i) => (
                <div key={i} className="rounded-2xl bg-white ring-1 ring-zinc-200/70 p-4 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center flex-shrink-0 font-mono text-[12px] font-bold">{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">{f.title}</h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "how" && (
            <DocsHowItWorksBrowser app={app} docs={docs} />
          )}
          {activeTab === "start" && (
            <div className="space-y-3">
              {docs.getStarted.map((s, i) => (
                <div key={i} className="rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 ring-1 ring-cyan-200/50 p-4 flex gap-3">
                  <span className="text-2xl">{["🤖", "⚙️", "🚀"][i] || "→"}</span>
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