import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Sparkles, Type, Layers, BookOpen, Wand2,
  FolderOpen, Download, ChevronRight, Check, Star, Palette,
  Play, X, Loader2
} from "lucide-react";

const HARU_ICON = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ade3b1795_generated_image.png";
const HARU_HERO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/221388459_generated_image.png";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Type Kits",
    desc: "Save your typographic direction once — weights, pairings, rules, vibes. Every project inherits your foundation automatically.",
    color: "from-pink-400 to-rose-500",
  },
  {
    icon: FolderOpen,
    title: "Projects",
    desc: "Organize campaigns, collections, and brand systems. Keep type explorations contextual — not buried in random prompts.",
    color: "from-rose-400 to-red-400",
  },
  {
    icon: Wand2,
    title: "Guided Studio",
    desc: "Move from brief to usable wordmark, logotype, or headline set with a clean workflow built for real design work.",
    color: "from-amber-400 to-orange-400",
  },
  {
    icon: Sparkles,
    title: "Smart Refinement",
    desc: "Evolve strong letterforms without throwing everything away. Adjust weight, axis, spacing — never restart from zero.",
    color: "from-fuchsia-400 to-pink-500",
  },
  {
    icon: Layers,
    title: "Reusable Library",
    desc: "Approved typefaces, pairings, and letter systems stay organized. Your best typographic moves become repeatable.",
    color: "from-violet-400 to-purple-500",
  },
  {
    icon: Palette,
    title: "Pairing Engine",
    desc: "Discover harmonious serif + sans combinations. AI-guided font pairings tuned to your brand voice.",
    color: "from-emerald-400 to-teal-500",
  },
];

const USE_CASES = [
  { title: "Logotypes", desc: "Build custom wordmarks with presence and personality.", img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80" },
  { title: "Headlines", desc: "Editorial typography that commands the page.", img: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80" },
  { title: "Brand Systems", desc: "Cohesive type stacks across every touchpoint.", img: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800&q=80" },
  { title: "Display Type", desc: "Experimental letterforms for launches & moments.", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" },
  { title: "Content Graphics", desc: "On-brand typographic visuals for editorial.", img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80" },
  { title: "Wordmark Exploration", desc: "Test directions fast without losing structure.", img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80" },
];

const STEPS = [
  { n: "01", title: "Create your Type Kit", desc: "Save references, weights, voice, and rules so you stop rebuilding direction every session." },
  { n: "02", title: "Start a Project", desc: "Tell Haru what you're designing, where it lives, and what feeling the letters must carry." },
  { n: "03", title: "Generate & refine", desc: "Explore directions, iterate on strong candidates, refine shape without losing soul." },
  { n: "04", title: "Save & reuse", desc: "Keep approved letterforms organized so winning type systems scale with your brand." },
];

const PROBLEMS = [
  { title: "Prompt roulette", desc: "Hours disappear into rewrites and almost-right letterforms." },
  { title: "No type memory", desc: "Most tools forget your typographic rules the moment you move on." },
  { title: "Scattered workflow", desc: "Generate somewhere. Refine elsewhere. Save who knows where. Repeat next week." },
];

export default function HaruPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedSample, setGeneratedSample] = useState(null);

  useEffect(() => {
    document.body.style.background = "#faf7f5";
    return () => { document.body.style.background = ""; };
  }, []);

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  const runDemo = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // Simulated generation — just show a pretty sample with the prompt styled
    setTimeout(() => {
      setGeneratedSample(prompt);
      setGenerating(false);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#faf7f5] text-zinc-900 overflow-x-hidden" style={{ fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui" }}>
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 bg-[#faf7f5]/80 backdrop-blur-xl border-b border-pink-200/30">
        <div className="max-w-6xl mx-auto h-full px-5 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={HARU_ICON} alt="Haru" className="w-7 h-7 rounded-lg" />
            <span className="text-[16px] font-[900] tracking-tight">Haru</span>
          </div>
          <a href="#waitlist" className="text-[13px] font-semibold text-white bg-zinc-900 hover:bg-zinc-700 px-4 py-1.5 rounded-full transition-colors">
            Get Access
          </a>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full opacity-40" style={{ background: "radial-gradient(circle, #ffb6c8, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #ffd9a8, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="max-w-5xl mx-auto relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur ring-1 ring-pink-200/60 mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-[11px] font-semibold text-zinc-700 tracking-wide uppercase">Typography Studio · Beta</span>
            </div>

            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-[900] leading-[0.95] tracking-tight mb-6">
              <span className="block">Design fonts that</span>
              <span className="block bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent" style={{ fontFamily: "'SF Pro Display', Georgia, serif", fontStyle: "italic", fontWeight: 900 }}>
                actually belong
              </span>
              <span className="block">to your brand.</span>
            </h1>

            <p className="max-w-xl mx-auto text-[15px] sm:text-base text-zinc-500 leading-relaxed mb-10">
              Haru is the typography-first AI workflow for founders, designers, and brand teams.
              Build your type system once. Generate on-voice letterforms. Refine, save, reuse — without prompt chaos.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="#waitlist">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="h-12 px-7 bg-zinc-900 text-white text-[14px] font-semibold rounded-full shadow-xl shadow-pink-500/10 flex items-center gap-2">
                  Get Access <ArrowRight className="w-4 h-4" />
                </motion.button>
              </a>
              <button onClick={() => setShowDemo(true)}>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="h-12 px-7 bg-white text-zinc-900 text-[14px] font-semibold rounded-full ring-1 ring-zinc-200 hover:ring-zinc-300 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5" /> Try the Workflow
                </motion.div>
              </button>
            </div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 relative"
          >
            <div className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-pink-300/25 ring-1 ring-pink-200/40">
              <img src={HARU_HERO} alt="Haru typography workspace" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#faf7f5]/20 via-transparent to-transparent" />

              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="hidden sm:block absolute top-6 left-6 bg-white/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl ring-1 ring-white/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <Type className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">Type Kit</div>
                    <div className="text-[12px] font-bold text-zinc-900">Active · Serif-led</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="hidden sm:block absolute bottom-6 right-6 bg-white/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl ring-1 ring-white/50"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">Generating</div>
                    <div className="text-[12px] font-bold text-zinc-900">Wordmark · 04/12</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Pill keywords */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {["Type Kits", "Project Workflows", "Guided AI", "Smart Refinement", "Reusable Library", "Pairing Engine"].map((k) => (
              <span key={k} className="px-3.5 py-1.5 rounded-full bg-white ring-1 ring-pink-200/40 text-[11px] font-semibold text-zinc-600">
                {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why this matters ─── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-pink-500 uppercase mb-3">Why this matters</p>
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
                className="bg-white rounded-2xl p-6 ring-1 ring-pink-200/30 shadow-sm"
              >
                <h3 className="text-lg font-[800] mb-2 text-zinc-900">{p.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The better way ─── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[12px] font-bold tracking-widest text-pink-500 uppercase mb-3">The better way</p>
          <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05] mb-6">
            Haru gives your type workflow <span className="italic" style={{ fontFamily: "Georgia, serif" }}>a memory.</span>
          </h2>
          <p className="text-[15px] sm:text-base text-zinc-500 leading-relaxed max-w-2xl mx-auto">
            Set your typographic direction once. Start projects with real context. Generate letterforms that respect your voice,
            refine the strongest ones, and keep the assets worth reusing. A faster, cleaner path from brief to publish-ready type.
          </p>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-pink-500 uppercase mb-3">How it works</p>
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
                className="bg-white rounded-3xl p-7 ring-1 ring-pink-200/30 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="text-[40px] font-[900] bg-gradient-to-br from-pink-400 to-amber-400 bg-clip-text text-transparent mb-2 leading-none">
                  {s.n}
                </div>
                <h3 className="text-xl font-[800] mb-2 text-zinc-900">{s.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-pink-500 uppercase mb-3">Built for real type work</p>
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
                  className="bg-[#faf7f5] rounded-3xl p-6 ring-1 ring-pink-200/30 hover:ring-pink-300/60 transition-all group"
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-[800] mb-2 text-zinc-900">{f.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Use cases ─── */}
      <section className="py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold tracking-widest text-pink-500 uppercase mb-3">What you can create</p>
            <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05]">Typography teams actually need.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((u, i) => (
              <motion.div
                key={u.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group bg-white rounded-3xl overflow-hidden ring-1 ring-pink-200/30 hover:ring-pink-300/60 transition-all hover:-translate-y-1"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={u.img} alt={u.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-[800] mb-1 text-zinc-900">{u.title}</h3>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">{u.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Waitlist ─── */}
      <section id="waitlist" className="py-24 px-5 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-[12px] font-bold tracking-widest text-pink-500 uppercase mb-3">Get Access</p>
          <h2 className="text-3xl sm:text-5xl font-[900] tracking-tight leading-[1.05] mb-4">
            Be first when Haru opens up.
          </h2>
          <p className="text-[14px] text-zinc-500 mb-8 leading-relaxed">
            Join the waitlist. Shape the platform. Get early access to beautiful, brand-aware typography AI.
          </p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-pink-50 to-rose-50 ring-1 ring-pink-200/60 rounded-2xl p-6"
              >
                <Check className="w-10 h-10 text-pink-500 mx-auto mb-3" />
                <h3 className="text-lg font-[800] text-zinc-900 mb-1">You're on the list.</h3>
                <p className="text-[13px] text-zinc-500">We'll reach out when Haru opens the door.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleWaitlist}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 h-12 px-5 rounded-full bg-[#faf7f5] ring-1 ring-pink-200/60 text-[14px] outline-none focus:ring-pink-400 placeholder-zinc-400"
                />
                <button type="submit" className="h-12 px-6 rounded-full bg-zinc-900 text-white text-[14px] font-semibold hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                  Get Access <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-pink-500 via-rose-400 to-amber-400 rounded-[32px] p-12 sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
          }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-[900] text-white leading-[1.05] mb-4 tracking-tight">
              Stop starting from <span className="italic" style={{ fontFamily: "Georgia, serif" }}>scratch</span>.
            </h2>
            <p className="text-white/90 max-w-lg mx-auto text-[14px] leading-relaxed mb-8">
              Build typography that remembers your brand. Get early access to Haru.
            </p>
            <a href="#waitlist">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="h-12 px-8 bg-white text-zinc-900 text-[14px] font-semibold rounded-full shadow-xl flex items-center gap-2 mx-auto">
                Get Access <ArrowRight className="w-4 h-4" />
              </motion.button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-5 border-t border-pink-200/40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-zinc-400">
          <div className="flex items-center gap-2">
            <img src={HARU_ICON} alt="Haru" className="w-5 h-5 rounded" />
            <span className="font-semibold text-zinc-500">Haru · Typography that remembers.</span>
          </div>
          <span>© {new Date().getFullYear()} Haru — A TTT creative app</span>
        </div>
      </footer>

      {/* ─── Demo Modal ─── */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemo(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <img src={HARU_ICON} alt="Haru" className="w-7 h-7 rounded-lg" />
                  <span className="font-[800] text-zinc-900">Haru Studio · Preview</span>
                </div>
                <button onClick={() => setShowDemo(false)} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-2 block">Describe your wordmark</span>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 'Haru' — elegant serif, warm, editorial, feminine but confident, with a subtle sakura accent"
                    rows={3}
                    className="w-full p-4 rounded-2xl bg-[#faf7f5] ring-1 ring-pink-200/40 outline-none focus:ring-pink-400 text-[14px] resize-none"
                  />
                </label>
                <button
                  onClick={runDemo}
                  disabled={!prompt.trim() || generating}
                  className="w-full h-11 rounded-full bg-zinc-900 text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-700 transition-colors"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4" /> Generate Sample</>}
                </button>

                {generatedSample && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-8 rounded-2xl bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 ring-1 ring-pink-200/40 text-center"
                  >
                    <div className="text-[10px] font-bold tracking-widest text-pink-500 uppercase mb-3">Generated Wordmark</div>
                    <div className="text-5xl font-[900]" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", background: "linear-gradient(135deg, #ec4899, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {generatedSample.split(" ")[0] || "Haru"}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-4 italic">This is a preview. Full generation is available once you get access.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}