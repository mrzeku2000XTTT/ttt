import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Sparkles, ArrowRight } from "lucide-react";
import { MOTION_PRESETS } from "@/components/motion/motionPresets";
import { MOTION_PRESETS_EXTRA } from "@/components/motion/motionPresetsExtra";

const ALL_PRESETS = [...MOTION_PRESETS, ...MOTION_PRESETS_EXTRA];
const ALL_CATEGORIES = ["All", ...Array.from(new Set(ALL_PRESETS.map((p) => p.category)))];

export default function MotionPresetMarketplace({ open, onClose, onPick }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = ALL_PRESETS.filter((p) => {
    const inCat = category === "All" || p.category === category;
    const q = query.trim().toLowerCase();
    const inQ = !q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.vibe.toLowerCase().includes(q);
    return inCat && inQ;
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[88vh] bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight">Preset Marketplace</h2>
                  <p className="text-white/40 text-[11px]">Curated vibe-code prompts. Pick one and generate.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search presets…"
                  className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 flex-1"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {ALL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors ${
                      category === c
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-white/40 text-sm">No presets match your search.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((p) => (
                    <PresetCard key={p.id} preset={p} onPick={() => { onPick(p); onClose(); }} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PresetCard({ preset, onPick }) {
  return (
    <button
      onClick={onPick}
      className="group text-left rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-white/30 hover:bg-white/[0.06] transition-all"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
        <img
          src={preset.preview}
          alt={preset.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-tr ${preset.accent} opacity-30 mix-blend-overlay`} />
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[9px] font-bold tracking-widest uppercase">
            {preset.category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-white font-black text-base tracking-tight">{preset.name}</h3>
          <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-white/60 text-[12px] mb-2 leading-snug">{preset.tagline}</p>
        <p className="text-white/30 text-[10px] uppercase tracking-wider font-bold">{preset.vibe}</p>
      </div>
    </button>
  );
}