import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Brain, Image as ImageIcon, Mail, Clock, Filter, Webhook, Database, GitBranch,
  Search, Sparkles, Zap, Cog, Send, Twitter,
} from "lucide-react";

export const NODE_TEMPLATES = [
  {
    type: "ai_prompt",
    label: "AI Prompt",
    icon: "Brain",
    color: "from-purple-500 to-pink-500",
    desc: "Run a prompt through the LLM",
    category: "AI",
    tags: ["text", "llm", "generate"],
    defaultConfig: { prompt: "Write a haiku about Kaspa" },
  },
  {
    type: "ai_image",
    label: "AI Image",
    icon: "ImageIcon",
    color: "from-cyan-500 to-blue-500",
    desc: "Generate an image with AI",
    category: "AI",
    tags: ["image", "art", "visual"],
    defaultConfig: { prompt: "A glowing crystal in space, cinematic" },
  },
  {
    type: "send_email",
    label: "Send Email",
    icon: "Mail",
    color: "from-amber-500 to-orange-500",
    desc: "Email the result somewhere",
    category: "Action",
    tags: ["email", "notify", "send"],
    defaultConfig: { to: "", subject: "RMX Workflow", body: "{{result}}" },
  },
  {
    type: "send_to_x",
    label: "Send to X",
    icon: "Twitter",
    color: "from-sky-500 to-blue-600",
    desc: "Copy previous output and open X compose",
    category: "Action",
    tags: ["x", "twitter", "tweet", "share"],
    defaultConfig: {},
  },
  {
    type: "webhook",
    label: "Webhook",
    icon: "Webhook",
    color: "from-rose-500 to-red-500",
    desc: "POST result to a URL",
    category: "Action",
    tags: ["http", "api", "post"],
    defaultConfig: { url: "https://", method: "POST" },
  },
  {
    type: "delay",
    label: "Delay",
    icon: "Clock",
    color: "from-zinc-500 to-zinc-600",
    desc: "Wait N seconds",
    category: "Logic",
    tags: ["wait", "pause", "timer"],
    defaultConfig: { seconds: 2 },
  },
  {
    type: "filter",
    label: "Filter",
    icon: "Filter",
    color: "from-emerald-500 to-green-500",
    desc: "Continue only if previous output contains text",
    category: "Logic",
    tags: ["condition", "check", "if"],
    defaultConfig: { contains: "" },
  },
  {
    type: "branch",
    label: "Branch",
    icon: "GitBranch",
    color: "from-yellow-500 to-amber-500",
    desc: "Mark a branching point",
    category: "Logic",
    tags: ["split", "fork", "path"],
    defaultConfig: {},
  },
  {
    type: "save_data",
    label: "Save Output",
    icon: "Database",
    color: "from-indigo-500 to-violet-500",
    desc: "Store result for the next step",
    category: "Data",
    tags: ["store", "persist", "save"],
    defaultConfig: {},
  },
];

const ICONS = { Brain, ImageIcon, Mail, Clock, Filter, Webhook, Database, GitBranch, Twitter };

const CATEGORIES = [
  { id: "All", label: "All", icon: Sparkles },
  { id: "AI", label: "AI", icon: Brain },
  { id: "Action", label: "Action", icon: Send },
  { id: "Logic", label: "Logic", icon: Cog },
  { id: "Data", label: "Data", icon: Database },
];

export default function RMXNodeLibrary({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NODE_TEMPLATES.filter((tpl) => {
      const matchCat = activeCat === "All" || tpl.category === activeCat;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        tpl.label.toLowerCase().includes(q) ||
        tpl.desc.toLowerCase().includes(q) ||
        tpl.tags.some((t) => t.includes(q))
      );
    });
  }, [query, activeCat]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-gradient-to-br from-zinc-950 via-zinc-950 to-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Glow accents */}
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 rounded-2xl blur-md opacity-60" />
              <div className="relative w-full h-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                <Zap className="relative w-5 h-5 text-white drop-shadow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-black text-lg tracking-tight">Node Library</h2>
                <span className="px-1.5 py-0.5 bg-white/[0.06] border border-white/10 rounded-md text-white/60 text-[10px] font-bold">
                  {NODE_TEMPLATES.length}
                </span>
              </div>
              <p className="text-white/40 text-xs">Pick a step to add to your workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Category pills */}
        <div className="relative px-6 py-4 border-b border-white/[0.06] space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 focus:border-purple-400/50 focus:bg-white/[0.06] text-white text-sm outline-none transition-colors placeholder:text-white/25"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCat === cat.id;
              const count =
                cat.id === "All"
                  ? NODE_TEMPLATES.length
                  : NODE_TEMPLATES.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white border border-white/10"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                  <span className={`text-[9px] font-bold ${isActive ? "text-black/50" : "text-white/30"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="relative p-5 max-h-[55vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-white/30" />
              </div>
              <p className="text-white/50 text-sm font-bold">No nodes match</p>
              <p className="text-white/30 text-xs mt-1">Try a different search</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filtered.map((tpl, idx) => {
                  const Icon = ICONS[tpl.icon];
                  return (
                    <motion.button
                      key={tpl.type}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => onPick(tpl)}
                      className="group relative text-left p-3.5 bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/20 rounded-2xl transition-all overflow-hidden"
                    >
                      {/* Hover glow */}
                      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${tpl.color} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`} />

                      <div className="relative flex items-start gap-3">
                        <div className="relative w-11 h-11 flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br ${tpl.color} rounded-2xl blur-md opacity-50 group-hover:opacity-90 transition-opacity`} />
                          <div className={`relative w-full h-full bg-gradient-to-br ${tpl.color} rounded-2xl flex items-center justify-center shadow-xl border border-white/20 overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                            <Icon className="relative w-5 h-5 text-white drop-shadow" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="text-white font-bold text-sm truncate">{tpl.label}</h3>
                            <span className="px-1.5 py-[1px] bg-white/[0.06] border border-white/[0.08] rounded text-white/50 text-[9px] font-bold uppercase tracking-wider">
                              {tpl.category}
                            </span>
                          </div>
                          <p className="text-white/45 text-xs leading-snug line-clamp-2">{tpl.desc}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer hint */}
        <div className="relative px-6 py-3 border-t border-white/[0.06] bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/35 text-[10px] font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Tip: Use the Brain to auto-build a workflow from a description</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-white/[0.06] border border-white/10 rounded text-white/40 text-[10px] font-mono font-bold">
            ESC
          </kbd>
        </div>
      </motion.div>
    </motion.div>
  );
}