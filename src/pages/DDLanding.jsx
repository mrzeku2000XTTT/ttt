import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DDLogo from "@/components/dd/DDLogo";
import { Search, Plus, Mic, Calendar as CalIcon, FileText, Mail as MailIcon, Check } from "lucide-react";

const APP_ICONS = [
  { letter: "G", color: "bg-rose-50 text-rose-500", name: "Gmail" },
  { letter: "C", color: "bg-sky-50 text-sky-500", name: "Calendar" },
  { letter: "D", color: "bg-amber-50 text-amber-500", name: "Drive" },
  { letter: "S", color: "bg-violet-50 text-violet-500", name: "Slack" },
  { letter: "N", color: "bg-neutral-100 text-neutral-700", name: "Notion" },
  { letter: "O", color: "bg-blue-50 text-blue-500", name: "Outlook" },
  { letter: "M", color: "bg-emerald-50 text-emerald-500", name: "Microsoft" },
];

const FEATURES = [
  { title: "One AI layer across everything.", desc: "Ask DD anything. It understands your apps, your data, and your context." },
  { title: "Connect once. Work everywhere.", desc: "Connect your tools once and DD keeps everything in sync, always." },
  { title: "Automate. Organize. Achieve more.", desc: "Let DD handle the busywork so you can focus on what matters." },
];

function NavBtn({ children, primary }) {
  return <button className={`h-9 px-4 rounded-lg text-sm font-medium transition ${primary ? "bg-neutral-900 text-white hover:bg-neutral-800" : "text-neutral-700 hover:bg-neutral-100"}`}>{children}</button>;
}

export default function DDLanding() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-neutral-900">
      {/* Nav */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <DDLogo size={30} animate={false} />
          <nav className="hidden md:flex items-center gap-7 text-sm text-neutral-600">
            <a className="hover:text-neutral-900" href="#product">Product</a>
            <a className="hover:text-neutral-900" href="#integrations">Integrations</a>
            <Link to="/DD" className="hover:text-neutral-900">DD Store</Link>
            <a className="hover:text-neutral-900" href="#pricing">Pricing</a>
            <a className="hover:text-neutral-900" href="#resources">Resources</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/DD"><NavBtn>Sign in</NavBtn></Link>
            <Link to="/DD"><NavBtn primary>Get Started</NavBtn></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> All your tools. One intelligent workspace.
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }} className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Every tool.<br />One <span className="text-violet-600">intelligent</span> workspace.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="mt-5 max-w-xl mx-auto text-neutral-500 text-base sm:text-lg leading-relaxed">
          Connect the tools you already use. Let DD organize them, operate them, and help you get things done.
        </motion.p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link to="/DD"><NavBtn primary>Get Started</NavBtn></Link>
          <Link to="/DD"><NavBtn>Explore DD</NavBtn></Link>
        </div>
      </section>

      {/* Connected apps */}
      <section id="integrations" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
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
      <section id="product" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-neutral-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4"><span className="text-violet-600 text-lg">✦</span></div>
              <h3 className="font-semibold text-neutral-900">{f.title}</h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-violet-100/70 to-white border border-violet-200 p-10 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">All your tools. One intelligent workspace.</h2>
          <p className="text-neutral-500 mt-3">Build your ultimate productivity system.</p>
          <Link to="/DD" className="inline-flex items-center gap-2 mt-6 h-11 px-6 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800">Build your workspace →</Link>
        </div>
      </section>

      <footer id="resources" className="border-t border-neutral-200 py-10 text-center text-sm text-neutral-400">DD — Every tool. One intelligent workspace.</footer>
    </div>
  );
}