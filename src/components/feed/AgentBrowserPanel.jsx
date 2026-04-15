import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Zap, ExternalLink } from "lucide-react";

const QUICK_LINKS = [
  { label: "Kaspa News", url: "https://kaspa-app-9cc9fe40.base44.app" },
  { label: "TTTz", url: "https://tttz.xyz" },
  { label: "Kaspa.org", url: "https://kaspa.org" },
  { label: "Explorer", url: "https://explorer.kaspa.org" },
  { label: "$KAS Price", url: "https://www.coingecko.com/en/coins/kaspa" },
];

const DEFAULT_HOME = "https://kaspa-app-9cc9fe40.base44.app";

function getFavicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`;
  } catch { return null; }
}

function getStatusText(url) {
  try { return new URL(url).href; } catch { return url; }
}

function getAgentNarration(url) {
  if (!url) return "Ready to browse...";
  const lower = url.toLowerCase();
  if (lower.includes("google.com/search")) {
    const q = new URL(url).searchParams.get("q") || new URL(url).searchParams.get("igu");
    return `Searching Google for '${q || "..."}'...`;
  }
  if (lower.includes("kaspa-app-9cc9fe40")) return "Loaded Kaspa News — live feed updated hourly.";
  if (lower.includes("tttz.xyz")) return "Opening TTTz app store...";
  if (lower.includes("kaspa.org") && !lower.includes("explorer")) return "Navigating to kaspa.org...";
  if (lower.includes("explorer.kaspa.org")) return "Opening Kaspa Block Explorer...";
  if (lower.includes("coingecko.com")) return "Loading $KAS price data from CoinGecko...";
  try { return `Navigating to ${new URL(url).hostname}...`; } catch { return `Loading ${url}...`; }
}

export default function AgentBrowserPanel({ url: initialUrl, narration: initialNarration }) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl || DEFAULT_HOME);
  const [displayUrl, setDisplayUrl] = useState(initialUrl || DEFAULT_HOME);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState([initialUrl || DEFAULT_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [narration, setNarration] = useState(initialNarration || getAgentNarration(initialUrl || DEFAULT_HOME));
  const iframeRef = useRef(null);
  const progressRef = useRef(null);

  const isHttps = currentUrl?.startsWith("https");
  const favicon = getFavicon(currentUrl);
  const activeQuickLink = QUICK_LINKS.find(q => currentUrl?.includes(new URL(q.url).hostname));

  useEffect(() => {
    if (loading) {
      setProgress(0);
      let p = 0;
      progressRef.current = setInterval(() => {
        p += Math.random() * 15 + 5;
        if (p >= 90) p = 90;
        setProgress(p);
      }, 200);
    } else {
      setProgress(100);
      clearInterval(progressRef.current);
      setTimeout(() => setProgress(0), 400);
    }
    return () => clearInterval(progressRef.current);
  }, [loading]);

  const navigateTo = (url) => {
    setLoading(true);
    setCurrentUrl(url);
    setDisplayUrl(url);
    setNarration(getAgentNarration(url));
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      setDisplayUrl(url);
      setLoading(true);
      setNarration(getAgentNarration(url));
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      setDisplayUrl(url);
      setLoading(true);
      setNarration(getAgentNarration(url));
    }
  };

  const refresh = () => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const goHome = () => navigateTo(DEFAULT_HOME);

  return (
    <div className="w-full space-y-2">
      {/* Agent narration bubble */}
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(6,182,212,0.3)", border: "1px solid rgba(6,182,212,0.5)" }}>
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="px-3 py-2 rounded-2xl rounded-bl-md text-[12px] leading-relaxed"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
          {narration}
        </div>
      </div>

      {/* Browser chrome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(30,30,38,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {/* Title bar with traffic lights */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(40,40,50,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-0.5">
            <button onClick={goBack} disabled={historyIndex <= 0}
              className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 disabled:opacity-20 transition-colors">
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button onClick={goForward} disabled={historyIndex >= history.length - 1}
              className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 disabled:opacity-20 transition-colors">
              <ArrowRight className="w-3 h-3" />
            </button>
            <button onClick={refresh}
              className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors">
              <RotateCw className="w-3 h-3" />
            </button>
            <button onClick={goHome}
              className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors">
              <Home className="w-3 h-3" />
            </button>
          </div>

          {/* Address bar */}
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ml-1"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {favicon && <img src={favicon} alt="" className="w-3 h-3 flex-shrink-0" />}
            {isHttps && <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
            <span className="text-[10px] text-white/60 truncate flex-1">{displayUrl}</span>
          </div>

          {/* External link */}
          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Loading progress bar */}
        {progress > 0 && progress < 100 && (
          <div className="h-[2px] w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6)", width: `${progress}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}

        {/* iframe */}
        <div style={{ height: 220 }}>
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Agent Browser"
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5"
          style={{ background: "rgba(25,25,32,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[9px] text-white/35 truncate flex-1 mr-2">{getStatusText(currentUrl)}</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-[6px] h-[6px] rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-[9px] text-white/35">{loading ? "Loading" : "Live"}</span>
          </div>
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_LINKS.map((link) => {
          const isActive = activeQuickLink?.url === link.url;
          return (
            <button
              key={link.label}
              onClick={() => navigateTo(link.url)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
              style={{
                background: isActive ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.07)",
                border: `1px solid ${isActive ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: isActive ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.5)",
              }}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}