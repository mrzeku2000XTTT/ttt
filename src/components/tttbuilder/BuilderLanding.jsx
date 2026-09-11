import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ClipboardList, ArrowRight, KeyRound } from "lucide-react";
import ModelSelector from "@/components/tttbuilder/ModelSelector";
import RecentProjects from "@/components/tttbuilder/RecentProjects";
import TemplateGallery from "@/components/tttbuilder/TemplateGallery";
import KaspaMark from "@/components/tttbuilder/landing/KaspaMark";
import BuilderLandingFeatures from "@/components/tttbuilder/landing/BuilderLandingFeatures";
import BuilderLandingBuilds from "@/components/tttbuilder/landing/BuilderLandingBuilds";
import BuilderLandingBanner from "@/components/tttbuilder/landing/BuilderLandingBanner";
import BuilderLandingFooter from "@/components/tttbuilder/landing/BuilderLandingFooter";

const HERO_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e44422176_generated_image.png";
const MOUNTAIN_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b33822334_generated_image.png";

const STATS = [
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c0230fe4f_generated_image.png", label: "L1 Speed", value: "1 Sec", sub: "Block Time" },
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ec28de474_generated_image.png", label: "Low Fees", value: "< $0.01", sub: "Per Tx" },
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6133bedbf_generated_image.png", label: "Scalable", value: "∞", sub: "BlockDAG" },
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9c15a05f3_generated_image.png", label: "Full Control", value: "Your Keys", sub: "BYO & Secure" },
];

// The full TTT Builder landing — dark Kaspa theme with a global mountain
// backdrop, hero with the working build input, stats, recent projects,
// features, featured builds, economy banner, templates, footer.
export default function BuilderLanding({
  prompt, setPrompt, onGenerate, onExample, examples, loading,
  model, onModelChange, chatMode, onChatModeChange,
  onOpenProjects, onOpenProject, standalone,
}) {
  const inputRef = useRef(null);
  const templatesRef = useRef(null);

  const focusInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputRef.current?.focus(), 500);
  };
  const scrollToTemplates = () => templatesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-[#0a0a0a] text-white"
      style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
    >
      {/* Global dark mountain backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={MOUNTAIN_BG} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/85 via-[#0a0a0a]/75 to-[#0a0a0a]" />
      </div>

      <div className="relative z-10">
        {/* ─── HERO ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] mb-5">
              VIBE CODING
              <span className="w-1 h-1 rounded-full bg-[#00ff99]" />
              <span className="inline-flex items-center gap-1.5 text-[#00ff99]">
                <KaspaMark size={14} /> KASPA L1
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-[2.4rem] sm:text-5xl xl:text-6xl font-bold tracking-[-0.03em] leading-[1.02] mb-5"
            >
              Build the next generation of <span className="text-[#00ff99]">Kaspa economic</span> agentic applications.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[#a0a0a0] text-base sm:text-lg max-w-xl mb-7 leading-relaxed"
            >
              Describe what you want. TTT Builder plans, codes and ships a complete Kaspa-ready app — live data, wallet kit and all. No code needed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <button
                onClick={focusInput}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#00ff99] text-black text-sm font-bold hover:bg-[#33ffb0] transition-colors shadow-[0_8px_28px_rgba(0,255,153,0.35)]"
              >
                Start Vibe Coding <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToTemplates}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-transparent border border-[#00ff99]/60 text-[#00ff99] text-sm font-bold hover:bg-[#00ff99]/10 transition-colors"
              >
                Explore Templates
              </button>
            </motion.div>

            {/* Main build input */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              ref={inputRef}
              className="max-w-2xl"
            >
              <div className="flex flex-wrap items-center gap-2 bg-[#121212]/90 backdrop-blur-sm border border-[#00ff99]/25 focus-within:border-[#00ff99] rounded-2xl p-2 transition-all shadow-[0_0_24px_rgba(0,255,153,0.06)]">
                <div className="min-w-0 max-w-[48%] sm:max-w-none overflow-hidden flex-shrink">
                  <ModelSelector value={model} onChange={onModelChange} disabled={loading} />
                </div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(prompt); } }}
                  placeholder="Describe your app — e.g. 'Kaspa staking dashboard'"
                  rows={2}
                  className="flex-1 min-w-0 basis-full sm:basis-0 order-first sm:order-none bg-transparent outline-none text-white placeholder:text-white/30 text-sm px-3 py-3 resize-none"
                />
                <button
                  type="button"
                  onClick={() => onChatModeChange(chatMode === "plan" ? "build" : "plan")}
                  disabled={loading}
                  title="Plan mode — talk through your idea before building"
                  className={`flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex-shrink-0 ${
                    chatMode === "plan" ? "bg-[#00ff99] text-black" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Plan</span>
                </button>
                <button
                  onClick={() => onGenerate(prompt)}
                  disabled={!prompt.trim() || loading}
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#00ff99] text-black hover:bg-[#33ffb0] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  title={chatMode === "plan" ? "Send plan" : "Build"}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>

              {standalone && (
                <button
                  onClick={() => window.dispatchEvent(new Event("ttt-open-onboarding"))}
                  className="mt-3 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-[#00ff99]/10 border border-[#00ff99]/40 text-[#00ff99] text-xs font-bold hover:bg-[#00ff99]/20 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Setup wizard
                </button>
              )}

              {/* Example prompts */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {(examples || []).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => onExample(ex)}
                    className="text-xs text-white/40 hover:text-[#00ff99] transition-colors"
                  >
                    {ex.slice(0, 38)}…
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative order-first lg:order-none"
          >
            <div className="relative rounded-3xl overflow-hidden bg-black border border-[#00ff99]/20 shadow-[0_0_48px_rgba(0,255,153,0.12)]">
              <img src={HERO_IMAGE} alt="Kaspa agentic build" className="w-full h-full object-cover" />
              {/* Terminal snippet */}
              <div className="absolute left-4 right-4 bottom-4 rounded-xl bg-black/70 backdrop-blur-md border border-[#00ff99]/25 px-4 py-3 font-mono text-[#00ff99] text-xs sm:text-sm leading-relaxed">
                <p>&gt; build()</p>
                <p>&gt; deploy()</p>
                <p>&gt; earn()<span className="animate-pulse">_</span></p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── STATS ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s, i) => {
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/15 rounded-2xl p-4 sm:p-5 flex items-start gap-3 hover:border-[#00ff99]/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#00ff99]/10">
                    <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{s.label}</p>
                    <p className="text-lg sm:text-xl font-bold leading-tight text-white">{s.value}</p>
                    <p className="text-[11px] text-white/40">{s.sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ─── RECENT PROJECTS ─── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
          <RecentProjects onOpen={onOpenProject} onSeeAll={onOpenProjects} />
        </section>

        <BuilderLandingFeatures />

        <BuilderLandingBuilds onPick={onGenerate} onViewAll={onOpenProjects} />

        <BuilderLandingBanner />

        {/* ─── TEMPLATES ─── */}
        <section ref={templatesRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-14 scroll-mt-16">
          <TemplateGallery onPick={(t) => onGenerate(t.prompt)} disabled={loading} />
        </section>

        <BuilderLandingFooter onGetStarted={focusInput} />
      </div>
    </motion.div>
  );
}