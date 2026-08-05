import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Lock, Terminal, Zap, Radio, Shield, Cpu,
  Network, KeyRound, Activity, Globe2, Fingerprint, ChevronRight
} from "lucide-react";
import GalaxyVideoBg from "@/components/agentinternet/GalaxyVideoBg";
import { AGENT_CARDS } from "@/components/agentinternet/agentCards";

/**
 * AgentInternetLanding — admin-only "dark web" entry point for the Agent Internet.
 * Galaxy video background, terminal aesthetic, agent roster, launch gate.
 */
export default function AgentInternetLanding() {
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [hovered, setHovered] = useState(null);

  const BOOT_SEQUENCE = [
    "> establishing encrypted relay... OK",
    "> loading agent registry... 5 nodes",
    "> verifying zero-knowledge keys... OK",
    "> mounting app endpoints... 48 callable",
    "> x402 payment channel... live",
    "> agent internet: READY",
  ];

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < BOOT_SEQUENCE.length) {
        setBootLines((prev) => [...prev, BOOT_SEQUENCE[i]]);
        i++;
      } else {
        clearInterval(t);
        setTimeout(() => setBooted(true), 400);
      }
    }, 280);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none">
      <GalaxyVideoBg />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-3 h-10 rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-white/70 hover:text-white hover:border-cyan-400/50 transition-colors text-[11px] font-mono tracking-widest uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Exit
        </Link>

        <div className="flex items-center gap-2 px-3 h-10 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-red-300">Admin Only</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-full border border-white/15 bg-black/60 backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">RELAY · LIVE</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6">
        {/* Boot terminal */}
        <AnimatePresence>
          {!booted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md font-mono text-[11px] sm:text-xs space-y-1 mb-6"
            >
              {bootLines.map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={i === bootLines.length - 1 ? "text-cyan-300" : "text-emerald-400/80"}
                >
                  {line}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero */}
        <AnimatePresence>
          {booted && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/5 mb-5">
                <Globe2 className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-cyan-300/80">v3.0 · Supercomputer</span>
              </div>

              <h1 className="font-black tracking-tighter leading-[0.9] text-4xl sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-cyan-200 via-white to-violet-300 bg-clip-text text-transparent">
                  AGENT
                </span>
                <br />
                <span className="text-white/90">INTERNET</span>
              </h1>

              <p className="mt-5 max-w-lg mx-auto text-sm sm:text-base text-white/55 leading-relaxed">
                A network of autonomous agents that use TTT's apps as their internet —
                moving real money, signing real identity, producing real media.
                Not a chatbot. A <span className="text-cyan-300">supercomputer</span>.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/AgentInternet")}
                  className="group flex items-center gap-2 px-6 h-12 rounded-full bg-cyan-400 text-black font-bold text-xs tracking-widest uppercase hover:bg-cyan-300 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                >
                  <Zap className="w-4 h-4" />
                  Enter Network
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  to="/AppStoreV2"
                  className="flex items-center gap-2 px-6 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:border-white/40 text-xs tracking-widest uppercase font-mono transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  App Registry
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent roster */}
        <AnimatePresence>
          {booted && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-5xl"
            >
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40">Agent Roster · 5 Nodes</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                {AGENT_CARDS.map((agent, i) => (
                  <motion.button
                    key={agent.name}
                    onHoverStart={() => setHovered(agent.name)}
                    onHoverEnd={() => setHovered(null)}
                    onClick={() => navigate("/AgentInternet")}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="relative group text-left p-3 rounded-xl border border-white/10 bg-black/50 backdrop-blur-md hover:border-cyan-400/40 hover:bg-black/70 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[8px] font-mono text-white/40 tracking-widest uppercase">{agent.protocol}</span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-white leading-tight mb-1">
                      {agent.name.replace("AGENT ", "")}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/40 leading-snug mb-2">{agent.role}</div>
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.slice(0, 2).map((s) => (
                        <span key={s} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-cyan-300/70 border border-white/5">
                          {s}
                        </span>
                      ))}
                    </div>
                    {hovered === agent.name && (
                      <motion.div
                        layoutId="agent-glow"
                        className="absolute inset-0 rounded-xl ring-1 ring-cyan-400/50 pointer-events-none"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stat strip */}
      <AnimatePresence>
        {booted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-0 left-0 right-0 z-20"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-4 gap-2 sm:gap-4 py-3 border-t border-white/10">
                {[
                  { icon: Cpu, label: "Agents", value: "5" },
                  { icon: Network, label: "Callable Apps", value: "48" },
                  { icon: KeyRound, label: "Protocols", value: "A2A · MCP · x402" },
                  { icon: Shield, label: "Network", value: "Kaspa L1" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex flex-col items-center sm:items-start gap-0.5">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Icon className="w-3 h-3 text-cyan-400/60" />
                        <span className="text-[8px] sm:text-[9px] font-mono tracking-widest uppercase">{s.label}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs font-mono font-bold text-white/90 truncate">{s.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating activity badge */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center gap-2">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-1"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <div className="w-px h-16 bg-gradient-to-b from-cyan-400/60 to-transparent" />
        </motion.div>
        <span className="text-[9px] font-mono tracking-widest uppercase text-white/30 rotate-90 origin-center whitespace-nowrap mt-8">
          MONITORING
        </span>
      </div>
    </div>
  );
}