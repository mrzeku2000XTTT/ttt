import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Workflow, Zap, Lock, Loader2, Shield,
  CircuitBoard, Infinity as InfinityIcon, Wand2, ArrowLeft,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MIRAGE_LOGO, MIRAGE_TOOLS } from "@/components/mirage/mirageTools";

export default function MIRAGEPage() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState("loading"); // loading | admin | denied

  useEffect(() => {
    base44.auth.me()
      .then((u) => setAuthState(u?.role === "admin" ? "admin" : "denied"))
      .catch(() => setAuthState("denied"));
  }, []);

  if (authState === "loading") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (authState === "denied") {
    return <DeniedScreen />;
  }

  return <AdminLanding navigate={navigate} />;
}

function DeniedScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Admin Only</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          MIRAGE AI is currently in restricted preview. Only admins have access.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

function AdminLanding({ navigate }) {
  // Featured tools to showcase with their real logos
  const featured = MIRAGE_TOOLS.filter((t, i) => i < 8);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-emerald-400/30">
      {/* TOP NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-5 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 text-white/50" />
          <span className="text-[13px] font-bold text-white/70 hover:text-white">TTT</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Shield className="w-3 h-3 text-amber-300" />
            <span className="text-[10px] font-black tracking-widest uppercase text-amber-200">Admin Preview</span>
          </div>
          <Link
            to="/MIRAGEStudio"
            className="h-9 px-4 rounded-full bg-white text-black text-[12px] font-black flex items-center gap-1.5 hover:bg-white/90"
          >
            Open Studio <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[100vh] flex items-center justify-center px-5 pt-14 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.18) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(251,191,36,0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 20% 80%, rgba(20,184,166,0.15) 0%, transparent 50%),
              linear-gradient(180deg, #04100e 0%, #000 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.6) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 80%, #000 100%)" }}
        />

        {/* Two-column hero */}
        <div className="relative z-10 max-w-6xl w-full mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center py-16">
          {/* LEFT: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-200">
                The TTT Orchestrator
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(2.5rem,7vw,5.5rem)] font-[900] leading-[0.92] tracking-tight mb-6"
            >
              <span className="block text-white">One canvas.</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                Every TTT app.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-base sm:text-lg text-white/60 max-w-md leading-relaxed mb-8"
            >
              MIRAGE wires Hikaru's images into FluxKmail's emails. Pipes Hercules research into the TTT Feed. n8n-style workflows — built from the apps you already have.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap items-center gap-3 mb-10"
            >
              <button
                onClick={() => navigate("/MIRAGEStudio")}
                className="group h-13 px-7 py-3 bg-white text-black text-[14px] font-black rounded-full shadow-2xl shadow-emerald-400/20 flex items-center gap-2 hover:shadow-emerald-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                Launch MIRAGE AI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#stack"
                className="h-13 px-6 py-3 text-white text-[13px] font-bold rounded-full border border-white/15 hover:border-white/30 hover:bg-white/5 backdrop-blur-md transition-all"
              >
                Browse the stack
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-5 text-[11px] text-white/40 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CircuitBoard className="w-3.5 h-3.5 text-emerald-400" />
                {MIRAGE_TOOLS.length} apps connected
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Real-time execution
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Visual orbit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square w-full max-w-[480px] mx-auto"
          >
            <OrbitVisual featured={featured} />
          </motion.div>
        </div>
      </section>

      {/* ─── STACK / Connected Apps ─── */}
      <section id="stack" className="relative py-24 px-5 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-300 mb-3">The Stack</p>
              <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight">
                {MIRAGE_TOOLS.length} apps. <span className="text-white/40">One workflow.</span>
              </h2>
            </div>
            <p className="text-white/50 max-w-sm text-sm">
              Every app you've used in TTT, now wireable as a node. Each one keeps its own logo, identity, and behavior.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MIRAGE_TOOLS.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-emerald-400/40 transition-colors"
              >
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-25 blur-2xl transition-opacity`} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/15 mb-3">
                    {tool.logo ? (
                      <img src={tool.logo} alt={tool.appName} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${tool.color}`} />
                    )}
                  </div>
                  <div className="text-white font-black text-sm mb-0.5">{tool.appName}</div>
                  <div className="text-emerald-300 text-[10px] font-bold mb-2">{tool.sublabel}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">{tool.category}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-300 mb-3">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight">
              MIRAGE in the middle. <span className="text-white/40">Apps on the rim.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              { icon: InfinityIcon, num: "01", title: "Pick TTT apps", desc: "Drop in Hikaru, Zeku, Hercules, FluxKmail — any app you already use." },
              { icon: Workflow, num: "02", title: "MIRAGE wires them", desc: "Each tool's output flows into the next. MIRAGE handles the orchestration." },
              { icon: Wand2, num: "03", title: "Run the canvas", desc: "Trigger once and watch each app execute in sequence — like n8n, native to TTT." },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative p-7 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 backdrop-blur-md overflow-hidden"
              >
                <div className="absolute top-4 right-4 text-[40px] font-[900] text-white/[0.05] tracking-tighter leading-none">
                  {step.num}
                </div>
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5">
                    <step.icon className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2">{step.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-32 px-5 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-6xl font-[900] tracking-tight mb-6 leading-[0.95]">
            Stop opening apps <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">one by one.</span>
          </h2>
          <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            MIRAGE turns your entire TTT toolkit into a single, programmable canvas.
          </p>
          <Link to="/MIRAGEStudio">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-14 px-10 bg-white text-black text-[15px] font-black rounded-full shadow-2xl shadow-emerald-500/20 inline-flex items-center gap-2.5 hover:shadow-emerald-500/40"
            >
              <Sparkles className="w-4 h-4" />
              Launch MIRAGE AI
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 px-5 border-t border-white/5 text-center">
        <span className="text-white/30 text-xs">MIRAGE AI · Admin preview · Built on TTT · Powered by Kaspa</span>
      </footer>
    </div>
  );
}

/**
 * OrbitVisual — animated central MIRAGE logo with featured app logos orbiting around it.
 * The orbit ring rotates slowly; logos counter-rotate to stay upright.
 */
function OrbitVisual({ featured }) {
  return (
    <div className="relative w-full h-full">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/30 via-teal-400/20 to-amber-400/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Outer dotted ring */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        <circle cx="200" cy="200" r="180" fill="none" stroke="#10b981" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 8" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="#fbbf24" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="1 5" />
      </svg>

      {/* Rotating orbit container */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {featured.map((tool, i) => {
          const angle = (i / featured.length) * Math.PI * 2;
          const radius = 45; // % of container
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          return (
            <div
              key={tool.id}
              className="absolute"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              {/* Counter-rotate so the logo stays upright */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl">
                  {tool.logo ? (
                    <img src={tool.logo} alt={tool.appName} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${tool.color}`} />
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Connection beams */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="orbit-beam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {featured.map((_, i) => {
          const angle = (i / featured.length) * Math.PI * 2;
          const x2 = 200 + Math.cos(angle) * 180;
          const y2 = 200 + Math.sin(angle) * 180;
          return (
            <line
              key={i}
              x1="200" y1="200" x2={x2} y2={y2}
              stroke="url(#orbit-beam)" strokeWidth="0.8" strokeOpacity="0.6"
            />
          );
        })}
      </svg>

      {/* Center MIRAGE logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", damping: 18 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-amber-300 blur-xl"
            style={{ width: 140, height: 140, left: -25, top: -25 }}
          />
          <div className="relative w-[90px] h-[90px] rounded-full overflow-hidden ring-4 ring-emerald-400/50 shadow-2xl shadow-emerald-500/50">
            <img src={MIRAGE_LOGO} alt="MIRAGE" className="w-full h-full object-cover" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}