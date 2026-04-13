import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Zap, Shield, Globe, Users, Layers,
  Rocket, Star, ChevronDown, ExternalLink, ArrowUpRight
} from "lucide-react";

const ROADMAP = [
  {
    phase: "Phase 1",
    title: "Foundation",
    status: "completed",
    items: [
      "TTT Feed & Social Layer",
      "Agent ZK Identity System",
      "Kaspa L1 Bridge Integration",
      "Encrypted Notepad & Stamps",
      "KRC-20 Tipping Engine",
    ],
  },
  {
    phase: "Phase 2",
    title: "Growth",
    status: "completed",
    items: [
      "TTTV Media Browser",
      "DAGKnight Wallet",
      "Bull Reels & Community Badges",
      "StakeDAG Prediction Markets",
      "Grokipedia Knowledge Layer",
    ],
  },
  {
    phase: "Phase 3",
    title: "Expansion",
    status: "active",
    items: [
      "TTT 2.0 Light Mode Interface",
      "Agent ZK Marketplace",
      "On-chain Governance Voting",
      "Cross-chain KRC-20 Swaps",
      "AI-Powered Content Curation",
    ],
  },
  {
    phase: "Phase 4",
    title: "Vision",
    status: "upcoming",
    items: [
      "Decentralized App Store",
      "ZK-Proof Identity Verification",
      "Mobile Native Experience",
      "DAO Treasury Management",
      "Developer SDK & API Platform",
    ],
  },
];

const FEATURES = [
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second finality powered by Kaspa's blockDAG architecture." },
  { icon: Shield, title: "ZK Identity", desc: "Cryptographic identity verification without compromising privacy." },
  { icon: Globe, title: "Cross-Chain", desc: "Seamless bridging between L1 and L2 ecosystems." },
  { icon: Users, title: "Community First", desc: "Built by and for the community with transparent governance." },
  { icon: Layers, title: "Modular", desc: "Composable modules that developers can extend and build upon." },
  { icon: Rocket, title: "Scalable", desc: "Designed to handle millions of users without compromise." },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const dur = 1500;
    const step = Math.ceil(end / (dur / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { start = end; clearInterval(timer); }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function RoadmapCard({ phase, index }) {
  const statusColors = {
    completed: "bg-emerald-500",
    active: "bg-cyan-500",
    upcoming: "bg-white/20",
  };

  const statusBorder = {
    completed: "border-emerald-500/30",
    active: "border-cyan-500/40 shadow-lg shadow-cyan-500/10",
    upcoming: "border-zinc-300/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className={`relative bg-white rounded-2xl border ${statusBorder[phase.status]} p-6 md:p-8`}
    >
      {phase.status === "active" && (
        <div className="absolute -top-3 right-6">
          <span className="px-3 py-1 text-xs font-bold bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/30">
            CURRENT
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className={`w-3 h-3 rounded-full ${statusColors[phase.status]} ${phase.status === 'active' ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">{phase.phase}</span>
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-zinc-900 mb-4">{phase.title}</h3>

      <ul className="space-y-3">
        {phase.items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 + i * 0.07 }}
            className="flex items-start gap-3"
          >
            {phase.status === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : phase.status === "active" ? (
              <div className="w-4 h-4 rounded-full border-2 border-cyan-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-zinc-300 mt-0.5 flex-shrink-0" />
            )}
            <span className={`text-sm leading-relaxed ${phase.status === 'completed' ? 'text-zinc-500' : 'text-zinc-700'}`}>
              {item}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function TTTV2Page() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-zinc-900 overflow-x-hidden">
      {/* Fixed TTT Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#FAFBFC]/80 backdrop-blur-xl border-b border-zinc-200/60">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black text-zinc-900 tracking-tight group-hover:text-cyan-600 transition-colors">
            TTT
          </span>
          <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2 py-0.5 rounded-md">
            2.0
          </span>
        </Link>
        <Link to="/Feed">
          <button className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors flex items-center gap-1.5">
            Back to TTT
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Animated gradient bg */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-[120px]" />
        </motion.div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full mb-8">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-cyan-700 tracking-wide">NOW IN DEVELOPMENT</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-transparent">
                The Future of
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                TTT
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10">
              A complete reimagination of the TTT platform — faster, more beautiful,
              and built for the next wave of decentralized social interaction on Kaspa.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/Feed">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-zinc-900/20"
                >
                  Enter Current TTT
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <a href="#roadmap">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-12 px-8 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl border border-zinc-200 transition-colors flex items-center gap-2"
                >
                  View Roadmap
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center mt-16"
        >
          <ChevronDown className="w-5 h-5 text-zinc-300" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-zinc-200/60 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { label: "Active Users", value: 12500, suffix: "+" },
            { label: "Transactions", value: 850000, suffix: "+" },
            { label: "KAS Tipped", value: 45000, suffix: "+" },
            { label: "Apps Built", value: 80, suffix: "+" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black text-zinc-900 mb-1">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-zinc-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4">Built Different</h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Every feature designed with speed, privacy, and community at its core.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-6 hover:border-cyan-300/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-20 md:py-28 px-6 bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full mb-6">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-zinc-600 tracking-wide">ROADMAP</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4">
              Where We're Headed
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              A transparent look at what we've built and what's coming next.
            </p>
          </motion.div>

          {/* Timeline line */}
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-cyan-500/40 to-zinc-200/40" />

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {ROADMAP.map((phase, i) => (
                <RoadmapCard key={phase.phase} phase={phase} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-10 md:p-14 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Join the Revolution
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
                TTT 2.0 is being shaped by its community. Get started today and be part of the future.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/Feed">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-12 px-8 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-colors flex items-center gap-2"
                  >
                    Enter TTT
                    <ArrowUpRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link to="/AgentZK">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-12 px-8 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    Claim Agent ZK
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-200/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm text-zinc-400">TTT 2.0 — Built on Kaspa</span>
          <div className="flex items-center gap-4">
            <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
              Kaspa <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://kasplex.org" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
              Kasplex <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}