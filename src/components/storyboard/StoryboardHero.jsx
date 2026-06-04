import React from "react";
import { motion } from "framer-motion";
import { SearchCheck, Users, Layers3, Film, Sparkles } from "lucide-react";

const PILLS = [
  { icon: SearchCheck, label: "Research enhanced" },
  { icon: Users, label: "Triple agent check" },
  { icon: Layers3, label: "Multi-step prompt" },
  { icon: Film, label: "Motion cut ready" },
];

const STATS = [
  { value: "1000+", label: "Presets" },
  { value: "3", label: "Agent reviews" },
  { value: "16:9", label: "Studio sheets" },
];

export default function StoryboardHero({ isDark = false, onStart }) {
  return (
    <section
      className={`relative overflow-hidden rounded-[2.5rem] border p-7 transition sm:p-12 ${
        isDark
          ? "border-white/10 bg-gradient-to-br from-[#0b0b14] via-[#0a0a12] to-[#070710] shadow-2xl shadow-black/60"
          : "border-zinc-200 bg-gradient-to-br from-white via-[#fbf7ef] to-[#f3ece0] shadow-xl shadow-zinc-200/70"
      }`}
    >
      {/* glow blobs */}
      <div className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-indigo-600/25" : "bg-amber-300/40"}`} />
      <div className={`pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-sky-500/20" : "bg-stone-300/40"}`} />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] ${
              isDark ? "border-white/15 bg-white/5 text-amber-200" : "border-amber-300/60 bg-amber-100/60 text-amber-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Quick Storyboard Studio
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-[clamp(2.4rem,5vw,4.2rem)] font-black leading-[1.02] tracking-tight"
          >
            Turn one idea into a
            <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${isDark ? "from-sky-300 via-indigo-300 to-fuchsia-300" : "from-amber-600 via-orange-600 to-stone-800"}`}>
              polished storyboard sheet.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`mt-5 max-w-xl text-lg leading-8 ${isDark ? "text-white/65" : "text-zinc-600"}`}
          >
            Enter a rough idea. We research it, enhance the prompt, run triple agent checks, and generate a
            production-style character or storyboard board — plus a copy-ready motion cut video prompt.
          </motion.p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black backdrop-blur-xl ${
                  isDark ? "bg-white/10 text-white" : "bg-white text-zinc-800 shadow-sm"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onStart}
              className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-black transition hover:scale-[1.02] ${
                isDark ? "bg-white text-black hover:bg-white/90" : "bg-zinc-950 text-white hover:bg-zinc-800"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Start creating
            </button>
            <div className="flex items-center gap-5">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-black">{s.value}</p>
                  <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-white/45" : "text-zinc-500"}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {["Expressions", "Action poses", "Key details", "Palette"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className={`aspect-[4/3] rounded-2xl border p-4 backdrop-blur-2xl transition ${
                isDark ? "border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30" : "border-zinc-200 bg-white shadow-sm"
              }`}
            >
              <div className={`mb-3 h-12 w-12 rounded-full ${isDark ? "bg-gradient-to-br from-white via-sky-200 to-indigo-500 shadow-lg shadow-sky-500/20" : "bg-gradient-to-br from-amber-200 to-stone-700"}`} />
              <p className={`text-sm font-black uppercase tracking-wide ${isDark ? "text-white/85" : "text-zinc-800"}`}>{item}</p>
              <div className={`mt-2 h-1.5 w-3/4 rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
              <div className={`mt-1.5 h-1.5 w-1/2 rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}