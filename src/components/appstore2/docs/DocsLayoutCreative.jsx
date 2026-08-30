import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle } from "lucide-react";
import { TabBar } from "./DocsLayoutDefault";
import DocsHowItWorksBrowser from "./DocsHowItWorksBrowser";
import DocsHero from "./DocsHero";

// Light, gallery-forward layout for Creative & Media apps.
export default function DocsLayoutCreative({ app, docs, activeTab, onTab, onBack }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "features", label: "Features", icon: ListChecks },
    { id: "how", label: "Workflow", icon: Play },
    { id: "start", label: "Start", icon: HelpCircle },
  ];

  return (
    <div>
      <DocsHero app={app} docs={docs} accent="violet" />
      <TabBar tabs={tabs} active={activeTab} onChange={onTab} />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "overview" && (
            <p className="text-[15px] leading-relaxed text-zinc-700">{docs.overview}</p>
          )}
          {activeTab === "features" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {docs.features.map((f, i) => (
                <div key={i} className="rounded-2xl bg-white ring-1 ring-zinc-200/70 p-4 hover:ring-fuchsia-200 transition-colors">
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1">{f.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
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
                <div key={i} className="rounded-2xl bg-gradient-to-r from-fuchsia-50 to-cyan-50 ring-1 ring-fuchsia-200/50 p-4 flex gap-3">
                  <span className="text-2xl">{["🎬", "🎨", "✨"][i] || "→"}</span>
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