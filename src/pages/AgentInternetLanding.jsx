import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Lock, Zap, Radio, Settings as SettingsIcon, ShieldCheck,
  Cpu, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import GalaxyVideoBg from "@/components/agentinternet/GalaxyVideoBg";
import PowerInput from "@/components/agentinternet/PowerInput";
import LandingSettings, { useLandingSettings } from "@/components/agentinternet/LandingSettings";

/**
 * AgentInternetLanding — the published landing for all users (Gen Z).
 * Mobile-native, dark-web editorial style. Galaxy video background.
 * Two launches: Agent Internet (admin) + TTT (everyone).
 * Back to original TTT landing. No widget cards — a single power input instead.
 */
export default function AgentInternetLanding() {
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [denied, setDenied] = useState(false);
  const { settings, update } = useLandingSettings();

  const BOOT_SEQUENCE = useMemo(() => [
    "> establishing encrypted relay...",
    "> loading agent registry · 5 nodes",
    "> mounting callable apps · 48",
    "> x402 payment channel live",
    "> agent internet ready",
  ], []);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < BOOT_SEQUENCE.length) {
        setBootLines((p) => [...p, BOOT_SEQUENCE[i]]);
        i++;
      } else {
        clearInterval(t);
        setTimeout(() => setBooted(true), 350);
      }
    }, 260);
    return () => clearInterval(t);
  }, [BOOT_SEQUENCE]);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { setIsAdmin(false); return; }
        const me = await base44.auth.me();
        setIsAdmin(me?.role === "admin");
      } catch { setIsAdmin(false); }
    })();
  }, []);

  const handleLaunchAgentInternet = () => {
    if (isAdmin) navigate("/AgentInternet");
    else setDenied(true);
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none">
      {settings.galaxy && <GalaxyVideoBg />}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <Link
          to="/TTTHome"
          className="flex items-center gap-2 px-3 h-10 rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-white/70 hover:text-white hover:border-white/40 transition-colors text-[10px] font-mono tracking-widest uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TTT</span>
        </Link>

        <div className="flex items-center gap-1.5 px-3 h-10 rounded-full border border-white/15 bg-black/60 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/50">LIVE</span>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content — centered, mobile-native, no overlap */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-5 sm:px-8 max-w-2xl mx-auto">
        {/* Boot sequence */}
        <AnimatePresence>
          {!booted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm font-mono text-[10px] sm:text-xs space-y-1 mb-6 text-emerald-400/80"
            >
              {bootLines.map((line) => (
                <motion.div key={line} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="w-full text-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/5 mb-5"
              >
                <Radio className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-cyan-300/80">v3.0 · Supercomputer</span>
              </motion.div>

              <h1
                className="font-heading font-black tracking-[-0.03em] leading-[0.85] text-5xl sm:text-7xl lg:text-8xl"
                style={{ textShadow: "0 0 40px rgba(6,182,212,0.15)" }}
              >
                <span className="block bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">AGENT</span>
                <span className="block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">INTERNET</span>
              </h1>

              <p className="mt-5 max-w-md mx-auto text-sm sm:text-base text-white/60 leading-relaxed font-body">
                A network of autonomous agents that use TTT's apps as their internet —
                moving real money, signing real identity, producing real media.
                Not a chatbot. A <span className="text-cyan-300 font-medium">supercomputer</span>.
              </p>

              {/* Power input — replaces widget cards */}
              {settings.showPowers && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 max-w-lg mx-auto"
                >
                  <PowerInput />
                </motion.div>
              )}

              {/* Launch buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <button
                  onClick={handleLaunchAgentInternet}
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-cyan-400 text-black font-bold text-xs tracking-widest uppercase hover:bg-cyan-300 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.35)]"
                  style={{ minHeight: 48 }}
                >
                  <Zap className="w-4 h-4" />
                  Launch Agent Internet
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-black/60" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-black/60" />
                  )}
                </button>

                <Link
                  to="/TTTHome"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-white/20 bg-black/50 backdrop-blur-md text-white/80 hover:text-white hover:border-white/40 text-xs tracking-widest uppercase font-mono font-medium transition-colors"
                  style={{ minHeight: 48 }}
                >
                  <Cpu className="w-4 h-4" />
                  Launch TTT
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>

              {/* Admin hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-[10px] font-mono tracking-widest uppercase text-white/35"
              >
                {isAdmin ? "admin access · agent internet unlocked" : "agent internet · admin only · TTT open to all"}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer line */}
      <AnimatePresence>
        {booted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-0 left-0 right-0 z-20 px-4 py-3 text-center"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
          >
            <div className="text-[9px] font-mono tracking-[0.25em] uppercase text-white/25">
              TTT · Kaspa-native · 48 callable apps · 5 agents
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Access denied toast for non-admins trying Agent Internet */}
      <AnimatePresence>
        {denied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-24 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/40 backdrop-blur-md text-center"
          >
            <div className="flex items-center gap-2 text-red-300 text-xs font-mono">
              <Lock className="w-3.5 h-3.5" />
              Admin access required for Agent Internet
            </div>
            <div className="text-white/50 text-[10px] mt-1">Launch TTT to enter the app.</div>
          </motion.div>
        )}
      </AnimatePresence>

      <LandingSettings open={showSettings} onClose={() => setShowSettings(false)} settings={settings} update={update} />
    </div>
  );
}