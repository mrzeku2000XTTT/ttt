import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, ExternalLink, RefreshCw, ArrowLeft, ArrowRight, Home } from "lucide-react";

const QUICK_LINKS = [
  { name: "Google", url: "https://www.google.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "X", url: "https://x.com" },
  { name: "Wikipedia", url: "https://www.wikipedia.org" },
  { name: "Reddit", url: "https://www.reddit.com" },
  { name: "GitHub", url: "https://github.com" },
  { name: "Kaspa", url: "https://kaspa.org" },
  { name: "TTT", url: "https://tttz.xyz" },
];

function normalizeInput(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  // Already a URL
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && !/\s/.test(v)) return `https://${v}`;
  // Treat as Google search
  return `https://www.google.com/search?q=${encodeURIComponent(v)}`;
}

export default function WebSearchBrowser({ open, onClose }) {
  const [input, setInput] = useState("");
  const [url, setUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [loadKey, setLoadKey] = useState(0);
  const iframeRef = useRef(null);

  const go = (raw) => {
    const next = normalizeInput(raw);
    if (!next) return;
    setInput(next.startsWith("https://www.google.com/search?") ? "" : next.replace(/^https?:\/\//, ""));
    const h = [...history];
    h.splice(0, 0, next);
    setHistory(h.slice(0, 30));
    setIdx(0);
    setUrl(next);
    setLoadKey(k => k + 1);
  };

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setHistory([]);
      setIdx(-1);
      setInput("");
    }
  }, [open]);

  const canBack = idx >= 0 && idx < history.length - 1;
  const canForward = idx > 0;

  const back = () => {
    if (!canBack) return;
    const ni = idx + 1;
    setIdx(ni);
    setUrl(history[ni]);
    setLoadKey(k => k + 1);
  };
  const forward = () => {
    if (!canForward) return;
    const ni = idx - 1;
    setIdx(ni);
    setUrl(history[ni]);
    setLoadKey(k => k + 1);
  };
  const reload = () => setLoadKey(k => k + 1);

  const submit = (e) => {
    e?.preventDefault();
    go(input);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col"
        >
          {/* Top chrome */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-black/60 backdrop-blur-xl" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.625rem)" }}>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <button onClick={back} disabled={!canBack} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={forward} disabled={!canForward} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={reload} disabled={!url} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submit} className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full bg-white/[0.06] border border-white/10 focus-within:border-cyan-500/40 transition-colors">
              <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search Google or type any URL"
                className="flex-1 bg-transparent text-white text-xs placeholder:text-white/30 focus:outline-none font-mono"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </form>

            <button onClick={() => go("https://www.google.com")} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-white/5">
            {QUICK_LINKS.map(q => (
              <button
                key={q.name}
                onClick={() => go(q.url)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {q.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 relative bg-zinc-950">
            {!url ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-cyan-300" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Search the web</h3>
                <p className="text-white/40 text-xs text-center max-w-xs">
                  Type any URL or search query. Browse any site directly inside TTT.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
                  {QUICK_LINKS.map(q => (
                    <button
                      key={q.name}
                      onClick={() => go(q.url)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-xs hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <iframe
                  key={loadKey}
                  ref={iframeRef}
                  src={url}
                  title="Web"
                  className="w-full h-full border-0 bg-white"
                  referrerPolicy="no-referrer"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-[10px] text-white/50 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono truncate max-w-[60vw]">{url}</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}