import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, RefreshCw, ArrowLeft, ArrowRight, Plus } from "lucide-react";

// Animated browser-style UI that walks through an app's "How It Works" steps.
// Auto-advances every 4.5s; user can click step dots or prev/next.
// Below the browser, renders expanded long-form text for SEO indexing.
export default function DocsHowItWorksBrowser({ app, docs }) {
  const steps = docs.howItWorks || [];
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);

  const go = useCallback((n) => setIdx((p) => (n < 0 ? steps.length - 1 : n >= steps.length ? 0 : n)), [steps.length]);
  const next = useCallback(() => go(idx + 1), [idx, go]);
  const prev = useCallback(() => go(idx - 1), [idx, go]);

  useEffect(() => {
    if (!auto || steps.length <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % steps.length), 4500);
    return () => clearInterval(t);
  }, [auto, steps.length]);

  if (!steps.length) return null;
  const step = steps[idx];
  const url = `tttxyz.base44.app/${app.path || ""}`;

  return (
    <div className="space-y-6">
      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden ring-1 ring-zinc-300/70 shadow-xl shadow-zinc-200/60 bg-white">
        <div className="flex items-center gap-2 px-3 h-10 bg-zinc-100 border-b border-zinc-200/70">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-1 ml-2 text-zinc-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            <ArrowRight className="w-3.5 h-3.5" />
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 mx-2 h-6 rounded-md bg-white ring-1 ring-zinc-200 flex items-center gap-1.5 px-2.5 text-[11px] text-zinc-500 font-mono overflow-hidden">
            <Lock className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{url}</span>
          </div>
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Viewport — animated content */}
        <div className="relative h-[220px] sm:h-[260px] bg-gradient-to-br from-zinc-50 to-zinc-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-xl font-[900] shadow-lg mb-3">
                {idx + 1}
              </div>
              <h3 className="text-[17px] sm:text-[19px] font-[800] text-zinc-900 tracking-tight">{step.title}</h3>
              <p className="text-[13px] sm:text-[14px] text-zinc-500 mt-1.5 max-w-md leading-relaxed">{step.desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200/70">
            <motion.div
              key={idx + (auto ? "a" : "p")}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: auto ? 4.5 : 0, ease: "linear" }}
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 h-12 bg-white border-t border-zinc-200/70">
          <button onClick={prev} className="flex items-center gap-1 text-[12px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setAuto(false); }}
                aria-label={`Step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-zinc-900" : "w-1.5 bg-zinc-300 hover:bg-zinc-400"}`}
              />
            ))}
          </div>
          <button onClick={next} className="flex items-center gap-1 text-[12px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded long-form detail for SEO indexing */}
      <div className="prose-docs">
        <h2 className="text-[18px] font-[800] text-zinc-900 tracking-tight mb-3">
          How {app.name} works — step by step
        </h2>
        <p className="text-[14px] leading-relaxed text-zinc-600 mb-4">
          {docs.overview} {app.name} runs entirely in your browser on the Kaspa network. Here's the full walkthrough of what happens from the moment you open the app to the moment the action settles on-chain.
        </p>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-900">{s.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc} {s.detail || ""}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[13px] leading-relaxed text-zinc-500 mt-5">
          {app.name} is part of the TTT super app — a Kaspa-native suite of {app.cat || "productivity"} tools. No account required; your wallet is your login. Every action in {app.name} is transparent, verifiable, and settled on the Kaspa Layer-1 DAG.
        </p>
      </div>
    </div>
  );
}