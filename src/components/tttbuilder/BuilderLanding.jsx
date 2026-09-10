import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ClipboardList, ArrowRight, Zap, Coins, Infinity as InfinityIcon, KeyRound } from "lucide-react";
import ModelSelector from "@/components/tttbuilder/ModelSelector";
import RecentProjects from "@/components/tttbuilder/RecentProjects";
import TemplateGallery from "@/components/tttbuilder/TemplateGallery";
import BuilderLandingFeatures from "@/components/tttbuilder/landing/BuilderLandingFeatures";
import BuilderLandingBuilds from "@/components/tttbuilder/landing/BuilderLandingBuilds";
import BuilderLandingBanner from "@/components/tttbuilder/landing/BuilderLandingBanner";
import BuilderLandingFooter from "@/components/tttbuilder/landing/BuilderLandingFooter";

const HERO_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/feac0b803_generated_image.png";

const STATS = [
  { icon: Zap, label: "L1 Speed", value: "1 Sec", sub: "Block Time" },
  { icon: Coins, label: "Low Fees", value: "< $0.01", sub: "Per Tx" },
  { icon: InfinityIcon, label: "Scalable", value: "∞", sub: "BlockDAG" },
  { icon: KeyRound, label: "Full Control", value: "Your Keys", sub: "BYO & Secure" },
];

// The full TTT Builder landing — hero with the working build input, stats,
// recent projects, features, featured builds, economy banner, templates, footer.
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
      className="bg-[#F9F7F2] text-[#1A1A1A]"
      style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}
    >
      {/* ─── HERO ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-[#1A1A1A] mb-5">
            VIBE CODING
            <span className="w-1 h-1 rounded-full bg-[#00E68E]" />
            <span className="text-[#00E68E]">KASPA L1</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-[2.4rem] sm:text-5xl xl:text-6xl font-bold tracking-[-0.03em] leading-[1.02] mb-5"
          >
            Build the next generation of <span className="text-[#00E68E]">Kaspa economic</span> agentic applications.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#666] text-base sm:text-lg max-w-xl mb-7 leading-relaxed"
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
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#00E68E] text-[#1A1A1A] text-sm font-bold hover:bg-[#0ac97e] transition-colors shadow-[0_8px_24px_rgba(0,230,142,0.35)]"
            >
              Start Vibe Coding <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToTemplates}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white border border-[#ddd9d3] text-[#1A1A1A] text-sm font-bold hover:border-[#00E68E] hover:text-[#00B36B] transition-colors"
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
            <div className="flex flex-wrap items-center gap-2 bg-white border border-[#e5e1da] focus-within:border-[#00E68E] rounded-2xl p-2 transition-all shadow-[0_2px_12px_rgba(26,26,26,0.05)]">
              <div className="min-w-0 max-w-[48%] sm:max-w-none overflow-hidden flex-shrink">
                <ModelSelector variant="light" value={model} onChange={onModelChange} disabled={loading} />
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onGenerate(prompt); } }}
                placeholder="Describe your app — e.g. 'Kaspa staking dashboard'"
                rows={2}
                className="flex-1 min-w-0 basis-full sm:basis-0 order-first sm:order-none bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#aaa6a0] text-sm px-3 py-3 resize-none"
              />
              <button
                type="button"
                onClick={() => onChatModeChange(chatMode === "plan" ? "build" : "plan")}
                disabled={loading}
                title="Plan mode — talk through your idea before building"
                className={`flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex-shrink-0 ${
                  chatMode === "plan" ? "bg-[#1A1A1A] text-white" : "bg-[#F9F7F2] text-[#5a554f] hover:bg-[#f0ede7] border border-[#e5e1da]"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Plan</span>
              </button>
              <button
                onClick={() => onGenerate(prompt)}
                disabled={!prompt.trim() || loading}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#00E68E] text-[#1A1A1A] hover:bg-[#0ac97e] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                title={chatMode === "plan" ? "Send plan" : "Build"}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>

            {standalone && (
              <button
                onClick={() => window.dispatchEvent(new Event("ttt-open-onboarding"))}
                className="mt-3 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-[#00E68E]/10 border border-[#00E68E]/40 text-[#00B36B] text-xs font-bold hover:bg-[#00E68E]/20 transition-colors"
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
                  className="text-xs text-[#8a8580] hover:text-[#1A1A1A] transition-colors"
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
          <div className="relative rounded-3xl overflow-hidden bg-[#1A1A1A] shadow-[0_24px_64px_rgba(26,26,26,0.25)] border border-[#1A1A1A]">
            <img src={HERO_IMAGE} alt="Kaspa agentic build" className="w-full h-full object-cover" />
            {/* Terminal snippet */}
            <div className="absolute left-4 right-4 bottom-4 rounded-xl bg-black/70 backdrop-blur-md border border-[#00E68E]/25 px-4 py-3 font-mono text-[#00E68E] text-xs sm:text-sm leading-relaxed">
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
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-[#e8e4de] rounded-2xl p-4 sm:p-5 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#00E68E]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#00B36B]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a8580]">{s.label}</p>
                  <p className="text-lg sm:text-xl font-bold leading-tight">{s.value}</p>
                  <p className="text-[11px] text-[#8a8580]">{s.sub}</p>
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
    </motion.div>
  );
}