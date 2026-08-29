import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle } from "lucide-react";
import DocsHero from "./DocsHero";

// Clean Apple-docs layout — the default for most categories.
export default function DocsLayoutDefault({ app, docs, activeTab, onTab, onBack }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "features", label: "Features", icon: ListChecks },
    { id: "how", label: "How It Works", icon: Play },
    { id: "start", label: "Get Started", icon: HelpCircle },
  ];

  return (
    <div>
      <DocsHero app={app} docs={docs} onBack={onBack} accent="zinc" />
      <TabBar tabs={tabs} active={activeTab} onChange={onTab} />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "overview" && (
            <p className="text-[15px] leading-relaxed text-zinc-700">{docs.overview}</p>
          )}
          {activeTab === "features" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {docs.features.map((f, i) => (
                <div key={i} className="rounded-2xl bg-white ring-1 ring-zinc-200/70 p-4">
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1">{f.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === "how" && (
            <ol className="space-y-4">
              {docs.howItWorks.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-zinc-900">{s.title}</h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {activeTab === "start" && (
            <div className="space-y-3">
              {docs.getStarted.map((s, i) => (
                <div key={i} className="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200/60 p-4 flex gap-3">
                  <span className="text-2xl">{["🚀", "🔗", "✅"][i] || "→"}</span>
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

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="sticky top-14 z-30 bg-[#F5F5F7]/85 backdrop-blur-xl border-b border-zinc-200/60">
      <div className="max-w-3xl mx-auto px-3 sm:px-8 flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                on ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}