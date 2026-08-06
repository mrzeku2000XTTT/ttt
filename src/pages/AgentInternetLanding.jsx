import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Settings as SettingsIcon, Globe, Boxes } from "lucide-react";
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
  const [viewAsGuest, setViewAsGuest] = useState(false); // admin-only preview toggle

  const openChat = (command) => {
    setChatCommand(command);
    if (isAdmin && !viewAsGuest) setChatOpen(true); // admin → real Agent Internet chat
    else setGuestOpen(true);                        // guest → intent router → app
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
        className="relative z-20 h-full overflow-y-auto scrollbar-hide flex flex-col items-center"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
      >
        <div className="w-full max-w-sm px-4 flex flex-col items-center">
          {/* Boot sequence — compact, above the card */}
          <AnimatePresence>
            {!booted && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full font-mono text-[9px] sm:text-[10px] space-y-0.5 mb-3 text-emerald-400/80 px-1"
              >
                {bootLines.map((line, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                    {line}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Launcher card */}
          <AnimatePresence>
            {booted && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full flex flex-col items-center"
              >
                <div
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1117]/80 backdrop-blur-xl overflow-hidden"
                  style={{ boxShadow: "0 0 60px rgba(6,182,212,0.08), 0 0 1px rgba(176,96,255,0.18)" }}
                >
                  {/* Terminal strip */}
                  <div className="h-7 flex items-center px-3 border-b border-white/10 bg-[#161b22]/70 font-mono text-[9px] text-emerald-400/80 truncate">
                    <span className="text-cyan-400/60 mr-1.5">›</span>
                    {bootLines[bootLines.length - 1] || "> agent internet ready"}
                  </div>

                  <div className="p-5 flex flex-col items-center">
                    {/* Version badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-400/25 bg-cyan-500/5 mb-3">
                      <OrganicOrb size={10} colors={["#67e8f9", "#22d3ee", "#6366f1"]} glow={false} />
                      <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] uppercase text-cyan-300/80">v3.0 · Unified Superagent</span>
                    </div>

                    {/* Title — compact, one line */}
                    <h1 className="font-heading font-black tracking-[-0.02em] leading-none text-2xl sm:text-3xl text-center">
                      <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">AGENT</span>
                      <span className="text-white/20 mx-1.5 font-light">/</span>
                      <span className="bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">INTERNET</span>
                    </h1>

                    {/* Description — tight */}
                    <p className="mt-2.5 max-w-[260px] text-[11px] sm:text-xs text-white/55 leading-relaxed font-body text-center">
                      One superagent runs every TTT app, waking up to <span className="text-cyan-300 font-medium">100 sub-agents</span> in the right order. A <span className="text-cyan-300 font-medium">supercomputer</span>, not a chatbot.
                    </p>

                    {/* Input */}
                    <div className="mt-4 w-full">
                      <PowerConsole onSubmit={openChat} />
                    </div>

                    {/* View-as toggle (admin only) */}
                    {isAdmin && (
                      <div className="mt-3 flex items-center justify-center gap-1 p-1 rounded-full border border-white/10 bg-black/40 w-fit mx-auto">
                        <span className="px-2 text-[8px] font-mono tracking-widest uppercase text-white/35">view as</span>
                        <button
                          onClick={() => setViewAsGuest(false)}
                          className={`px-2.5 py-1 rounded-full text-[8px] font-mono tracking-widest uppercase transition-colors ${!viewAsGuest ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/40" : "text-white/45 border border-transparent hover:text-white/70"}`}
                        >
                          TTT A.I
                        </button>
                        <button
                          onClick={() => setViewAsGuest(true)}
                          className={`px-2.5 py-1 rounded-full text-[8px] font-mono tracking-widest uppercase transition-colors ${viewAsGuest ? "bg-violet-500/15 text-violet-300 border border-violet-400/40" : "text-white/45 border border-transparent hover:text-white/70"}`}
                        >
                          Guest
                        </button>
                      </div>
                    )}

                    {/* Launch tiles */}
                    <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                      <button
                        onClick={() => guardLaunch("agent")}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-cyan-400/40 bg-cyan-500/5 hover:border-cyan-300/70 hover:bg-cyan-500/10 transition-colors"
                      >
                        <Globe className="w-4 h-4 text-cyan-300" />
                        <span className="text-[9px] font-mono tracking-widest uppercase text-cyan-200">Agent Internet</span>
                      </button>
                      <button
                        onClick={() => guardLaunch("ttt")}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-violet-400/40 bg-violet-500/5 hover:border-violet-300/70 hover:bg-violet-500/10 transition-colors"
                      >
                        <Boxes className="w-4 h-4 text-violet-300" />
                        <span className="text-[9px] font-mono tracking-widest uppercase text-violet-200">TTT</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 text-[9px] font-mono tracking-widest uppercase text-white/35 text-center">
                  {isAdmin
                    ? viewAsGuest
                      ? "admin access · previewing guest mode"
                      : "admin access · agent internet unlocked"
                    : "agent internet · admin only · TTT open to all"}
                </div>
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