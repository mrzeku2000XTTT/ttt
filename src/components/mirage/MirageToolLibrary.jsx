import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, ImageIcon, Camera, Zap, Palette, Brain, Sparkles, Telescope,
  Mail, MessageSquarePlus, Twitter, Rss,
} from "lucide-react";
import { MIRAGE_TOOLS, MIRAGE_CATEGORIES } from "./mirageTools";

const ICONS = { ImageIcon, Camera, Zap, Palette, Brain, Sparkles, Telescope, Mail, MessageSquarePlus, Twitter, Rss, Search };

export default function MirageToolLibrary({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MIRAGE_TOOLS.filter((t) => {
      const matchCat = activeCat === "All" || t.category === activeCat;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        t.label.toLowerCase().includes(q) ||
        t.appName.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.sublabel.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border border-emerald-500/20 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg tracking-tight">Connect a TTT Tool</h2>
            <p className="text-white/40 text-xs">Each tool is a real TTT app · MIRAGE wires them together</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative px-6 py-4 border-b border-white/10 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-400/50 text-white text-sm outline-none placeholder:text-white/25"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {MIRAGE_CATEGORIES.map((cat) => {
              const isActive = activeCat === cat;
              const count = cat === "All" ? MIRAGE_TOOLS.length : MIRAGE_TOOLS.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold transition-all ${
                    isActive ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {cat} <span className={`text-[9px] ${isActive ? "text-black/50" : "text-white/30"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative p-5 max-h-[55vh] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filtered.map((tool, idx) => {
                const Icon = ICONS[tool.icon] || Sparkles;
                return (
                  <motion.button
                    key={tool.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => onPick(tool)}
                    className="group relative text-left p-3.5 bg-white/[0.025] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-400/40 rounded-2xl transition-all overflow-hidden"
                  >
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-25 blur-3xl transition-opacity duration-500`} />
                    <div className="relative flex items-start gap-3">
                      <div className="relative w-11 h-11 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/20">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.appName} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <h3 className="text-white font-black text-sm truncate">{tool.appName}</h3>
                          <span className="px-1.5 py-[1px] bg-white/5 border border-white/10 rounded text-white/50 text-[9px] font-bold uppercase tracking-wider">
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-emerald-300 text-[11px] font-bold mb-1">{tool.sublabel}</p>
                        <p className="text-white/45 text-xs leading-snug line-clamp-2">{tool.desc}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}