import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Sparkles, Brain, Mail, GitBranch,
  Play, Repeat, Wand2, Telescope, MessageSquarePlus,
} from "lucide-react";
import { NODE_LOGOS, NODA_LOGO } from "@/components/rmx/nodeLogos";

const FEATURE_NODES = [
  { logo: NODE_LOGOS.ai_prompt,    label: "AI Prompt",    from: "#a855f7", to: "#ec4899" },
  { logo: NODE_LOGOS.ai_image,     label: "AI Image",     from: "#06b6d4", to: "#3b82f6" },
  { logo: NODE_LOGOS.deep_research,label: "Research",     from: "#10b981", to: "#14b8a6" },
  { logo: NODE_LOGOS.read_ttt_feed,label: "TTT Feed",     from: "#d946ef", to: "#a855f7" },
  { logo: NODE_LOGOS.send_email,   label: "Send Email",   from: "#f59e0b", to: "#f97316" },
  { logo: NODE_LOGOS.send_to_x,    label: "Post to X",    from: "#0ea5e9", to: "#2563eb" },
  { logo: NODE_LOGOS.post_to_ttt,  label: "Post to TTT",  from: "#d946ef", to: "#ec4899" },
  { logo: NODE_LOGOS.webhook,      label: "Webhook",      from: "#f43f5e", to: "#ef4444" },
  { logo: NODE_LOGOS.delay,        label: "Delay",        from: "#71717a", to: "#52525b" },
  { logo: NODE_LOGOS.filter,       label: "Filter",       from: "#10b981", to: "#22c55e" },
  { logo: NODE_LOGOS.branch,       label: "Branch",       from: "#eab308", to: "#f59e0b" },
  { logo: NODE_LOGOS.save_data,    label: "Save Data",    from: "#6366f1", to: "#8b5cf6" },
];

const STEPS = [
  {
    n: "01",
    title: "Describe it",
    desc: "Tell the AI Brain what you want — it picks the steps for you.",
    icon: Brain,
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    n: "02",
    title: "Connect nodes",
    desc: "Chain prompts, images, emails, and webhooks into a sequence.",
    icon: GitBranch,
    color: "from-cyan-500 to-blue-500",
  },
  {
    n: "03",
    title: "Run on autopilot",
    desc: "One click runs every step — or toggle Auto to run on every change.",
    icon: Play,
    color: "from-emerald-500 to-green-500",
  },
];

export default function NODALandingPage() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#05060f] text-white">
      {/* Animated gradient backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60 transition-all duration-[1500ms]"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(168, 85, 247, 0.18), transparent 50%), radial-gradient(900px circle at ${(1 - mouse.x) * 100}% ${(1 - mouse.y) * 100}%, rgba(6, 182, 212, 0.18), transparent 50%)`,
        }}
      />
      {/* Grain */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      {/* Top nav */}
      <nav className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-4">
        <Link
          to="/AppStoreV2"
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Apps
        </Link>
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg shadow-cyan-500/40">
            <img src={NODA_LOGO} alt="NODA" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-black text-base tracking-[0.2em]">NODA</span>
        </div>
        <Link
          to="/NODAStudio"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all"
        >
          Open Studio <ArrowRight className="w-3 h-3" />
        </Link>
      </nav>

      {/* Hero — centered, logo-led */}
      <section className="relative z-10 px-5 sm:px-8 pt-8 sm:pt-12 pb-20 max-w-5xl mx-auto text-center">
        {/* Giant glowing NODA logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, type: "spring", damping: 14 }}
          className="relative mx-auto mb-8 sm:mb-10"
          style={{ width: "fit-content" }}
        >
          {/* Pulsing color halo */}
          <motion.div
            className="absolute inset-0 rounded-full blur-[60px]"
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.95, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(circle, rgba(6,182,212,0.7), rgba(168,85,247,0.6) 50%, transparent 75%)",
            }}
          />
          {/* Soft outer ring */}
          <motion.div
            className="absolute -inset-6 rounded-full border border-cyan-400/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ borderStyle: "dashed" }}
          />
          {/* Logo */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] overflow-hidden ring-2 ring-white/15 shadow-2xl shadow-cyan-500/40">
            <img src={NODA_LOGO} alt="NODA" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md"
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75" />
            <span className="relative rounded-full w-1.5 h-1.5 bg-cyan-300" />
          </span>
          <Sparkles className="w-3 h-3 text-cyan-300" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/70">
            Node Workflow Engine · Live
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-6xl sm:text-7xl lg:text-[8.5rem] font-black tracking-[-0.04em] leading-[0.88] mb-6"
        >
          Workflows
          <br />
          <span className="relative inline-block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            that think.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-white/60 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
        >
          NODA chains AI prompts, images, research, emails, social posts and webhooks into one-click automations.
          Describe what you want — the <span className="text-white font-semibold">AI Brain</span> wires it up for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/NODAStudio"
            className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white font-bold text-sm shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:scale-[1.02]"
          >
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Play className="relative w-4 h-4 fill-white" />
            <span className="relative">Launch NODA</span>
            <ArrowRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/NODAStudio"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-sm transition-all backdrop-blur-md"
          >
            <Wand2 className="w-4 h-4" /> Try the Brain
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-white/40 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-400" /> No-code · drag, configure, run
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-400" /> 12 ready nodes
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-purple-400" /> APEX-sealed runs
          </div>
        </motion.div>
      </section>

      {/* Node showcase as separate band */}
      <section className="relative z-10 px-5 sm:px-8 pb-24 max-w-6xl mx-auto">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-5"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-white/40">
              12 nodes · plug-and-play
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {FEATURE_NODES.map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.04, type: "spring", stiffness: 200 }}
                whileHover={{ y: -6, scale: 1.06 }}
                className="group relative"
              >
                {/* Outer halo */}
                <div
                  className="absolute -inset-1 rounded-3xl blur-2xl opacity-30 group-hover:opacity-70 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${n.from}, ${n.to})` }}
                />
                {/* Tile */}
                <div className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 shadow-2xl bg-zinc-950 transition-all">
                  <img
                    src={n.logo}
                    alt={n.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Top sheen */}
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  {/* Bottom label on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] sm:text-[11px] font-black text-white tracking-wide">{n.label}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-5 sm:px-8 py-20 max-w-6xl mx-auto border-t border-white/5">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-cyan-300/80 mb-3 block">
              How it works
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">From idea to flow.</h2>
            <p className="text-white/50 text-sm sm:text-base max-w-xl">
              Three steps. No code. No setup.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-5 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                  <Icon className="relative w-5 h-5 text-white" />
                </div>
                <div className="text-white/30 font-mono text-xs mb-1">{step.n}</div>
                <h3 className="text-white font-black text-lg mb-1.5">{step.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="relative z-10 px-5 sm:px-8 py-20 max-w-6xl mx-auto border-t border-white/5">
        <div className="mb-12">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-purple-300/80 mb-3 block">
            What's inside
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Built for makers.</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeatureCard
            icon={Brain}
            title="AI Brain"
            desc="Describe your goal in plain English. AI maps it to the right nodes with the right configs — instantly."
            gradient="from-fuchsia-500 to-pink-500"
          />
          <FeatureCard
            icon={Repeat}
            title="Auto-run"
            desc="Toggle Auto and your workflow re-runs the moment you tweak any node — feedback at the speed of thought."
            gradient="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon={MessageSquarePlus}
            title="Post anywhere"
            desc="Push generated text + images straight to the TTT feed or X with one click. Zero copy-paste."
            gradient="from-fuchsia-500 to-purple-500"
          />
          <FeatureCard
            icon={Mail}
            title="Smart email"
            desc="Email steps auto-embed images from previous AI Image nodes. Markdown converts to HTML automatically."
            gradient="from-amber-500 to-orange-500"
          />
          <FeatureCard
            icon={Telescope}
            title="Deep research"
            desc="Two-phase web research — discovery + synthesis — produces full markdown reports with live sources."
            gradient="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon={Sparkles}
            title="Stack anything"
            desc="Mix LLM prompts, image generation, webhooks, delays, filters, social posts and saved data into one flow."
            gradient="from-cyan-500 to-blue-500"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-5 sm:px-8 py-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-10 sm:p-16 rounded-[2rem] bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-xl overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />

          <h2 className="relative text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Ready to <span className="bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">automate?</span>
          </h2>
          <p className="relative text-white/60 text-sm sm:text-lg max-w-md mx-auto mb-8">
            Open the studio. Build your first workflow in under a minute.
          </p>
          <Link
            to="/NODAStudio"
            className="relative group inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white font-bold text-sm shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            Launch NODA
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        <div className="text-white/30 text-xs mt-10 font-medium">
          NODA · Node Workflow Engine
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, gradient }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all overflow-hidden"
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
      <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4 overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
        <Icon className="relative w-5 h-5 text-white" />
      </div>
      <h3 className="relative text-white font-black text-lg mb-1.5">{title}</h3>
      <p className="relative text-white/55 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}