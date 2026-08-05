import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Settings as SettingsIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GalaxyVideoBg from "@/components/agentinternet/GalaxyVideoBg";
import PowerConsole from "@/components/agentinternet/PowerConsole";
import LandingSettings, { useLandingSettings } from "@/components/agentinternet/LandingSettings";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";
import AgentInternetChat from "@/components/agentinternet/AgentInternetChat";
import GuestAgentPreview from "@/components/agentinternet/GuestAgentPreview";
import OnboardingModal, { hasOnboarded } from "@/components/agentinternet/OnboardingModal";
import { APPS } from "@/components/appstore2/appCatalog";
import { AGENT_CARDS } from "@/components/agentinternet/agentCards";

/**
 * AgentInternetLanding — the published landing for all users (Gen Z).
 * Mobile-native, scrollable, dark-web editorial. Unified superagent concept.
 * Top-left: "TTT A.I" logo. Settings: 50 real configs. Two launches.
 */
export default function AgentInternetLanding() {
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [denied, setDenied] = useState(false);
  const { settings, update, reset } = useLandingSettings();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCommand, setChatCommand] = useState("");
  const [guestOpen, setGuestOpen] = useState(false);
  const [onboard, setOnboard] = useState(null); // null | "agent" | "ttt"

  const openChat = (command) => {
    setChatCommand(command);
    if (isAdmin) setChatOpen(true);      // admin → real Agent Internet chat
    else setGuestOpen(true);              // guest → intent router → app
  };

  const guardLaunch = (target) => {
    if (hasOnboarded()) {
      if (target === "agent") handleLaunchAgentInternet();
      else navigate("/TTTHome");
    } else {
      setOnboard(target); // show 5-step onboarding for new users
    }
  };

  const finishOnboard = () => {
    const target = onboard;
    setOnboard(null);
    if (target === "agent") handleLaunchAgentInternet();
    else navigate("/TTTHome");
  };

  const BOOT_SEQUENCE = useMemo(() => [
    "> establishing encrypted relay...",
    "> resolving tttz.xyz · edge node",
    "> auth · verifying session",
    "> handshake · kaspa.org mainnet",
    "> syncing DAG · ghostdag consensus",
    `> mounting callable apps · ${APPS.length}`,
    `> loading agent registry · ${AGENT_CARDS.length} agents`,
    `> arming ${AGENT_CARDS.length} sub-agent slots`,
    "> opening KAI relay · wss://tttz.xyz",
    "> linking kaspa.org · L1 finality",
    "> agent internet ready",
  ], []);

  const bootStartedRef = useRef(false);
  useEffect(() => {
    if (bootStartedRef.current) return; // guard against StrictMode double-invoke
    bootStartedRef.current = true;
    let i = 0;
    const t = setInterval(() => {
      const idx = i; // capture before increment so the updater reads the right line
      setBootLines((p) => [...p, BOOT_SEQUENCE[idx]]);
      i++;
      if (i >= BOOT_SEQUENCE.length) {
        clearInterval(t);
        setTimeout(() => setBooted(true), 900);
      }
    }, 430);
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
      {settings.galaxy !== false && <GalaxyVideoBg />}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        {/* TTT A.I logo — custom orb mark, not a button */}
        <div className="flex items-center gap-2">
          <OrganicOrb size={26} colors={["#ffffff", "#22d3ee", "#6366f1"]} />
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-white">TTT</span>
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-cyan-300/80">A.I</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-black/60 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/50">LIVE</span>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur-md text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="relative z-20 h-full overflow-y-auto scrollbar-hide"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)" }}
      >
        <div className="max-w-2xl mx-auto px-5 sm:px-8 flex flex-col items-center">
          {/* Boot sequence */}
          <AnimatePresence>
            {!booted && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full max-w-xs font-mono text-[9px] sm:text-[11px] space-y-0.5 mb-4 text-emerald-400/80"
              >
                {bootLines.map((line, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55 }}
                className="w-full text-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/5 mb-4"
                >
                  <OrganicOrb size={12} colors={["#67e8f9", "#22d3ee", "#6366f1"]} glow={false} />
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] uppercase text-cyan-300/80">v3.0 · Unified Superagent</span>
                </motion.div>

                <h1
                  className="font-heading font-black tracking-[-0.03em] leading-[0.85] text-4xl sm:text-6xl lg:text-7xl"
                  style={{ textShadow: "0 0 40px rgba(6,182,212,0.15)" }}
                >
                  <span className="block bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">AGENT</span>
                  <span className="block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">INTERNET</span>
                </h1>

                <p className="mt-4 max-w-md mx-auto text-sm sm:text-base text-white/60 leading-relaxed font-body">
                  One superagent that controls all of TTT's apps —
                  calling up to <span className="text-cyan-300 font-medium">100 sub-agents</span> at its fingertips,
                  knowing exactly how many to wake and in what order. Not a chatbot. A <span className="text-cyan-300 font-medium">supercomputer</span>.
                </p>

                {/* Real input + output console */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mt-7 max-w-lg mx-auto w-full"
                >
                  <PowerConsole onSubmit={openChat} />
                </motion.div>

                {/* Launch buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                  <button
                    onClick={() => guardLaunch("agent")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-cyan-400/40 bg-transparent text-cyan-300 font-bold text-xs tracking-widest uppercase hover:border-cyan-300/70 hover:text-cyan-200 transition-colors"
                    style={{ minHeight: 48 }}
                  >
                    <OrganicOrb size={16} colors={["#67e8f9", "#22d3ee", "#0891b2"]} />
                    Launch Agent Internet
                  </button>

                  <button
                    onClick={() => guardLaunch("ttt")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-white/20 bg-transparent text-white/80 hover:text-white hover:border-white/40 text-xs tracking-widest uppercase font-mono font-medium transition-colors"
                    style={{ minHeight: 48 }}
                  >
                    <OrganicOrb size={16} colors={["#a78bfa", "#8b5cf6", "#6366f1"]} />
                    Launch TTT
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-[10px] font-mono tracking-widest uppercase text-white/35"
                >
                  {isAdmin ? "admin access · agent internet unlocked" : "agent internet · admin only · TTT open to all"}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Access denied */}
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

      <LandingSettings open={showSettings} onClose={() => setShowSettings(false)} settings={settings} update={update} reset={reset} />

      <AgentInternetChat
        open={chatOpen}
        initialCommand={chatCommand}
        settings={settings}
        onClose={() => setChatOpen(false)}
      />

      <OnboardingModal
        open={!!onboard}
        onClose={() => setOnboard(null)}
        onFinish={finishOnboard}
      />

      <GuestAgentPreview
        open={guestOpen}
        command={chatCommand}
        onClose={() => setGuestOpen(false)}
      />
    </div>
  );
}