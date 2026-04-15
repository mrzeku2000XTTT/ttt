import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, Globe, Zap, Lock } from "lucide-react";

const QUICK_LINKS = [
  { label: "Kaspa News", url: "https://kaspa-app-9cc9fe40.base44.app" },
  { label: "TTTz", url: "https://tttz.xyz" },
  { label: "Kaspa.org", url: "https://kaspa.org" },
  { label: "Explorer", url: "https://explorer.kaspa.org" },
  { label: "$KAS", url: "https://www.coingecko.com/en/coins/kaspa" },
];

const DEFAULT_HOME = "https://kaspa-app-9cc9fe40.base44.app";

function getNarration(phase, url) {
  switch (phase) {
    case "address": return "Moving to the address bar…";
    case "loading": {
      if (!url) return "Navigating…";
      const lower = url.toLowerCase();
      if (lower.includes("google.com/search")) {
        try {
          const q = new URL(url).searchParams.get("q");
          if (q) return `Searching "${decodeURIComponent(q)}"…`;
        } catch {}
        return "Searching Google…";
      }
      try { return `Navigating to ${new URL(url).hostname}…`; } catch { return "Navigating…"; }
    }
    case "reading": return "Reading the page…";
    case "done": {
      if (!url) return "Page loaded.";
      const lower = url.toLowerCase();
      if (lower.includes("kaspa-app-9cc9fe40")) return "Loaded Kaspa News — live feed updated hourly.";
      if (lower.includes("tttz.xyz")) return "Loaded TTTz — Kaspa app directory.";
      if (lower.includes("kaspa.org") && !lower.includes("explorer")) return "Loaded kaspa.org — official site.";
      if (lower.includes("explorer.kaspa.org")) return "Loaded Kaspa Explorer — live chain data.";
      if (lower.includes("coingecko.com")) return "Loaded $KAS price on CoinGecko.";
      if (lower.includes("google.com/search")) {
        try {
          const q = new URL(url).searchParams.get("q");
          if (q) return `Search results for "${decodeURIComponent(q)}"`;
        } catch {}
        return "Search results loaded.";
      }
      try { return `Loaded ${new URL(url).hostname}`; } catch { return "Page loaded."; }
    }
    default: return "Ready to browse…";
  }
}

// AI Cursor SVG overlay
function AICursor({ x, y, visible }) {
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: x,
        top: y,
        transition: "all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Drop shadow glow */}
      <div className="absolute -inset-2 rounded-full blur-md" style={{ background: "rgba(6,182,212,0.25)" }} />
      {/* Cursor arrow */}
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="relative drop-shadow-lg">
        <path d="M1 1L1 15L5.5 11L9.5 19L12 18L8 10L14 10L1 1Z" fill="white" stroke="rgba(6,182,212,0.8)" strokeWidth="1" />
      </svg>
      {/* AI label */}
      <div
        className="absolute top-3 left-4 px-1 py-0 rounded text-[7px] font-black tracking-wider"
        style={{
          background: "rgba(6,182,212,0.9)",
          color: "#000",
          lineHeight: "12px",
          boxShadow: "0 1px 4px rgba(6,182,212,0.4)",
        }}
      >
        AI
      </div>
    </div>
  );
}

export default function AgentBrowserPanel({ url: initialUrl }) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl || DEFAULT_HOME);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([initialUrl || DEFAULT_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: "50%", y: "50%" });
  const [cursorVisible, setCursorVisible] = useState(true);
  const [phase, setPhase] = useState("loading");
  const iframeRef = useRef(null);
  const panelRef = useRef(null);
  const phaseTimeouts = useRef([]);

  const isHttps = currentUrl?.startsWith("https");
  const activeQuickLink = QUICK_LINKS.find(q => {
    try { return currentUrl?.includes(new URL(q.url).hostname); } catch { return false; }
  });

  const clearTimeouts = () => {
    phaseTimeouts.current.forEach(clearTimeout);
    phaseTimeouts.current = [];
  };

  const runCursorSequence = useCallback((isNav = false) => {
    clearTimeouts();
    setCursorVisible(true);

    if (isNav) {
      // Move to address bar
      setPhase("address");
      setCursorPos({ x: "50%", y: "8px" });

      phaseTimeouts.current.push(setTimeout(() => {
        setPhase("loading");
        setCursorPos({ x: "45%", y: "12px" });
      }, 800));

      phaseTimeouts.current.push(setTimeout(() => {
        setPhase("reading");
        setCursorPos({ x: "30%", y: "45%" });
      }, 2000));

      phaseTimeouts.current.push(setTimeout(() => {
        setCursorPos({ x: "55%", y: "35%" });
      }, 3200));

      phaseTimeouts.current.push(setTimeout(() => {
        setCursorPos({ x: "40%", y: "60%" });
      }, 4400));

      phaseTimeouts.current.push(setTimeout(() => {
        setPhase("done");
        setCursorPos({ x: "50%", y: "50%" });
      }, 5500));
    } else {
      // Initial load — start center, drift around
      setPhase("loading");
      setCursorPos({ x: "50%", y: "50%" });

      phaseTimeouts.current.push(setTimeout(() => {
        setPhase("reading");
        setCursorPos({ x: "25%", y: "35%" });
      }, 1200));

      phaseTimeouts.current.push(setTimeout(() => {
        setCursorPos({ x: "60%", y: "45%" });
      }, 2500));

      phaseTimeouts.current.push(setTimeout(() => {
        setCursorPos({ x: "35%", y: "65%" });
      }, 3800));

      phaseTimeouts.current.push(setTimeout(() => {
        setPhase("done");
        setCursorPos({ x: "50%", y: "50%" });
      }, 5000));
    }
  }, []);

  useEffect(() => {
    runCursorSequence(false);
    return clearTimeouts;
  }, []);

  const navigateTo = (url) => {
    setLoading(true);
    setCurrentUrl(url);
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    runCursorSequence(true);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const i = historyIndex - 1;
      setHistoryIndex(i);
      setCurrentUrl(history[i]);
      setLoading(true);
      runCursorSequence(true);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const i = historyIndex + 1;
      setHistoryIndex(i);
      setCurrentUrl(history[i]);
      setLoading(true);
      runCursorSequence(true);
    }
  };

  const narration = getNarration(phase, currentUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-2"
    >
      {/* Agent narration bubble */}
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.3)" }}>
          <Zap className="w-3 h-3 text-cyan-400" />
        </div>
        <div className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium leading-snug"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
          }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={narration}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {narration}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Browser frame */}
      <div ref={panelRef} className="rounded-xl overflow-hidden relative"
        style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(18,18,24,0.95)" }}>

        {/* Title bar with traffic lights */}
        <div className="flex items-center gap-2 px-3 py-2"
          style={{ background: "rgba(30,30,38,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-[8px] h-[8px] rounded-full bg-[#ff5f57]" />
            <div className="w-[8px] h-[8px] rounded-full bg-[#febc2e]" />
            <div className="w-[8px] h-[8px] rounded-full bg-[#28c840]" />
          </div>

          {/* Nav buttons */}
          <button onClick={goBack} disabled={historyIndex <= 0}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button onClick={goForward} disabled={historyIndex >= history.length - 1}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ArrowRight className="w-3 h-3" />
          </button>
          <button onClick={() => { setLoading(true); runCursorSequence(true); if (iframeRef.current) iframeRef.current.src = currentUrl; }}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <RotateCw className="w-2.5 h-2.5" />
          </button>
          <button onClick={() => navigateTo(DEFAULT_HOME)}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <Home className="w-2.5 h-2.5" />
          </button>

          {/* Address bar */}
          <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md min-w-0"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {isHttps && <Lock className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />}
            <Globe className="w-2.5 h-2.5 text-white/20 flex-shrink-0" />
            <span className="text-[9px] text-white/45 truncate">{currentUrl}</span>
          </div>

          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Loading progress bar */}
        {loading && (
          <div className="h-[2px] w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)", width: "40%" }}
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Content area with iframe + cursor overlay */}
        <div className="relative overflow-hidden" style={{ height: 200 }}>
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="absolute top-0 left-0 border-0"
            style={{
              width: "200%",
              height: "200%",
              transform: "scale(0.5)",
              transformOrigin: "top left",
            }}
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser"
          />

          {/* AI Cursor overlay — pointer-events: none so it doesn't block clicks */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <AICursor x={cursorPos.x} y={cursorPos.y} visible={cursorVisible} />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-2.5 py-1"
          style={{ background: "rgba(20,20,28,0.95)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[8px] text-white/25 truncate max-w-[80%]">{currentUrl}</span>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-[8px] text-white/30">{loading ? "Loading" : "Live"}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-1 flex-wrap">
        {QUICK_LINKS.map((link) => {
          const isActive = activeQuickLink?.url === link.url;
          return (
            <button
              key={link.label}
              onClick={() => navigateTo(link.url)}
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all hover:scale-105"
              style={{
                background: isActive ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)",
              }}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}