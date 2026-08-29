import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle } from "lucide-react";
import { TabBar } from "./DocsLayoutDefault";
import DocsHowItWorksBrowser from "./DocsHowItWorksBrowser";

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
      <CreativeHero app={app} docs={docs} onBack={onBack} />
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

function CreativeHero({ app, docs }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-500 opacity-[0.07]" />
      <div className="relative px-5 sm:px-8 pt-6 pb-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
          >
            {app.logo ? (
              <img src={app.logo} alt={app.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-2xl font-[900] text-zinc-500">
                {app.name?.[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-[900] tracking-tight text-zinc-900 leading-tight">{app.name}</h1>
            <p className="text-sm sm:text-[15px] text-zinc-500 mt-1">{docs.tagline}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">{app.cat}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}