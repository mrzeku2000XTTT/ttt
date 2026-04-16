import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Globe, Code, Copy, CheckCircle2, Eye, Wand2, AlertCircle, Zap, Layers, Sparkles, ArrowRight, CornerDownLeft, Target, Cpu, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { id: "fetch", label: "Fetching site HTML & styles", icon: Globe },
  { id: "screenshot", label: "Capturing visual layout", icon: Eye },
  { id: "analyze", label: "Analyzing design system", icon: Layers },
  { id: "generate", label: "Generating React component", icon: Sparkles },
];

const EXAMPLES = ["stripe.com", "linear.app", "vercel.com", "notion.so"];

const FEATURES = [
  {
    icon: Target,
    title: "Pixel-Perfect Cloning",
    desc: "Every section, color, font and spacing recreated with precision using Tailwind CSS.",
    gradient: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    icon: Cpu,
    title: "Claude Sonnet AI",
    desc: "Powered by Anthropic's most advanced model for unmatched code quality.",
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Zap,
    title: "60-Second Output",
    desc: "From URL to production-ready React + Tailwind component in under a minute.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Code,
    title: "Drop-in Ready",
    desc: "Clean JSX output. No extra dependencies. Just paste into your project and ship.",
    gradient: "from-cyan-500/20 to-teal-500/20",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Paste any URL", desc: "Drop a public website URL — marketing pages, landing pages, SaaS homepages." },
  { step: "02", title: "AI analyzes it", desc: "Claude Sonnet scrapes the HTML, captures the layout, and extracts the full design system." },
  { step: "03", title: "Get React code", desc: "Receive a clean, self-contained React + Tailwind component ready to use instantly." },
];

export default function OneShotPage() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("code");

  const isLoading = step >= 0 && step < STEPS.length;

  const handleClone = async () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
    setError(null);
    setResult(null);
    setStep(0);
    try {
      setStep(0);
      const scrapeRes = await base44.functions.invoke("uiClonerScrape", { url: finalUrl });
      if (scrapeRes.data?.error) throw new Error(scrapeRes.data.error);
      const { html, screenshot_url } = scrapeRes.data;
      setStep(1);
      await new Promise(r => setTimeout(r, 600));
      setStep(2);
      await new Promise(r => setTimeout(r, 400));
      setStep(3);
      const genRes = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a senior frontend engineer. Recreate the following website's UI/UX 1:1 as a single self-contained React component.

URL: ${finalUrl}

HTML/DOM snapshot:
\`\`\`html
${html?.slice(0, 12000)}
\`\`\`

${screenshot_url ? `Screenshot URL for visual reference: ${screenshot_url}` : ""}

Instructions:
- Output ONLY valid JSX — a single default-exported React functional component named ClonedUI
- Use only Tailwind CSS classes for ALL styling. No inline styles unless absolutely necessary.
- Recreate every visible section: navbar, hero, features, footer etc.
- Match colors, fonts, spacing, layout, and responsive behavior as closely as possible
- Use placeholder <img> tags with realistic src URLs from unsplash if images are needed
- Include icons using lucide-react if needed
- Do NOT include any import statements — assume React, Tailwind, and lucide-react are already available
- Do NOT wrap in markdown code blocks — output pure JSX only
- Make it fully responsive (mobile + desktop)`,
        file_urls: screenshot_url ? [screenshot_url] : undefined,
      });
      setStep(STEPS.length);
      setResult({ code: genRes, screenshot_url, url: finalUrl });
    } catch (err) {
      setError(err.message || "Something went wrong. Try a different URL.");
      setStep(-1);
    }
  };

  const handleCopy = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => { setResult(null); setStep(-1); setUrl(""); setError(null); };

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans overflow-x-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-radial from-violet-700/25 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-gradient-radial from-cyan-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[-5%] w-[500px] h-[500px] bg-gradient-radial from-rose-600/10 to-transparent rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-20 border-b border-white/[0.05] bg-black/30 backdrop-blur-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-violet-500/30 ring-1 ring-white/10">
              <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ee7187675_generated_image.png" alt="OneShot" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xl tracking-tight">OneShot</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 border border-violet-500/30 rounded-full px-2.5 py-0.5 bg-violet-500/10">Beta</span>
          </div>
          <Link to="/AppStore">
            <button className="text-[13px] text-white/40 hover:text-white/70 transition-colors">← Back to Apps</button>
          </Link>
        </div>
      </nav>

      <div className="relative z-10">

        {/* ─── HERO ─── */}
        <AnimatePresence mode="wait">
          {!result && !isLoading && (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -30 }}>

              <section className="pt-28 pb-20 px-6 text-center">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[12px] text-white/50 mb-8 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Powered by Claude Sonnet 4.6
                  </div>

                  {/* Headline */}
                  <h1 className="text-6xl sm:text-8xl font-black tracking-tight leading-[0.88] mb-6 max-w-4xl mx-auto">
                    Clone any UI<br />
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                        in one shot.
                      </span>
                    </span>
                  </h1>

                  <p className="text-white/40 text-xl max-w-lg mx-auto leading-relaxed mb-14">
                    Paste any URL. Get a pixel-perfect React + Tailwind component in under 60 seconds.
                  </p>

                  {/* URL Input */}
                  <div className="max-w-2xl mx-auto mb-5">
                    <div className="relative group">
                      {/* Glow border on focus */}
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/0 via-violet-500/0 to-pink-500/0 group-focus-within:from-cyan-500/60 group-focus-within:via-violet-500/60 group-focus-within:to-pink-500/60 rounded-2xl blur-sm transition-all duration-500" />
                      <div className="relative flex items-center bg-white/[0.05] border border-white/[0.08] group-focus-within:border-transparent rounded-2xl overflow-hidden backdrop-blur-sm">
                        <Globe className="absolute left-5 w-4 h-4 text-white/25 flex-shrink-0 pointer-events-none" />
                        <input
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && !isLoading && handleClone()}
                          placeholder="https://stripe.com"
                          className="flex-1 bg-transparent pl-12 pr-4 py-4 text-white placeholder:text-white/20 outline-none text-base"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleClone}
                          disabled={isLoading || !url.trim()}
                          className="m-2 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl px-6 py-3 text-sm transition-all shadow-lg shadow-violet-500/30 flex-shrink-0"
                        >
                          <Wand2 className="w-4 h-4" />
                          Clone UI
                          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-white/20 rounded px-1.5 py-0.5 text-[10px] font-mono">↵</kbd>
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/20 mt-3 text-left pl-1">Best on public marketing pages. Auth-gated pages may have limited results.</p>
                  </div>

                  {/* Example chips */}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-[11px] text-white/25 mr-1">Try:</span>
                    {EXAMPLES.map(ex => (
                      <motion.button
                        key={ex}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setUrl("https://" + ex)}
                        className="text-[12px] text-white/40 hover:text-cyan-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 rounded-full px-3.5 py-1.5 transition-all"
                      >
                        {ex}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* ─── HOW IT WORKS ─── */}
              <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3">How it works</p>
                    <h2 className="text-4xl font-black tracking-tight">Three steps. Zero friction.</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
                    {/* Connector line */}
                    <div className="hidden sm:block absolute top-8 left-[calc(16%+2rem)] right-[calc(16%+2rem)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    {HOW_IT_WORKS.map((item, i) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                        className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.05] transition-all group"
                      >
                        <div className="text-5xl font-black text-white/[0.06] group-hover:text-white/[0.1] transition-all mb-4 leading-none">{item.step}</div>
                        <h3 className="font-bold text-base mb-2 text-white">{item.title}</h3>
                        <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ─── FEATURES ─── */}
              <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 mb-3">Features</p>
                    <h2 className="text-4xl font-black tracking-tight">Built for developers.</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FEATURES.map((f, i) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center mb-4 ${f.iconColor}`}>
                          <f.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-sm mb-2 text-white">{f.title}</h3>
                        <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ─── CTA ─── */}
              <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-transparent border border-white/[0.08] rounded-3xl p-12">
                      <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-5" />
                      <h2 className="text-4xl font-black tracking-tight mb-4">Ready to clone?</h2>
                      <p className="text-white/40 mb-8">Paste your first URL and get a production-ready component instantly.</p>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold rounded-xl px-8 py-4 text-base shadow-2xl shadow-violet-500/30 transition-all"
                      >
                        <Wand2 className="w-5 h-5" />
                        Try OneShot now
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Footer */}
              <div className="border-t border-white/[0.05] py-8 px-6 text-center">
                <p className="text-white/20 text-[12px]">OneShot · Part of the TTT ecosystem · Powered by Claude Sonnet</p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── LOADING ─── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[80vh] flex items-center justify-center px-6"
            >
              <div className="max-w-md w-full">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-white/10 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/20">
                    <Loader2 className="w-9 h-9 text-violet-400 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Cloning in progress…</h2>
                  <p className="text-white/30 text-sm font-mono truncate max-w-xs mx-auto">{url}</p>
                </div>

                <div className="space-y-3">
                  {STEPS.map((s, i) => {
                    const done = step > i;
                    const active = step === i;
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-4 rounded-xl px-5 py-4 border transition-all duration-500 ${done ? "bg-emerald-500/5 border-emerald-500/20" : active ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white/[0.02] border-white/[0.05]"}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-emerald-500/20" : active ? "bg-cyan-500/20" : "bg-white/5"}`}>
                          {done ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> : active ? <Loader2 className="w-4.5 h-4.5 text-cyan-400 animate-spin" /> : <Icon className="w-4.5 h-4.5 text-white/20" />}
                        </div>
                        <span className={`text-sm font-medium flex-1 ${done ? "text-emerald-400" : active ? "text-cyan-300" : "text-white/25"}`}>{s.label}</span>
                        {done && <span className="text-emerald-500 text-xs font-bold">✓</span>}
                        {active && <div className="flex gap-1">{[0,1,2].map(d => <div key={d} className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}</div>}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ERROR ─── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-lg mx-auto px-6 py-20">
              <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-red-300 mb-1">Clone failed</p>
                    <p className="text-red-300/60 text-sm">{error}</p>
                  </div>
                </div>
              </div>
              <div className="text-center mt-6">
                <button onClick={reset} className="text-white/40 hover:text-white text-sm underline underline-offset-4 transition-colors">
                  ← Try a different URL
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── RESULT ─── */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto px-6 py-12 space-y-6">
              {/* Success banner */}
              <div className="flex items-center justify-between bg-emerald-500/8 border border-emerald-500/20 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-bold text-sm">Clone complete!</p>
                    <p className="text-white/30 text-[11px] font-mono">{result.url}</p>
                  </div>
                </div>
                <button onClick={reset}
                  className="text-white/40 hover:text-white text-xs border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 hover:bg-white/5 transition-all">
                  ← Clone another
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 w-fit border border-white/[0.07]">
                {[
                  { id: "code", label: "React Code", icon: Code },
                  ...(result.screenshot_url ? [{ id: "preview", label: "Screenshot", icon: Eye }] : [])
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-white/10" : "text-white/35 hover:text-white/60"}`}>
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "code" && (
                <div className="rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60">
                  <div className="flex items-center justify-between bg-zinc-950 border-b border-white/[0.07] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                      </div>
                      <span className="text-[11px] text-white/25 font-mono">ClonedUI.jsx</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/10"}`}
                    >
                      {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy code</>}
                    </motion.button>
                  </div>
                  <div className="bg-[#050507] overflow-auto max-h-[640px]">
                    <pre className="p-6 text-[12px] text-emerald-300/80 font-mono leading-relaxed whitespace-pre-wrap">
                      {result.code}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "preview" && result.screenshot_url && (
                <div className="rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60">
                  <div className="bg-zinc-950 border-b border-white/[0.07] px-5 py-3.5 flex items-center gap-2.5">
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <Globe className="w-3.5 h-3.5 text-white/25" />
                    <span className="text-[11px] text-white/25 font-mono truncate">{result.url}</span>
                  </div>
                  <img src={result.screenshot_url} alt="Site screenshot" className="w-full" />
                </div>
              )}

              <p className="text-[11px] text-white/20 text-center pb-6">
                Paste the code into a new page file — it's production-ready. 🚀
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}