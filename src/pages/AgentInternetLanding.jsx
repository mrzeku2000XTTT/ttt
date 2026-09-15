import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Settings as SettingsIcon, LayoutGrid, Search, Cpu } from "lucide-react";
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
import LivePagesBrowser from "@/components/agentinternet/LivePagesBrowser";
import WebSearchBrowser from "@/components/agentinternet/WebSearchBrowser";
import KaspaSearchBrowser from "@/components/agentinternet/KaspaSearchBrowser";
import CryptoSearchBrowser from "@/components/agentinternet/CryptoSearchBrowser";
import HotTopicsTicker from "@/components/agentinternet/HotTopicsTicker";
import SuperComputerChat from "@/components/agentinternet/SuperComputerChat";

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
  const [superMode, setSuperMode] = useState(false); // admin-only supercomputer chat
  const [showBrowser, setShowBrowser] = useState(false); // browse-all-live-pages directory
  const [showWebSearch, setShowWebSearch] = useState(false); // search-any-site iframe
  const [showKaspaSearch, setShowKaspaSearch] = useState(false); // search kaspahub index
  const [showCryptoSearch, setShowCryptoSearch] = useState(false); // crypto coin search

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

  // ── Supercomputer mode — ChatGPT-style chat, every TTT app as backend ──
  if (superMode) return <SuperComputerChat onExit={() => setSuperMode(false)} />;

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

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setSuperMode(true)}
              title="Super Computer — the entire TTT suite as one backend"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-white/20 bg-gradient-to-r from-white/[0.08] to-white/[0.02] backdrop-blur-xl text-[10px] font-mono tracking-widest uppercase text-white/80 hover:text-white hover:border-white/50 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <Cpu className="w-3.5 h-3.5" />
              Super Computer
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 bg-black/70 backdrop-blur-xl text-white/70 hover:text-white transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="relative z-20 h-full overflow-hidden flex flex-col"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 3rem)" }}
      >
        <div className="max-w-2xl mx-auto px-5 sm:px-8 flex-1 flex flex-col items-center justify-center w-full">
          {/* Boot sequence */}
          <AnimatePresence>
            {!booted && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md font-mono text-[10px] sm:text-xs space-y-1 mb-6 text-emerald-400/80 px-2"
              >
                {bootLines.map((line, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                    <span className="text-cyan-400/60 mr-1.5">›</span>{line}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero */}
          <AnimatePresence>
            {booted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center w-full"
              >
                {/* Merged status + version pill */}
                <div className="w-full flex justify-center mb-3">
                  <div className="inline-flex items-center justify-center gap-2 px-4 h-9 rounded-full border border-white/15 bg-black/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-white/70">LIVE · v3.0</span>
                  </div>
                </div>

                {/* Title — large, two lines */}
                <h1 className="font-heading font-black tracking-[-0.03em] leading-[0.9] text-center">
                  <span className="block text-5xl sm:text-6xl md:text-7xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">AGENT</span>
                  <span className="block text-5xl sm:text-6xl md:text-7xl mt-1 bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">INTERNET</span>
                </h1>

                {/* Description */}
                <p className="mt-3 max-w-md text-sm sm:text-base text-white/60 leading-relaxed font-body text-center">
                  One superagent runs every TTT app, waking up to <span className="text-cyan-300 font-medium">100 sub-agents</span> in the right order. A <span className="text-cyan-300 font-medium">supercomputer</span>, not a chatbot.
                </p>

                {/* Input */}
                <div className="mt-4 w-full max-w-md">
                  <PowerConsole onSubmit={openChat} />
                </div>

                {/* Mobile/tablet controls — preserve the existing layout */}
                <div className="md:hidden contents">
                  {isAdmin && (
                    <div className="mt-4 flex items-center justify-center gap-1 p-1 rounded-full border border-white/15 bg-black/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      <span className="px-2 text-[10px] font-mono tracking-widest uppercase text-white/40">view as</span>
                      <button
                        onClick={() => setViewAsGuest(false)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${!viewAsGuest ? "bg-white/10 text-white" : "text-white/50 hover:text-white/75"}`}
                      >
                        TTT A.I
                      </button>
                      <button
                        onClick={() => setViewAsGuest(true)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${viewAsGuest ? "bg-white/10 text-white" : "text-white/50 hover:text-white/75"}`}
                      >
                        Guest
                      </button>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <button onClick={() => guardLaunch("agent")} className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-white/15 bg-black/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-black/80 transition-colors">
                      <span className="text-[11px] font-mono tracking-widest uppercase text-white/80">Launch Agent Internet</span>
                    </button>
                    <button onClick={() => guardLaunch("ttt")} className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-white/15 bg-black/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-black/80 transition-colors">
                      <span className="text-[11px] font-mono tracking-widest uppercase text-white/80">Launch TTT</span>
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button onClick={() => setShowBrowser(true)} className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-white/15 bg-black/40 backdrop-blur-xl text-[10px] font-mono tracking-widest uppercase text-white/60 hover:text-white hover:border-white/40 transition-colors">
                      <LayoutGrid className="w-3.5 h-3.5" /> Browse live pages
                    </button>
                    <button onClick={() => setShowWebSearch(true)} className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-white/15 bg-black/40 backdrop-blur-xl text-[10px] font-mono tracking-widest uppercase text-white/60 hover:text-white hover:border-white/40 transition-colors">
                      <Search className="w-3.5 h-3.5" /> Search the web
                    </button>
                    <button onClick={() => setShowKaspaSearch(true)} className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-xl text-[10px] font-mono tracking-widest uppercase text-cyan-200 hover:text-white hover:border-cyan-400/60 transition-colors">
                      <img src="https://cryptologos.cc/logos/kaspa-kas-logo.png" alt="" className="w-3.5 h-3.5 rounded-full" /> Search Kaspa
                    </button>
                    <button onClick={() => setShowCryptoSearch(true)} className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl text-[10px] font-mono tracking-widest uppercase text-amber-200 hover:text-white hover:border-amber-400/60 transition-colors">
                      <img src="https://assets.coingecko.com/coins/images/1/large/bitcoin.png" alt="" className="w-4 h-4 rounded-full" /> Search Crypto
                    </button>
                  </div>
                </div>

                {/* Tablet Compact Grid */}
                <div className="mt-5 hidden w-full max-w-2xl grid-cols-4 gap-2 md:grid lg:hidden">
                  <div className="col-span-4 flex h-12 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-black/70 px-4 backdrop-blur-xl">
                    <OrganicOrb size={24} colors={["#ffffff", "#22d3ee", "#0891b2"]} />
                    {isAdmin && <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">View as</span>}
                    <button onClick={() => setViewAsGuest(false)} className={`rounded-full px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors ${!viewAsGuest ? "bg-white/10 text-white" : "text-white/40"}`}>TTT A.I</button>
                    {isAdmin && <button onClick={() => setViewAsGuest(true)} className={`rounded-full px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest transition-colors ${viewAsGuest ? "bg-white/10 text-amber-300" : "text-white/40"}`}>Guest</button>}
                  </div>

                  <button onClick={() => guardLaunch("agent")} className="col-span-2 flex h-14 items-center justify-center rounded-2xl border border-white/30 bg-black/75 px-4 text-[11px] font-mono uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black">Launch Agent Internet</button>
                  <button onClick={() => guardLaunch("ttt")} className="col-span-2 flex h-14 items-center justify-center rounded-2xl border border-white/30 bg-black/75 px-4 text-[11px] font-mono uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black">Launch TTT</button>

                  <button onClick={() => setShowBrowser(true)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-2 text-center text-[9px] font-mono uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white"><LayoutGrid className="h-4 w-4" /> Browse live pages</button>
                  <button onClick={() => setShowWebSearch(true)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-2 text-center text-[9px] font-mono uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white"><Search className="h-4 w-4" /> Search the web</button>
                  <button onClick={() => setShowKaspaSearch(true)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.07] px-2 text-center text-[9px] font-mono uppercase tracking-wide text-cyan-200 hover:border-cyan-400/50 hover:text-white"><img src="https://cryptologos.cc/logos/kaspa-kas-logo.png" alt="" className="h-4 w-4 rounded-full" /> Search Kaspa</button>
                  <button onClick={() => setShowCryptoSearch(true)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-2 text-center text-[9px] font-mono uppercase tracking-wide text-amber-200 hover:border-amber-400/50 hover:text-white"><img src="https://assets.coingecko.com/coins/images/1/large/bitcoin.png" alt="" className="h-4 w-4 rounded-full" /> Search Crypto</button>
                </div>

                {/* Desktop Action Rail */}
                <div className="liquid-glass hidden lg:flex mt-6 w-[min(94vw,980px)] min-h-32 items-center justify-between gap-4 rounded-3xl border border-white/15 bg-gradient-to-r from-white/[0.045] via-white/[0.012] to-white/[0.035] px-7 py-5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.16)]">
                  <div className="relative flex min-w-[250px] items-center gap-3 border-l border-white/35 pl-4 pr-5">
                    <span className="absolute -left-px top-0 h-2 w-2 border-t border-white/35" />
                    <span className="absolute -left-px bottom-0 h-2 w-2 border-b border-white/35" />
                    <OrganicOrb size={38} colors={["#ffffff", "#22d3ee", "#0891b2"]} />
                    <div>
                      {isAdmin && <div className="mb-1 text-center text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">View as</div>}
                      <div className="flex items-center gap-2 font-mono uppercase">
                        <button onClick={() => setViewAsGuest(false)} className={`text-xl font-black tracking-tight transition-colors ${!viewAsGuest ? "text-white" : "text-white/35"}`}>TTT <span className="font-normal text-cyan-300">A.I</span></button>
                        {isAdmin && <span className="h-5 w-px bg-white/20" />}
                        {isAdmin && <button onClick={() => setViewAsGuest(true)} className={`text-lg transition-colors ${viewAsGuest ? "text-amber-300" : "text-white/40 hover:text-white/70"}`}>Guest</button>}
                      </div>
                    </div>
                  </div>

                  <div className="h-16 w-px shrink-0 bg-white/20" />

                  <div className="flex shrink-0 items-center gap-3">
                    <button onClick={() => guardLaunch("agent")} className="h-12 rounded-full border-2 border-white/85 px-6 text-[11px] font-mono uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black">Launch Agent Internet</button>
                    <button onClick={() => guardLaunch("ttt")} className="h-12 rounded-full border-2 border-white/85 px-6 text-[11px] font-mono uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black">Launch TTT</button>
                  </div>

                  <div className="relative min-w-[178px] space-y-1 border-x border-white/35 px-4 py-1">
                    <span className="absolute -left-px top-0 h-2 w-2 border-t border-white/35" />
                    <span className="absolute -left-px bottom-0 h-2 w-2 border-b border-white/35" />
                    <span className="absolute -right-px top-0 h-2 w-2 border-t border-white/35" />
                    <span className="absolute -right-px bottom-0 h-2 w-2 border-b border-white/35" />
                    <button onClick={() => setShowBrowser(true)} className="flex w-full items-center gap-2 py-0.5 text-left text-[10px] font-mono uppercase text-white/80 hover:text-white"><LayoutGrid className="h-3.5 w-3.5" /> Browse live pages</button>
                    <button onClick={() => setShowWebSearch(true)} className="flex w-full items-center gap-2 py-0.5 text-left text-[10px] font-mono uppercase text-white/80 hover:text-white"><Search className="h-3.5 w-3.5" /> Search the web</button>
                    <button onClick={() => setShowKaspaSearch(true)} className="flex w-full items-center gap-2 py-0.5 text-left text-[10px] font-mono uppercase text-white hover:text-cyan-200"><img src="https://cryptologos.cc/logos/kaspa-kas-logo.png" alt="" className="h-3.5 w-3.5 rounded-full" /> Search Kaspa</button>
                    <button onClick={() => setShowCryptoSearch(true)} className="flex w-full items-center gap-2 py-0.5 text-left text-[10px] font-mono uppercase text-white/80 hover:text-amber-200"><img src="https://assets.coingecko.com/coins/images/1/large/bitcoin.png" alt="" className="h-3.5 w-3.5 rounded-full" /> Search Crypto</button>
                  </div>
                </div>

                {/* Footer status */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-3 text-[10px] font-mono tracking-widest uppercase text-white/35 text-center"
                >
                  {isAdmin
                    ? viewAsGuest
                      ? "admin access · previewing guest mode"
                      : "admin access · agent internet unlocked"
                    : "agent internet · admin only · TTT open to all"}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Live news ticker — bottom bar */}
      <div className="absolute bottom-3 left-2 right-2 sm:bottom-0 sm:left-0 sm:right-0 z-30 rounded-xl overflow-hidden sm:rounded-none" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <HotTopicsTicker />
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

      <LivePagesBrowser open={showBrowser} onClose={() => setShowBrowser(false)} />

      <WebSearchBrowser open={showWebSearch} onClose={() => setShowWebSearch(false)} />

      <KaspaSearchBrowser open={showKaspaSearch} onClose={() => setShowKaspaSearch(false)} />

      <CryptoSearchBrowser open={showCryptoSearch} onClose={() => setShowCryptoSearch(false)} />

      <GuestAgentPreview
        open={guestOpen}
        command={chatCommand}
        onClose={() => setGuestOpen(false)}
      />
    </div>
  );
}