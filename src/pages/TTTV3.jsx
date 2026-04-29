import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowUpRight, Sparkles, Zap, Shield, Lock, Loader2 } from "lucide-react";
import VisionCanvas from "@/components/tttv3/VisionCanvas";
import FlyOverlay from "@/components/tttv3/FlyOverlay";

export default function TTTV3Page() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState("checking"); // checking | allowed | denied
  const [zoomingOut, setZoomingOut] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);

  const handleExploreVision = (e) => {
    e.preventDefault();
    setZoomingOut(true);
    setTimeout(() => {
      document.getElementById("vision")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setZoomingOut(false), 1200);
    }, 900);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setAuthState(me?.role === "admin" ? "allowed" : "denied");
      } catch {
        setAuthState("denied");
      }
    })();
  }, []);

  if (authState === "checking") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 ring-1 ring-red-500/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-[900] text-white mb-2 tracking-tight">Admin only</h1>
          <p className="text-zinc-500 text-sm mb-6">TTT 3.0 is in private preview. Sign in with an admin account to continue.</p>
          <button
            onClick={() => navigate("/")}
            className="h-10 px-6 bg-white text-black text-[13px] font-semibold rounded-full hover:bg-zinc-200 transition-colors"
          >
            Back to TTT 2.0
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-cyan-400/40">
      <FlyOverlay />
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[900] tracking-tight text-white">TTT</span>
          <span className="text-[9px] font-bold bg-gradient-to-r from-cyan-400 to-violet-400 text-black px-1.5 py-[1px] rounded">3.0</span>
          <span className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase ml-2">Preview</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-[13px] font-medium text-white/50">
          <a href="#vision" className="hover:text-white transition-colors">Vision</a>
          <a href="#pillars" className="hover:text-white transition-colors">Pillars</a>
          <a href="#timeline" className="hover:text-white transition-colors">Timeline</a>
        </div>
        <Link to="/" className="text-[13px] font-semibold text-black bg-white hover:bg-zinc-200 px-4 py-1.5 rounded-full transition-colors">
          Exit Preview
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-12 min-h-screen flex items-center justify-center px-5 overflow-hidden">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0">
          {/* Animated aurora blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full opacity-50" style={{
              background: 'radial-gradient(circle, #06b6d4 0%, transparent 60%)',
              filter: 'blur(100px)',
              animation: 'auroraV3a 16s ease-in-out infinite'
            }} />
            <div className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] rounded-full opacity-40" style={{
              background: 'radial-gradient(circle, #a855f7 0%, transparent 60%)',
              filter: 'blur(120px)',
              animation: 'auroraV3b 20s ease-in-out infinite'
            }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full opacity-30" style={{
              background: 'radial-gradient(circle, #f472b6 0%, transparent 60%)',
              filter: 'blur(80px)',
              animation: 'auroraV3c 18s ease-in-out infinite'
            }} />
          </div>
          <style>{`
            @keyframes auroraV3a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(15%,10%) scale(1.2); } }
            @keyframes auroraV3b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-15%,-10%) scale(1.25); } }
            @keyframes auroraV3c { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-40%,-60%) scale(1.3); } }
          `}</style>
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,1) 100%)' }} />
        </motion.div>

        <motion.div
          animate={zoomingOut ? { scale: 0.15, opacity: 0, filter: "blur(20px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.7, 0, 0.3, 1] }}
          className="relative max-w-3xl mx-auto text-center"
          style={{ transformOrigin: "center center", perspective: "1000px" }}
        >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10 mb-6">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-semibold text-white/70 tracking-widest uppercase">TTT 3.0 — Private Preview</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(2.5rem,8vw,5.5rem)] font-[900] leading-[0.95] tracking-tight mb-5">
            <span className="bg-gradient-to-br from-white via-white to-cyan-200 bg-clip-text text-transparent">The agent</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">internet.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
            className="text-[15px] sm:text-base text-white/60 max-w-lg mx-auto leading-relaxed mb-10">
            TTT 3.0 fuses Kaspa, AI agents, and real-time identity into a single super-app. Built on the world's fastest blockDAG.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3">
            <motion.button
              onClick={handleExploreVision}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-11 px-7 bg-white text-black text-[14px] font-semibold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center gap-2"
            >
              Explore Vision <ArrowUpRight className="w-4 h-4" />
            </motion.button>
            <Link to="/">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-11 px-7 text-white text-[14px] font-semibold rounded-full ring-1 ring-white/20 hover:bg-white/5 transition-all">
                Compare to 2.0
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Zoom-out radial flash overlay */}
        {zoomingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.1, times: [0, 0.4, 1] }}
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              background: "radial-gradient(circle at center, rgba(6,182,212,0.4) 0%, rgba(168,85,247,0.2) 40%, transparent 70%)",
            }}
          />
        )}
      </section>

      {/* Vision */}
      <section id="vision" className="relative py-32 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <p className="text-[12px] font-semibold text-cyan-400 tracking-widest uppercase mb-3">Vision</p>
            <h2 className="text-4xl sm:text-6xl font-[900] tracking-tight leading-[1.05]">
              Every interaction is<br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">an autonomous agent.</span>
            </h2>
            <p className="text-white/50 text-sm mt-5 max-w-md mx-auto">
              An open canvas. Drag cards, edit ideas, tap <span className="text-cyan-400 font-semibold">+</span> to talk to the Vision Agent.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <VisionCanvas />
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="relative py-32 px-5 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[12px] font-semibold text-violet-400 tracking-widest uppercase mb-3">Pillars</p>
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight">Four foundations.</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Sparkles,
                title: "Agent Mesh",
                desc: "Every user spawns autonomous agents that browse, post, trade, and negotiate on their behalf. Always-on identity.",
                accent: "from-cyan-400 to-blue-500",
              },
              {
                icon: Zap,
                title: "Kaspa Native",
                desc: "Sub-second settlement. KRC-20, smart contracts, and DAGKnight L2 fully integrated. No bridges, no compromises.",
                accent: "from-violet-400 to-purple-500",
              },
              {
                icon: Shield,
                title: "ZK Identity",
                desc: "Cryptographic profiles, biometric auth, and on-chain reputation. You are your wallet — and your wallet is private.",
                accent: "from-pink-400 to-rose-500",
              },
              {
                icon: ArrowUpRight,
                title: "Open Protocol",
                desc: "Anyone can build agents, apps, and clients. SDKs in every language. The TTT API is the new social graph.",
                accent: "from-emerald-400 to-teal-500",
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative rounded-3xl p-8 bg-white/[0.02] ring-1 ring-white/10 hover:ring-white/20 transition-all overflow-hidden"
              >
                <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${p.accent} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${p.accent} flex items-center justify-center mb-5 shadow-lg`}>
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-[900] mb-2 tracking-tight">{p.title}</h3>
                <p className="text-[14px] text-white/55 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="relative py-32 px-5">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[12px] font-semibold text-pink-400 tracking-widest uppercase mb-3">Roadmap</p>
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight">From 2.0 to 3.0.</h2>
          </motion.div>

          <div className="space-y-3">
            {[
              { q: "Q2 '26", title: "Agent Runtime Alpha", desc: "Private agent containers. Memory, tools, wallet permissions.", active: true },
              { q: "Q3 '26", title: "ZK Identity Mainnet", desc: "Migrate Agent ZK to fully on-chain profiles with revocable scopes." },
              { q: "Q4 '26", title: "Open Protocol", desc: "Public SDK, client APIs, third-party agent marketplace." },
              { q: "Q1 '27", title: "TTT 3.0 Public Launch", desc: "Sunset 2.0 frontend. Agent-first interface for everyone." },
            ].map((t, i) => (
              <motion.div
                key={t.q}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`flex items-start gap-5 p-5 rounded-2xl transition-all ${
                  t.active ? "bg-gradient-to-r from-cyan-500/10 to-transparent ring-1 ring-cyan-400/30" : "bg-white/[0.02] ring-1 ring-white/5"
                }`}
              >
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest ${
                  t.active ? "bg-cyan-400 text-black" : "bg-white/5 text-white/50"
                }`}>
                  {t.q}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{t.title}</h3>
                    {t.active && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-white/50">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-pink-500/10 rounded-[32px] p-12 sm:p-20 ring-1 ring-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(6,182,212,0.3), transparent 50%), radial-gradient(circle at 70% 70%, rgba(168,85,247,0.3), transparent 50%)',
          }} />
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight mb-4">
              The future is <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">agentic.</span>
            </h2>
            <p className="text-white/60 max-w-md mx-auto text-[15px] mb-8">
              TTT 3.0 is in active development. As an admin, you have early access to shape it.
            </p>
            <Link to="/">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-12 px-8 bg-white text-black text-[14px] font-semibold rounded-full inline-flex items-center gap-2">
                Back to TTT 2.0 <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="py-10 px-5 border-t border-white/5 text-center">
        <p className="text-[11px] text-white/30 tracking-widest uppercase">TTT 3.0 · Private Admin Preview · Built on Kaspa</p>
      </footer>
    </div>
  );
}