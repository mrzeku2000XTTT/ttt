import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Workflow, Zap, ImageIcon, Brain, Mail, MessageSquarePlus } from "lucide-react";
import { MIRAGE_LOGO, MIRAGE_TOOLS } from "@/components/mirage/mirageTools";

export default function MIRAGEPage() {
  const heroRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      cursorRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      heroRef.current.style.setProperty("--mx", `${cursorRef.current.x}px`);
      heroRef.current.style.setProperty("--my", `${cursorRef.current.y}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Show 6 featured tools as orbit preview
  const featuredTools = MIRAGE_TOOLS.slice(0, 6);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-5 overflow-hidden">
        {/* Animated background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(168,85,247,0.25) 0%, transparent 35%),
              radial-gradient(circle at 20% 30%, rgba(168,85,247,0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(6,182,212,0.35) 0%, transparent 50%),
              radial-gradient(circle at 50% 100%, rgba(236,72,153,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at top, #1a0b2e 0%, #050510 50%, #000 100%)
            `,
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 80%, #000 100%)",
          }}
        />

        {/* Floating tool icons */}
        <div className="absolute inset-0 pointer-events-none">
          {featuredTools.map((tool, i) => {
            const angle = (i / featuredTools.length) * Math.PI * 2;
            const radius = 280;
            return (
              <motion.div
                key={tool.id}
                className="absolute hidden md:block"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                  top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 0.85,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { delay: 0.5 + i * 0.1, duration: 0.6 },
                  scale: { delay: 0.5 + i * 0.1, type: "spring", damping: 16 },
                  y: { duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} shadow-2xl border border-white/20 flex items-center justify-center`}>
                  <span className="text-white font-black text-[10px] tracking-tight">{tool.appName.slice(0, 4)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
            className="inline-block mb-8"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 220, height: 220, left: -30, top: -30 }}
              />
              <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-purple-400/40 shadow-2xl shadow-purple-500/50">
                <img src={MIRAGE_LOGO} alt="MIRAGE AI" className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-6"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              The TTT Orchestrator
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,10vw,7rem)] font-[900] leading-[0.9] tracking-tight mb-6"
          >
            <span className="block bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              MIRAGE AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="text-base sm:text-xl text-white/70 max-w-xl mx-auto leading-relaxed mb-10"
          >
            One canvas. Every TTT app. Wire Hikaru's images into FluxKmail's emails. Pipe Hercules research into the TTT Feed. Build n8n-style workflows from your existing tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/MIRAGEStudio">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="group h-14 px-8 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white text-[15px] font-black rounded-full shadow-2xl shadow-purple-500/40 flex items-center gap-2.5 hover:shadow-purple-500/60 transition-shadow"
              >
                <Sparkles className="w-4 h-4" />
                Launch MIRAGE AI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <a href="#tools">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="h-14 px-7 text-white text-[14px] font-bold rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 backdrop-blur-md"
              >
                See Connected Apps
              </motion.button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12 flex items-center justify-center gap-4 text-[11px] text-white/40 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {MIRAGE_TOOLS.length} apps connected
            </div>
            <div>·</div>
            <div>Open canvas</div>
            <div>·</div>
            <div>Real-time execution</div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-black tracking-[0.3em] uppercase text-purple-300 mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight mb-4">
              MIRAGE in the middle. <span className="text-white/40">Every app on the rim.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Layers, title: "Pick TTT apps", desc: "Drop in Hikaru, Zeku, Hercules, FluxKmail, TTT Feed — any app you already use." },
              { icon: Workflow, title: "MIRAGE wires them", desc: "Each tool's output flows into the next. MIRAGE handles the orchestration." },
              { icon: Zap, title: "Run the canvas", desc: "Trigger once and watch each app execute in sequence — like n8n, native to TTT." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-md"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-[10px] font-black tracking-widest uppercase text-purple-300 mb-1">Step {i + 1}</div>
                <h3 className="text-xl font-black tracking-tight mb-2">{step.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECTED APPS */}
      <section id="tools" className="relative py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-black tracking-[0.3em] uppercase text-purple-300 mb-3">Connected</p>
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight mb-4">
              {MIRAGE_TOOLS.length} TTT apps. <span className="text-white/40">One canvas.</span>
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Every app you've used in TTT, now wireable as a node in your workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MIRAGE_TOOLS.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-purple-400/40 transition-colors"
              >
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity`} />
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg mb-3`}>
                    <span className="text-white font-black text-[10px]">{tool.appName.slice(0, 3).toUpperCase()}</span>
                  </div>
                  <div className="text-white font-black text-sm mb-0.5">{tool.appName}</div>
                  <div className="text-purple-300 text-[10px] font-bold mb-1.5">{tool.sublabel}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">{tool.category}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-5 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-6xl font-[900] tracking-tight mb-6">
            Stop opening apps one by one.
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            MIRAGE turns your entire TTT toolkit into a single, programmable canvas.
          </p>
          <Link to="/MIRAGEStudio">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="h-14 px-10 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white text-[15px] font-black rounded-full shadow-2xl shadow-purple-500/40 inline-flex items-center gap-2.5"
            >
              <Sparkles className="w-4 h-4" />
              Launch MIRAGE AI
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 px-5 border-t border-white/5 text-center">
        <span className="text-white/30 text-xs">MIRAGE AI · Built on TTT · Powered by Kaspa</span>
      </footer>
    </div>
  );
}