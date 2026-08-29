import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle } from "lucide-react";
import DocsHero from "./DocsHero";
import { TabBar } from "./DocsLayoutDefault";

// Dark, gallery-forward layout for Creative & Media apps.
export default function DocsLayoutCreative({ app, docs, activeTab, onTab, onBack }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "features", label: "Features", icon: ListChecks },
    { id: "how", label: "Workflow", icon: Play },
    { id: "start", label: "Start", icon: HelpCircle },
  ];

  return (
    <div className="bg-zinc-950 text-zinc-100 -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-none">
      <div className="rounded-3xl bg-gradient-to-br from-violet-950/40 via-zinc-950 to-fuchsia-950/30 ring-1 ring-white/10 overflow-hidden">
        <DocsHeroDark app={app} docs={docs} onBack={onBack} />
        <DarkTabBar tabs={tabs} active={activeTab} onChange={onTab} />
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {activeTab === "overview" && (
              <p className="text-[15px] leading-relaxed text-zinc-300">{docs.overview}</p>
            )}
            {activeTab === "features" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {docs.features.map((f, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-4 hover:bg-white/[0.07] transition-colors">
                    <h3 className="text-[14px] font-semibold text-white mb-1">{f.title}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "how" && (
              <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-fuchsia-500 before:to-cyan-500">
                {docs.howItWorks.map((s, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-white">{i + 1}</div>
                    <h3 className="text-[14px] font-semibold text-white mb-0.5">{s.title}</h3>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "start" && (
              <div className="space-y-3">
                {docs.getStarted.map((s, i) => (
                  <div key={i} className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 ring-1 ring-fuchsia-500/20 p-4 flex gap-3">
                    <span className="text-2xl">{["🎬", "🎨", "✨"][i] || "→"}</span>
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">{s.title}</h3>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DocsHeroDark({ app, docs, onBack }) {
  return (
    <div className="relative overflow-hidden px-5 sm:px-8 pt-6 pb-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors mb-5">
        <span>←</span> App Store
      </button>
      <div className="flex items-start gap-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 ring-1 ring-white/20">
          {app.logo ? <img src={app.logo} alt={app.name} className="absolute inset-0 w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10 flex items-center justify-center text-2xl font-[900]">{app.name?.[0]?.toUpperCase()}</div>}
        </motion.div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-[900] tracking-tight text-white leading-tight">{app.name}</h1>
          <p className="text-sm text-zinc-400 mt-1">{docs.tagline}</p>
        </div>
      </div>
    </div>
  );
}

function DarkTabBar({ tabs, active, onChange }) {
  return (
    <div className="sticky top-14 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-3xl mx-auto px-3 sm:px-8 flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${on ? "border-fuchsia-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-200"}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}