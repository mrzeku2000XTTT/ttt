import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Sparkles, Brain, Mail, GitBranch,
  Play, Repeat, Wand2, Telescope, MessageSquarePlus,
} from "lucide-react";
import { NODE_LOGOS, NODA_LOGO } from "@/components/rmx/nodeLogos";

const FEATURE_NODES = [
  { logo: NODE_LOGOS.ai_prompt,     label: "AI Prompt" },
  { logo: NODE_LOGOS.ai_image,      label: "AI Image" },
  { logo: NODE_LOGOS.deep_research, label: "Research" },
  { logo: NODE_LOGOS.read_ttt_feed, label: "TTT Feed" },
  { logo: NODE_LOGOS.send_email,    label: "Send Email" },
  { logo: NODE_LOGOS.send_to_x,     label: "Post to X" },
  { logo: NODE_LOGOS.post_to_ttt,   label: "Post to TTT" },
  { logo: NODE_LOGOS.webhook,       label: "Webhook" },
  { logo: NODE_LOGOS.delay,         label: "Delay" },
  { logo: NODE_LOGOS.filter,        label: "Filter" },
  { logo: NODE_LOGOS.branch,        label: "Branch" },
  { logo: NODE_LOGOS.save_data,     label: "Save Data" },
];

const STEPS = [
  {
    n: "01",
    title: "Describe it",
    desc: "Tell the AI Brain what you want — it picks the steps for you.",
    logo: NODE_LOGOS.ai_prompt,
  },
  {
    n: "02",
    title: "Connect nodes",
    desc: "Chain prompts, images, emails, and webhooks into a sequence.",
    logo: NODE_LOGOS.branch,
  },
  {
    n: "03",
    title: "Run on autopilot",
    desc: "One click runs every step — or toggle Auto to run on every change.",
    logo: NODE_LOGOS.delay,
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
      {/* Soft monochrome backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70 transition-all duration-[1500ms]"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,0.06), transparent 55%), radial-gradient(900px circle at ${(1 - mouse.x) * 100}% ${(1 - mouse.y) * 100}%, rgba(255,255,255,0.04), transparent 55%)`,
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
          <img src={NODA_LOGO} alt="NODA" className="w-8 h-8 object-contain" />
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
        {/* Giant NODA logo — transparent silver glass, no circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, type: "spring", damping: 14 }}
          className="relative mx-auto mb-8 sm:mb-10 w-32 h-32 sm:w-44 sm:h-44"
        >
          {/* Soft neutral glow under the logo (no rainbow, no ring) */}
          <motion.div
            className="absolute inset-0 blur-[50px]"
            animate={{ opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)",
            }}
          />
          <img
            src={NODA_LOGO}
            alt="NODA"
            className="relative w-full h-full object-contain drop-shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
          />
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
          <span className="relative inline-block bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
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
            className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-b from-white to-zinc-200 text-black font-bold text-sm shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all hover:scale-[1.02]"
          >
            <Play className="relative w-4 h-4 fill-black" />
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
            <div className="w-1 h-1 rounded-full bg-white/60" /> No-code · drag, configure, run
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-white/60" /> 12 ready nodes
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-white/60" /> APEX-sealed runs
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
                {/* Soft neutral halo */}
                <div className="absolute -inset-1 rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-white/20" />
                {/* Glass tile */}
                <div className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/25 bg-white/[0.03] backdrop-blur-md transition-all flex items-center justify-center p-4">
                  <img
                    src={n.logo}
                    alt={n.label}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {/* Bottom label on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black via-black/70 to-transparent flex items-end justify-center pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-white/50 mb-3 block">
              How it works
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">From idea to flow.</h2>
            <p className="text-white/50 text-sm sm:text-base max-w-xl">
              Three steps. No code. No setup.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all"
            >
              <div className="w-14 h-14 mb-5 flex items-center justify-center">
                <img src={step.logo} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="text-white/30 font-mono text-xs mb-1">{step.n}</div>
              <h3 className="text-white font-black text-lg mb-1.5">{step.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="relative z-10 px-5 sm:px-8 py-20 max-w-6xl mx-auto border-t border-white/5">
        <div className="mb-12">
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-white/50 mb-3 block">
            What's inside
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Built for makers.</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeatureCard
            logo={NODE_LOGOS.ai_prompt}
            title="AI Brain"
            desc="Describe your goal in plain English. AI maps it to the right nodes with the right configs — instantly."
          />
          <FeatureCard
            logo={NODE_LOGOS.delay}
            title="Auto-run"
            desc="Toggle Auto and your workflow re-runs the moment you tweak any node — feedback at the speed of thought."
          />
          <FeatureCard
            logo={NODE_LOGOS.post_to_ttt}
            title="Post anywhere"
            desc="Push generated text + images straight to the TTT feed or X with one click. Zero copy-paste."
          />
          <FeatureCard
            logo={NODE_LOGOS.send_email}
            title="Smart email"
            desc="Email steps auto-embed images from previous AI Image nodes. Markdown converts to HTML automatically."
          />
          <FeatureCard
            logo={NODE_LOGOS.deep_research}
            title="Deep research"
            desc="Two-phase web research — discovery + synthesis — produces full markdown reports with live sources."
          />
          <FeatureCard
            logo={NODE_LOGOS.branch}
            title="Stack anything"
            desc="Mix LLM prompts, image generation, webhooks, delays, filters, social posts and saved data into one flow."
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
          className="relative p-10 sm:p-16 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl" />

          <h2 className="relative text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Ready to <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">automate?</span>
          </h2>
          <p className="relative text-white/60 text-sm sm:text-lg max-w-md mx-auto mb-8">
            Open the studio. Build your first workflow in under a minute.
          </p>
          <Link
            to="/NODAStudio"
            className="relative group inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-b from-white to-zinc-200 text-black font-bold text-sm shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-black" />
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

function FeatureCard({ logo, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
        <img src={logo} alt="" className="w-full h-full object-contain" />
      </div>
      <h3 className="relative text-white font-black text-lg mb-1.5">{title}</h3>
      <p className="relative text-white/55 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}