import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ListChecks, Play, HelpCircle, ShieldCheck } from "lucide-react";
import DocsHero from "./DocsHero";
import { TabBar } from "./DocsLayoutDefault";

// Light dashboard layout for Finance & Kaspa apps — stats-forward, trust-forward.
export default function DocsLayoutFinance({ app, docs, activeTab, onTab, onBack }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "features", label: "Features", icon: ListChecks },
    { id: "how", label: "How It Works", icon: Play },
    { id: "start", label: "Get Started", icon: HelpCircle },
  ];

  const stats = [
    { label: "Network", value: "Kaspa L1" },
    { label: "Settlement", value: "On-chain" },
    { label: "Self-custody", value: "Your keys" },
    { label: "Type", value: app.cat || "Finance" },
  ];

  return (
    <div>
      <DocsHero app={app} docs={docs} onBack={onBack} accent="emerald" />
      <TabBar tabs={tabs} active={activeTab} onChange={onTab} />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {stats.map((s, i) => (
                  <div key={i} className="rounded-2xl bg-white ring-1 ring-zinc-200/70 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{s.label}</div>
                    <div className="text-[14px] font-bold text-zinc-900 mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-700">{docs.overview}</p>
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/60 p-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-[12px] text-emerald-700">Funds settle on the Kaspa network. You control your keys — TTT never holds them.</p>
              </div>
            </div>
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
            <ol className="space-y-3">
              {docs.howItWorks.map((s, i) => (
                <li key={i} className="rounded-2xl bg-white ring-1 ring-zinc-200/70 p-4 flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
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
                <div key={i} className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/50 p-4 flex gap-3">
                  <span className="text-2xl">{["🔐", "💸", "✅"][i] || "→"}</span>
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