import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, ExternalLink, Loader2, Database, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["All", "Resources", "Exchanges", "Ecosystem", "Wallets", "Merchants", "Merchant Solutions", "Developer Tools", "Community Chats", "News Sources"];

function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
}

export default function KaspaSearchBrowser({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notIndexed, setNotIndexed] = useState(false);
  const inputRef = useRef(null);
  const reqId = useRef(0);

  const runSearch = useCallback(async (q, cat) => {
    const myId = ++reqId.current;
    setLoading(true);
    setError(null);
    setNotIndexed(false);
    try {
      const res = await base44.functions.searchKaspaApps({ query: q, category: cat, limit: 60 });
      if (reqId.current !== myId) return;
      if (res?.success) {
        setResults(res.results || []);
        setTotal(res.total || 0);
        if (res.message) setNotIndexed(true);
      } else {
        setError(res?.error || "Search failed");
      }
    } catch (e) {
      if (reqId.current !== myId) return;
      setError(e?.message || "Search failed");
    } finally {
      if (reqId.current === myId) setLoading(false);
    }
  }, []);

  // Initial load — show all apps when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSubmitted("");
      setActiveCategory("All");
      runSearch("", "All");
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, runSearch]);

  const submit = (e) => {
    e?.preventDefault();
    setSubmitted(query.trim());
    runSearch(query.trim(), activeCategory);
  };

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    runSearch(submitted, cat);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col"
        >
          {/* Header — Google-style */}
          <div className="flex items-center gap-3 px-4 pt-6 pb-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Database className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-bold text-sm hidden sm:inline">Search Kaspa</span>
            </div>

            <form onSubmit={submit} className="flex-1 flex items-center gap-2 px-4 h-11 rounded-full bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_0_4px_rgba(6,182,212,0.1)] transition-all max-w-2xl">
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search all Kaspa apps, wallets, tools, merchants…"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none min-w-0"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {loading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />}
            </form>
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-white/5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-200"
                    : "bg-white/[0.05] border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results meta */}
          <div className="px-4 py-1.5 text-[11px] text-white/40 font-mono border-b border-white/5">
            {loading ? "Searching…" : notIndexed
              ? "Index not built yet — run the indexer"
              : `About ${total} Kaspa apps indexed${submitted ? ` · results for "${submitted}"` : ""}`}
          </div>

          {/* Results — Google-style */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <p className="text-white/60 text-sm mb-2">Search failed</p>
                <p className="text-white/30 text-xs">{error}</p>
              </div>
            ) : notIndexed ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Database className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-white/70 text-sm mb-1">No apps indexed yet</p>
                <p className="text-white/30 text-xs max-w-xs">The KaspaHub index needs to be built first. An admin can run the indexer to populate ~600 apps.</p>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Globe className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-white/50 text-sm mb-1">No matching apps</p>
                <p className="text-white/30 text-xs">Try a different keyword or category.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-5">
                {results.map((app, i) => (
                  <div key={app.id || i} className="group">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                        {app.logo ? (
                          <img src={app.logo} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span className="text-white/60 text-xs font-bold">{(app.name || "?").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <h3 className="text-[15px] text-cyan-300 hover:underline font-medium leading-snug truncate">
                            {app.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-emerald-400/70 font-mono truncate">{hostOf(app.url)}</span>
                            {app.category && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-white/40 flex-shrink-0">{app.category}</span>
                            )}
                          </div>
                        </a>
                        {app.description && (
                          <p className="text-[13px] text-white/60 mt-1 leading-relaxed line-clamp-3">{app.description}</p>
                        )}
                        {app.features?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {app.features.slice(0, 4).map((f, fi) => (
                              <span key={fi} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300/70 border border-cyan-500/20">{f}</span>
                            ))}
                          </div>
                        )}
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Open app
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-black/40 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-cyan-400/60" />
            <span className="text-[10px] text-white/40 font-mono">Powered by KaspaHub.org ecosystem index</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}