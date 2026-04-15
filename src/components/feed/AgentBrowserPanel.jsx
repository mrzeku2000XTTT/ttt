import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, Globe, Lock } from "lucide-react";

const QUICK_LINKS = [
  { label: "Kaspa News", url: "https://kaspa-app-9cc9fe40.base44.app" },
  { label: "TTTz", url: "https://tttz.xyz" },
  { label: "Kaspa.org", url: "https://kaspa.org" },
  { label: "Explorer", url: "https://explorer.kaspa.org" },
  { label: "$KAS", url: "https://www.coingecko.com/en/coins/kaspa" },
];

const DEFAULT_HOME = "https://kaspa-app-9cc9fe40.base44.app";




export default function AgentBrowserPanel({ url: initialUrl }) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl || DEFAULT_HOME);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([initialUrl || DEFAULT_HOME]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const iframeRef = useRef(null);
  const panelRef = useRef(null);
  const prevInitialUrl = useRef(initialUrl);

  // Sync when parent passes a new URL
  useEffect(() => {
    if (initialUrl && initialUrl !== prevInitialUrl.current) {
      prevInitialUrl.current = initialUrl;
      setCurrentUrl(initialUrl);
      setLoading(true);
      const newHistory = [...history.slice(0, historyIndex + 1), initialUrl];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [initialUrl]);

  const isHttps = currentUrl?.startsWith("https");
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
    <div className="w-full h-full flex flex-col min-h-0 gap-1.5 py-1.5">
      {/* Browser frame */}
      <div ref={panelRef} className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(18,18,24,0.95)" }}>

        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0"
          style={{ background: "rgba(30,30,38,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={goBack} disabled={historyIndex <= 0}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button onClick={goForward} disabled={historyIndex >= history.length - 1}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors">
            <ArrowRight className="w-3 h-3" />
          </button>
          <button onClick={() => { setLoading(true); if (iframeRef.current) iframeRef.current.src = currentUrl; }}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <RotateCw className="w-2.5 h-2.5" />
          </button>
          <button onClick={() => navigateTo(DEFAULT_HOME)}
            className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <Home className="w-2.5 h-2.5" />
          </button>

          {/* Address bar */}
          <div className="flex-1 flex items-center gap-1 px-2 py-0.5 rounded-md min-w-0"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {isHttps && <Lock className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />}
            <span className="text-[9px] text-white/45 truncate">{currentUrl}</span>
          </div>

          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-colors">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Loading progress bar */}
        {loading && (
          <div className="h-[2px] w-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.02)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)", width: "40%" }}
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Iframe — full size, directly interactive */}
        <div className="flex-1 min-h-0">
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser"
          />
        </div>
      </div>

      {/* URL / Search input */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Globe className="w-3 h-3 text-white/25 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search or enter URL…"
            className="flex-1 bg-transparent text-[11px] text-white/80 outline-none placeholder-white/25"
            style={{ fontSize: "16px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                const val = e.target.value.trim();
                let url;
                if (/^https?:\/\//i.test(val)) url = val;
                else if (/^www\./i.test(val)) url = `https://${val}`;
                else if (/\.\w{2,}/.test(val) && !val.includes(" ")) url = `https://${val}`;
                else url = `https://www.google.com/search?igu=1&q=${encodeURIComponent(val)}`;
                navigateTo(url);
                e.target.value = "";
                e.target.blur();
              }
            }}
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
    </div>
  );
}