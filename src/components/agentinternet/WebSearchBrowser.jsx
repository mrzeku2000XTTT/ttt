import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, ExternalLink, RefreshCw, ArrowLeft, ArrowRight, Home, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import WebResultsList from "./WebResultsList";
import SitePreviewCard from "./SitePreviewCard";

const QUICK_LINKS = [
  { name: "DuckDuckGo", url: "https://duckduckgo.com" },
  { name: "Wikipedia", url: "https://www.wikipedia.org" },
  { name: "Hacker News", url: "https://news.ycombinator.com" },
  { name: "Kaspa.org", url: "https://kaspa.org" },
  { name: "MDN", url: "https://developer.mozilla.org" },
  { name: "Arxiv", url: "https://arxiv.org" },
  { name: "GitHub Trending", url: "https://github.com/trending" },
];

// Returns a URL for direct navigation, or null when the input is a search query.
function asUrl(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && !/\s/.test(v)) return `https://${v}`;
  return null;
}

function displayUrl(u) {
  return (u || "").replace(/^https?:\/\//, "");
}

export default function WebSearchBrowser({ open, onClose }) {
  const [input, setInput] = useState("");
  const [url, setUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [loadKey, setLoadKey] = useState(0);
  const [content, setContent] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isShell, setIsShell] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("home"); // home | results | page
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const cancelRef = useRef(null);

  const canBack = idx >= 0 && idx < history.length - 1;
  const canForward = idx > 0;

  const fetchPage = useCallback(async (target) => {
    if (!target) return;
    if (cancelRef.current) cancelRef.current.cancelled = true;
    const token = { cancelled: false };
    cancelRef.current = token;

    setLoading(true);
    setError(null);
    setContent(null);
    setMeta(null);
    setIsShell(false);

    try {
      const raw = await base44.functions.invoke("publicWebProxy", { url: target });
      const res = raw?.data ?? raw;
      if (token.cancelled) return;
      if (res?.success && res.content) {
        setContent(res.content);
        setMeta(res.meta || null);
        setIsShell(!!res.isShell);
      } else {
        setError(res?.error || "Failed to load page");
      }
    } catch (e) {
      if (token.cancelled) return;
      setError(e?.message || "Failed to load page");
    } finally {
      if (!token.cancelled) setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (q) => {
    if (cancelRef.current) cancelRef.current.cancelled = true;
    const token = { cancelled: false };
    cancelRef.current = token;

    setMode("results");
    setSearchQuery(q);
    setResults([]);
    setError(null);
    setLoading(true);
    setUrl(null);
    try {
      const raw = await base44.functions.invoke("openWebSearch", { query: q });
      const res = raw?.data ?? raw;
      if (token.cancelled) return;
      if (res?.success) setResults(res.results || []);
      else setError(res?.error || "Search failed");
    } catch (e) {
      if (!token.cancelled) setError(e?.message || "Search failed");
    } finally {
      if (!token.cancelled) setLoading(false);
    }
  }, []);

  const navigate = useCallback((raw, push = true) => {
    const next = asUrl(raw);
    if (!next) {
      const q = (raw || "").trim();
      if (q) runSearch(q);
      return;
    }
    setMode("page");
    setInput(displayUrl(next));
    if (push) {
      const h = [...history];
      h.splice(0, 0, next);
      setHistory(h.slice(0, 30));
      setIdx(0);
    }
    setUrl(next);
    setLoadKey(k => k + 1);
    fetchPage(next);
  }, [history, fetchPage, runSearch]);

  const back = () => {
    if (!canBack) return;
    const ni = idx + 1;
    setIdx(ni);
    const target = history[ni];
    setUrl(target);
    setInput(displayUrl(target));
    setLoadKey(k => k + 1);
    fetchPage(target);
  };
  const forward = () => {
    if (!canForward) return;
    const ni = idx - 1;
    setIdx(ni);
    const target = history[ni];
    setUrl(target);
    setInput(displayUrl(target));
    setLoadKey(k => k + 1);
    fetchPage(target);
  };
  const reload = () => {
    if (!url) return;
    setLoadKey(k => k + 1);
    fetchPage(url);
  };

  const submit = (e) => {
    e?.preventDefault();
    navigate(input);
  };

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setHistory([]);
      setIdx(-1);
      setInput("");
      setContent(null);
      setError(null);
      setLoading(false);
      setMode("home");
      setResults([]);
      setSearchQuery("");
      setMeta(null);
      setIsShell(false);
    }
  }, [open]);

  // Detect if iframe navigation changed the URL via postMessage fallback is not
  // possible cross-origin; rely on proxy finalUrl where provided.

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col"
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
                placeholder="Ask anything or type a URL"
                className="flex-1 bg-transparent text-white text-xs placeholder:text-white/30 focus:outline-none font-mono min-w-0"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </form>

            <button onClick={() => navigate("https://duckduckgo.com")} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-white/5">
            {QUICK_LINKS.map(q => (
              <button
                key={q.name}
                onClick={() => navigate(q.url)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                {q.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 relative bg-white overflow-hidden">
            {mode === "results" ? (
              <WebResultsList
                query={searchQuery}
                results={results}
                loading={loading}
                error={error}
                onOpen={(u) => navigate(u)}
              />
            ) : !url ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-zinc-950">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-cyan-300" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Search the web</h3>
                <p className="text-white/40 text-xs text-center max-w-xs">
                  Type any URL or search query. Real search results render directly inside TTT.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
                  {QUICK_LINKS.map(q => (
                    <button
                      key={q.name}
                      onClick={() => navigate(q.url)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-xs hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-3" />
                <span className="text-white/40 text-xs font-mono truncate max-w-[80vw]">{displayUrl(url)}</span>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-zinc-950 text-center">
                <p className="text-white/60 text-sm mb-2">Couldn't load this page</p>
                <p className="text-white/30 text-xs mb-5 max-w-xs">{error}</p>
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                </a>
              </div>
            ) : isShell ? (
              <SitePreviewCard url={url} meta={meta} />
            ) : content ? (
              <iframe
                key={loadKey}
                srcDoc={content}
                title="Web"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            ) : null}
          </div>

          {/* Footer status */}
          {url && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-[10px] text-white/50 pointer-events-none max-w-[90vw]">
              <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-cyan-400 animate-pulse' : error ? 'bg-red-400' : 'bg-emerald-400'}`} />
              <span className="font-mono truncate">{displayUrl(url)}</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}