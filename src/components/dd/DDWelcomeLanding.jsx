import React from "react";
import { motion } from "framer-motion";
import DDLogo from "@/components/dd/DDLogo";
import { ArrowRight, Check } from "lucide-react";

const APP_ICONS = [
  { letter: "G", color: "bg-rose-50 text-rose-500", name: "Gmail" },
  { letter: "C", color: "bg-sky-50 text-sky-500", name: "Calendar" },
  { letter: "D", color: "bg-amber-50 text-amber-500", name: "Drive" },
  { letter: "S", color: "bg-violet-50 text-violet-500", name: "Slack" },
  { letter: "N", color: "bg-neutral-100 text-neutral-700", name: "Notion" },
];

const FEATURES = [
  { title: "One AI layer across everything.", desc: "Ask DD anything. It understands your apps, your data, and your context." },
  { title: "Connect once. Work everywhere.", desc: "Connect your tools once and DD keeps everything in sync, always." },
  { title: "Automate. Organize. Achieve more.", desc: "Let DD handle the busywork so you can focus on what matters." },
];

/**
 * DDWelcomeLanding — shown right after onboarding completes.
 * A gorgeous landing page with a "Launch DD" button that enters the workspace.
 */
export default function DDWelcomeLanding({ onLaunch }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] text-neutral-900 overflow-y-auto">
      {/* Nav */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <DDLogo size={30} animate={false} />
          <div className="flex items-center gap-2">
            <button onClick={onLaunch} className="h-9 px-4 rounded-lg text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-2">
              Launch DD <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> You're all set up
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="mt-8 flex justify-center">
          <DDLogo size={72} animate={true} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Welcome to DD
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.22 }} className="mt-5 max-w-xl mx-auto text-neutral-500 text-base sm:text-lg leading-relaxed">
          Your intelligent workspace is ready. Connect your tools, ask DD anything, and let it organize your day.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }} className="mt-8">
          <button onClick={onLaunch} className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-neutral-900 text-white text-base font-semibold hover:bg-neutral-800 transition shadow-lg shadow-neutral-900/10">
            Launch DD <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-3 text-xs text-neutral-400">Your wallet and preferences are saved on this device</p>
        </motion.div>
      </section>

      {/* Connected apps */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your tools. Your workspace.</h2>
        <p className="text-neutral-500 mt-3 max-w-lg mx-auto">Connect the apps you love and bring everything into one beautiful, AI-powered workspace.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {APP_ICONS.concat([{ letter: "+", color: "bg-neutral-100 text-neutral-500", name: "100 more" }]).map((a) => (
            <div key={a.name} className="flex flex-col items-center gap-1.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold ${a.color}`}>{a.letter}</div>
              <span className="text-[10px] text-neutral-400">{a.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-white border border-neutral-200 rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mb-4">
                <Check className="w-5 h-5 text-neutral-700" />
              </div>
              <h3 className="font-semibold text-neutral-900">{f.title}</h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-20">
        <div className="rounded-3xl bg-neutral-900 p-10 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Ready to get things done?</h2>
          <p className="text-neutral-400 mt-3">Launch your workspace and start organizing your day.</p>
          <button onClick={onLaunch} className="inline-flex items-center gap-2 mt-6 h-11 px-6 rounded-xl bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-100 transition">
            Launch DD <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}