import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, Type, Layers, BookOpen, Wand2,
  FolderOpen, Palette, Play, Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import HaruAccessGate from "@/components/haru/HaruAccessGate";
import HaruStudio from "@/components/haru/HaruStudio";

const HIRO_ICON = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1a11decfa_generated_image.png";
const HIRO_HERO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/221388459_generated_image.png";

const FEATURES = [
  { icon: BookOpen,   title: "Type Kits",         desc: "Save your typographic direction once — weights, pairings, rules, vibes. Every project inherits your foundation automatically.", color: "from-cyan-400 to-blue-500" },
  { icon: FolderOpen, title: "Projects",          desc: "Organize campaigns, collections, and brand systems. Keep type explorations contextual — not buried in random prompts.",           color: "from-blue-400 to-indigo-500" },
  { icon: Wand2,      title: "Guided Studio",     desc: "Move from brief to usable wordmark, logotype, or headline set with a clean workflow built for real design work.",                 color: "from-indigo-400 to-violet-500" },
  { icon: Sparkles,   title: "Smart Refinement",  desc: "Evolve strong letterforms without throwing everything away. Adjust weight, axis, spacing — never restart from zero.",              color: "from-sky-400 to-cyan-500" },
  { icon: Layers,     title: "Reusable Library",  desc: "Approved typefaces, pairings, and letter systems stay organized. Your best typographic moves become repeatable.",                 color: "from-violet-400 to-purple-500" },
  { icon: Palette,    title: "Pairing Engine",    desc: "Discover harmonious serif + sans combinations. AI-guided font pairings tuned to your brand voice.",                                color: "from-teal-400 to-emerald-500" },
];

const STEPS = [
  { n: "01", title: "Create your Type Kit", desc: "Save references, weights, voice, and rules so you stop rebuilding direction every session." },
  { n: "02", title: "Start a Project",      desc: "Tell Hiro what you're designing, where it lives, and what feeling the letters must carry." },
  { n: "03", title: "Generate & refine",    desc: "Explore directions, iterate on strong candidates, refine shape without losing soul." },
  { n: "04", title: "Save & reuse",         desc: "Keep approved letterforms organized so winning type systems scale with your brand." },
];

const PROBLEMS = [
  { title: "Prompt roulette",  desc: "Hours disappear into rewrites and almost-right letterforms." },
  { title: "No type memory",   desc: "Most tools forget your typographic rules the moment you move on." },
  { title: "Scattered workflow", desc: "Generate somewhere. Refine elsewhere. Save who knows where. Repeat next week." },
];

export default function HiroPage() {
  const [showGate, setShowGate] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [kaspaAddress, setKaspaAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.background = "#0a0f1e";
    base44.auth.me()
      .then((u) => {
        if (u?.role === "admin") {
          setIsAdmin(true);
          setKaspaAddress(u.email || "admin");
        }
      })
      .catch(() => {});
    const saved = localStorage.getItem("haru_access_address");
    if (saved) setKaspaAddress(saved);
    return () => { document.body.style.background = ""; };
  }, []);

  const requestAccess = () => {
    if (isAdmin || kaspaAddress) setShowStudio(true);
    else setShowGate(true);
  };

  const handleGranted = (addr) => {
    setKaspaAddress(addr);
    setShowGate(false);
    setShowStudio(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden" style={{ fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui" }}>
      {/* Nav */}
      <nav
        className="fixed top-0 inset-x-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-cyan-500/10"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-6xl mx-auto h-14 px-3 sm:px-5 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors h-11 px-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={HIRO_ICON} alt="Hiro" className="w-7 h-7 rounded-lg" />
            <span className="text-[16px] font-[900] tracking-tight">Hiro</span>
          </div>
          <button onClick={requestAccess} className="text-[13px] font-semibold text-[#0a0f1e] bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 h-10 px-4 rounded-full transition-opacity">
            {isAdmin || kaspaAddress ? "Enter Studio" : "Get Access"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="max-w-5xl mx-auto relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur ring-1 ring-cyan-500/30 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Typography Studio · Beta</span>
            </div>

            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-[900] leading-[0.95] tracking-tight mb-6">
              <span className="block">Design fonts that</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent" style={{ fontFamily: "'SF Pro Display', Georgia, serif", fontStyle: "italic", fontWeight: 900 }}>
                actually belong
              </span>
              <span className="block">to your brand.</span>
            </h1>

            <p className="max-w-xl mx-auto text-[15px] sm:text-base text-white/50 leading-relaxed mb-10">
              Hiro is the typography-first AI workflow for founders, designers, and brand teams.
              Build your type system once. Generate on-voice letterforms. Refine, save, reuse — without prompt chaos.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.button
                onClick={requestAccess}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-12 px-7 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0a0f1e] text-[14px] font-bold rounded-full shadow-xl shadow-cyan-500/20 flex items-center gap-2"
              >
                {isAdmin || kaspaAddress ? "Enter Studio" : "Get Access"} <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={requestAccess}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-12 px-7 bg-white/5 text-white text-[14px] font-semibold rounded-full ring-1 ring-white/15 hover:ring-white/30 flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" /> Open Canvas Studio
              </motion.button>
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 relative"
          >
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-500/20">
              <img src={HIRO_HERO} alt="Hiro typography workspace" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/40 via-transparent to-transparent" />

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="hidden sm:block absolute top-6 left-6 bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-xl ring-1 ring-white/10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <Type className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-white/50 uppercase tracking-wide font-bold">Type Kit</div>
                    <div className="text-[12px] font-bold text-white">Active · Serif-led</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="hidden sm:block absolute bottom-6 right-6 bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-xl ring-1 ring-white/10"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <div className="text-left">
                    <div className="text-[10px] text-white/50 uppercase tracking-wide font-bold">Generating</div>
                    <div className="text-[12px] font-bold text-white">Wordmark · 04/12</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {["Type Kits", "Project Workflows", "Guided AI", "Smart Refinement", "Reusable Library", "Pairing Engine"].map((k) => (
              <span key={k} className="px-3.5 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 text-[11px] font-semibold text-white/70">
                {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why this matters */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-cyan-400 uppercase mb-3">Why this matters</p>
            <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05] max-w-3xl mx-auto">
              Most AI type tools create more work than they remove.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10"
              >
                <h3 className="text-lg font-[800] mb-2">{p.title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The better way */}
      <section className="py-24 px-5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[12px] font-bold tracking-widest text-cyan-400 uppercase mb-3">The better way</p>
          <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05] mb-6">
            Hiro gives your type workflow <span className="italic" style={{ fontFamily: "Georgia, serif" }}>a memory.</span>
          </h2>
          <p className="text-[15px] sm:text-base text-white/50 leading-relaxed max-w-2xl mx-auto">
            Set your typographic direction once. Start projects with real context. Generate letterforms that respect your voice,
            refine the strongest ones, and keep the assets worth reusing. A faster, cleaner path from brief to publish-ready type.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-cyan-400 uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05]">A simpler path from brief to letterform.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-3xl p-7 ring-1 ring-white/10 hover:ring-cyan-500/30 transition-all"
              >
                <div className="text-[40px] font-[900] bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 leading-none">
                  {s.n}
                </div>
                <h3 className="text-xl font-[800] mb-2">{s.title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-cyan-400 uppercase mb-3">Built for real type work</p>
            <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05]">A workflow system, not another random generator.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white/5 rounded-3xl p-6 ring-1 ring-white/10 hover:ring-cyan-500/30 transition-all group"
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-[800] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-[32px] p-12 sm:p-16 relative overflow-hidden">
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-[900] text-white leading-[1.05] mb-4 tracking-tight">
              Stop starting from <span className="italic" style={{ fontFamily: "Georgia, serif" }}>scratch</span>.
            </h2>
            <p className="text-white/90 max-w-lg mx-auto text-[14px] leading-relaxed mb-8">
              Build typography that remembers your brand. Get early access to Hiro.
            </p>
            <motion.button
              onClick={requestAccess}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="h-12 px-8 bg-white text-[#0a0f1e] text-[14px] font-bold rounded-full shadow-xl flex items-center gap-2 mx-auto"
            >
              {isAdmin || kaspaAddress ? "Enter Studio" : "Get Access"} <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/30">
          <div className="flex items-center gap-2">
            <img src={HIRO_ICON} alt="Hiro" className="w-5 h-5 rounded" />
            <span className="font-semibold text-white/50">Hiro · Typography that remembers.</span>
          </div>
          <span>© {new Date().getFullYear()} Hiro — A TTT creative app</span>
        </div>
      </footer>

      {showGate && <HaruAccessGate onClose={() => setShowGate(false)} onGranted={handleGranted} />}
      {showStudio && <HaruStudio onClose={() => setShowStudio(false)} kaspaAddress={kaspaAddress} />}
    </div>
  );
}