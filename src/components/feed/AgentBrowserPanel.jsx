import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, ExternalLink, Globe, Zap } from "lucide-react";

const QUICK_LINKS = [
  { label: "Kaspa News", url: "https://kaspa-app-9cc9fe40.base44.app" },
  { label: "TTTz", url: "https://tttz.xyz" },
  { label: "Kaspa.org", url: "https://kaspa.org" },
  { label: "Explorer", url: "https://explorer.kaspa.org" },
  { label: "$KAS", url: "https://www.coingecko.com/en/coins/kaspa" },
];

const DEFAULT_HOME = "https://kaspa-app-9cc9fe40.base44.app";

function getAgentNarration(url) {
  if (!url) return "Ready to browse...";
  const lower = url.toLowerCase();
  if (lower.includes("google.com/search")) {
    try {
      const q = new URL(url).searchParams.get("q");
      if (q) return `Searching "${decodeURIComponent(q)}"…`;
    } catch {}
    return "Searching Google…";
  }
  if (lower.includes("kaspa-app-9cc9fe40")) return "Kaspa News — live feed";
  if (lower.includes("tttz.xyz")) return "TTTz app store";
  if (lower.includes("kaspa.org") && !lower.includes("explorer")) return "kaspa.org";
  if (lower.includes("explorer.kaspa.org")) return "Kaspa Explorer";
  if (lower.includes("coingecko.com")) return "$KAS price — CoinGecko";
  try { return new URL(url).hostname; } catch { return "Loading…"; }
}

export default function AgentBrowserPanel({ url: initialUrl }) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl || DEFAULT_HOME);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([initialUrl || DEFAULT_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const iframeRef = useRef(null);

  const narration = getAgentNarration(currentUrl);
  const activeQuickLink = QUICK_LINKS.find(q => {
    try { return currentUrl?.includes(new URL(q.url).hostname); } catch { return false; }
  });

  const navigateTo = (url) => {
    setLoading(true);
    setCurrentUrl(url);
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const i = historyIndex - 1;
      setHistoryIndex(i);
      setCurrentUrl(history[i]);
      setLoading(true);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const i = historyIndex + 1;
      setHistoryIndex(i);
      setCurrentUrl(history[i]);
      setLoading(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-1.5"
    >
      {/* Agent narration */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(6,182,212,0.25)" }}>
          <Zap className="w-2.5 h-2.5 text-cyan-400" />
        </div>
        <span className="text-[11px] text-cyan-400/90 font-medium truncate">{narration}</span>
        {loading && <div className="w-3 h-3 border border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin flex-shrink-0" />}
      </div>

      {/* Browser frame */}
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5" style={{ background: "rgba(20,20,28,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={goBack} disabled={historyIndex <= 0}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 disabled:opacity-20">
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button onClick={goForward} disabled={historyIndex >= history.length - 1}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 disabled:opacity-20">
            <ArrowRight className="w-3 h-3" />
          </button>
          <button onClick={() => { setLoading(true); if (iframeRef.current) iframeRef.current.src = currentUrl; }}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/70">
            <RotateCw className="w-2.5 h-2.5" />
          </button>

          {/* URL display */}
          <div className="flex-1 flex items-center gap-1 px-2 py-0.5 rounded mx-1 min-w-0"
            style={{ background: "rgba(0,0,0,0.3)" }}>
            <Globe className="w-2.5 h-2.5 text-white/25 flex-shrink-0" />
            <span className="text-[9px] text-white/40 truncate">{currentUrl}</span>
          </div>

          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            className="w-5 h-5 rounded flex items-center justify-center text-white/25 hover:text-white/60">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Loading bar */}
        {loading && (
          <div className="h-[2px] w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6)", width: "30%" }}
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Iframe — scaled down to fit small panel */}
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
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all"
              style={{
                background: isActive ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isActive ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.4)",
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