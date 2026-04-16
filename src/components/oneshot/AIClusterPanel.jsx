import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Palette, Code2, Eye, Layers, CheckCircle2, Loader2, Zap } from "lucide-react";

const AGENT_META = {
  scraper:  { name: "Scraper",  icon: Globe,   color: "cyan",    desc: "Fetches HTML, CSS & screenshot" },
  designer: { name: "Designer", icon: Palette, color: "rose",    desc: "Extracts design system & layout spec" },
  coder:    { name: "Coder",    icon: Code2,   color: "violet",  desc: "Writes the React + Tailwind code" },
  reviewer: { name: "Reviewer", icon: Eye,     color: "amber",   desc: "Polishes & fixes UI issues" },
  pages:    { name: "Pages",    icon: Layers,  color: "emerald", desc: "Clones sub-pages in parallel" },
};

const COLOR_CLASSES = {
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    text: "text-cyan-400",    dot: "bg-cyan-400",    glow: "shadow-cyan-500/40" },
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/30",    text: "text-rose-400",    dot: "bg-rose-400",    glow: "shadow-rose-500/40" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/30",  text: "text-violet-400",  dot: "bg-violet-400",  glow: "shadow-violet-500/40" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400",   dot: "bg-amber-400",   glow: "shadow-amber-500/40" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400", glow: "shadow-emerald-500/40" },
};

/**
 * agents: { [key]: { status: 'idle' | 'working' | 'done' | 'error', message: string } }
 * activity: [{ id, agent, text, time }] — rolling log
 */
export default function AIClusterPanel({ url, agents, activity }) {
  return (
    <div className="min-h-[80vh] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[11px] text-white/60 mb-5 backdrop-blur-sm"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            AI Cluster · 5 agents working in parallel
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Cloning in real time</h2>
          <p className="text-white/30 text-sm font-mono truncate max-w-xl mx-auto">{url}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 mb-6">
          {Object.entries(AGENT_META).map(([key, meta], i) => {
            const state = agents[key] || { status: "idle", message: "" };
            const c = COLOR_CLASSES[meta.color];
            const Icon = meta.icon;
            const isWorking = state.status === "working";
            const isDone = state.status === "done";
            const isError = state.status === "error";

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl border p-5 transition-all duration-500 ${
                  isWorking
                    ? `${c.bg} ${c.border} shadow-xl ${c.glow}`
                    : isDone
                    ? "bg-emerald-500/[0.06] border-emerald-500/20"
                    : isError
                    ? "bg-red-500/[0.06] border-red-500/20"
                    : "bg-white/[0.02] border-white/[0.05]"
                }`}
              >
                {/* Pulse ring when working */}
                {isWorking && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl border-2 ${c.border}`}
                    animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.04, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="relative flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isWorking ? `${c.bg} ${c.border} ${c.text}` :
                    isDone ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                    isError ? "bg-red-500/20 border-red-500/30 text-red-400" :
                    "bg-white/5 border-white/10 text-white/30"
                  }`}>
                    {isWorking ? <Loader2 className="w-5 h-5 animate-spin" /> :
                     isDone ? <CheckCircle2 className="w-5 h-5" /> :
                     <Icon className="w-5 h-5" />}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isWorking ? `${c.dot} animate-pulse` :
                      isDone ? "bg-emerald-400" :
                      isError ? "bg-red-400" :
                      "bg-white/20"
                    }`} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      isWorking ? c.text :
                      isDone ? "text-emerald-400" :
                      isError ? "text-red-400" :
                      "text-white/30"
                    }`}>
                      {isWorking ? "Active" : isDone ? "Done" : isError ? "Error" : "Idle"}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-white mb-1">{meta.name}</h3>
                <p className="text-white/35 text-[11px] leading-relaxed mb-2">{meta.desc}</p>

                <AnimatePresence mode="wait">
                  {state.message && (
                    <motion.p
                      key={state.message}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-[11px] font-mono truncate ${isWorking ? c.text : isDone ? "text-emerald-400/80" : "text-white/50"}`}
                    >
                      › {state.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Live activity feed */}
        <div className="bg-black/60 border border-white/[0.07] rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between bg-white/[0.02] border-b border-white/[0.05] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[11px] text-white/40 font-mono ml-2">cluster.log</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/40 font-mono">live</span>
            </div>
          </div>

          <div className="p-5 h-64 overflow-y-auto font-mono text-[12px] space-y-1.5 flex flex-col-reverse">
            <AnimatePresence initial={false}>
              {activity.slice(-40).reverse().map((line) => {
                const meta = AGENT_META[line.agent];
                const c = meta ? COLOR_CLASSES[meta.color] : COLOR_CLASSES.cyan;
                return (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-white/20 flex-shrink-0">{line.time}</span>
                    <span className={`${c.text} font-bold flex-shrink-0 w-20`}>[{meta?.name || line.agent}]</span>
                    <span className="text-white/70 break-all">{line.text}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {activity.length === 0 && (
              <div className="text-white/20 italic">Waiting for agents to report…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}