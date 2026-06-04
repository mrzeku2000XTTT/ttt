import React from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";

const SHEET_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bc53763d7_generated_image.png";
const EXPR_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/20c9f3b50_generated_image.png";
const POSE_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e7091459a_generated_image.png";

const PILLS = ["Research enhanced", "Triple agent check", "Multi-step prompt", "Motion cut ready"];

const PALETTE = ["#2b2f36", "#5b8dd6", "#6b4a3a", "#c98a52", "#e8c98a", "#f3efe6"];

function FloatTag({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/15 bg-[#13161d]/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40 backdrop-blur-md ${className}`}>
      {children}
    </span>
  );
}

export default function StoryboardHero({ onStart }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0c11] p-6 shadow-2xl shadow-black/60 sm:p-10">
      {/* ambient glow */}
      <div className="pointer-events-none absolute right-1/3 top-0 h-72 w-72 rounded-full bg-indigo-600/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-violet-600/25 blur-[100px]" />

      <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        {/* LEFT */}
        <div>
          <h1 className="text-[clamp(2.4rem,4.5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-tight text-white">
            Quick Storyboard Studio
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/60">
            Turn one idea into a polished storyboard sheet. Enter a rough idea. We research it, enhance the prompt,
            run triple agent checks, and generate a production-style character or storyboard board — plus a copy-ready
            motion cut video prompt.
          </p>

          <div className="mt-6 flex max-w-md flex-wrap gap-2.5">
            {PILLS.map((p) => (
              <span key={p} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85">
                {p}
              </span>
            ))}
          </div>

          <button
            onClick={onStart}
            className="mt-7 w-full max-w-md rounded-xl bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:opacity-95"
          >
            Start creating
          </button>
          <p className="mt-3 text-sm font-medium text-white/45">1000+ Presets, 3 Agent reviews, 16:9 Studio sheets</p>
        </div>

        {/* RIGHT — phone + sheet stack */}
        <div className="relative min-h-[420px]">
          {/* storyboard sheet */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute left-[14%] top-6 w-[78%] overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl shadow-black/50"
          >
            <img src={SHEET_IMG} alt="Storyboard sheet" className="h-full w-full object-cover" />
          </motion.div>

          {/* phone */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute left-0 top-20 z-20 w-[150px] overflow-hidden rounded-[1.6rem] border-[5px] border-[#1a1d24] bg-[#0e1016] shadow-2xl shadow-black/70 sm:w-[170px]"
          >
            <div className="flex items-center justify-between px-4 pt-2 text-[9px] font-semibold text-white/70">
              <span>9:41</span>
              <span className="h-3.5 w-3.5 rounded-md bg-violet-500" />
            </div>
            <div className="px-3 pb-3 pt-2">
              <div className="mb-2 flex items-center gap-1 text-[10px] text-white/50"><ChevronLeft className="h-3 w-3" /> Rough idea</div>
              <div className="rounded-lg bg-white/[0.06] p-2 text-[8px] leading-snug text-white/70">
                Turn one idea into a polished motion storyboard sheet.
              </div>
              <div className="mt-2 space-y-1.5">
                {["Agent check", "Multi-step prompt", "Generating assets"].map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2 py-1 text-[8px] text-white/70">
                    {t} <Check className="h-2.5 w-2.5 text-green-400" />
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[8px] font-bold text-white/50">Draft</div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <div className="aspect-video rounded bg-white/10" />
                <div className="aspect-video rounded bg-white/10" />
              </div>
            </div>
          </motion.div>

          {/* floating status tags */}
          <FloatTag className="absolute left-[18%] top-0 z-30"><Check className="mr-1.5 h-3.5 w-3.5 text-green-400" /> Concept Approved</FloatTag>
          <FloatTag className="absolute left-[16%] top-12 z-30"><Check className="mr-1.5 h-3.5 w-3.5 text-green-400" /> Triple Agent Review Passed</FloatTag>
          <FloatTag className="absolute bottom-16 left-[34%] z-30">Refining Prompts</FloatTag>
          <FloatTag className="absolute bottom-2 left-[36%] z-30">Generating Assets</FloatTag>

          {/* right asset cards */}
          <div className="absolute right-0 top-2 z-20 w-[40%] space-y-3">
            <div className="rounded-xl border border-indigo-400/40 bg-[#10131a]/90 p-2.5 shadow-xl shadow-black/40 backdrop-blur">
              <p className="mb-1.5 text-xs font-bold text-white">Expressions</p>
              <img src={EXPR_IMG} alt="Expressions" className="w-full rounded-md object-cover" />
            </div>
            <div className="rounded-xl border border-indigo-400/40 bg-[#10131a]/90 p-2.5 shadow-xl shadow-black/40 backdrop-blur">
              <p className="mb-1.5 text-xs font-bold text-white">Action poses</p>
              <img src={POSE_IMG} alt="Action poses" className="w-full rounded-md object-cover" />
            </div>
            <div className="rounded-xl border border-indigo-400/40 bg-[#10131a]/90 p-2.5 shadow-xl shadow-black/40 backdrop-blur">
              <p className="mb-2 text-xs font-bold text-white">Key details &amp; Palette</p>
              <div className="flex overflow-hidden rounded-md">
                {PALETTE.map((c) => (
                  <div key={c} className="h-5 flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}