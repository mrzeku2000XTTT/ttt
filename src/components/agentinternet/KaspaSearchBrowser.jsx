import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, ExternalLink, Loader2, Database, Sparkles, Plus, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AiOverviewCard from "./AiOverviewCard";
import ListSiteModal from "./ListSiteModal";
import SiteAgentChat from "./SiteAgentChat";
import SiteLogo from "./SiteLogo";
import KaspianProfileGrid from "./KaspianProfileGrid";

// "$KAS" is the Kaspian wall — same index, rendered as a profile grid.
const KAS_TAB = "$KAS";
const CATEGORIES = [KAS_TAB, "All", "Ecosystem", "Resources", "Exchanges", "Wallets", "Merchant Solutions", "Developer Tools", "Community Chats", "News Sources", "X Profiles"];

const PAGE_SIZE = 50;

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
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [listOpen, setListOpen] = useState(false);
  const [agentApp, setAgentApp] = useState(null);
  const inputRef = useRef(null);
  const reqId = useRef(0);

  const runSearch = useCallback(async (q, cat) => {
    const myId = ++reqId.current;
    setLoading(true);
    setError(null);
    setNotIndexed(false);
    setAi(null);
    setAiLoading(false);
    setVisible(PAGE_SIZE);
    try {
      const raw = await base44.functions.invoke("searchKaspaApps", { query: q, category: cat, limit: 2000 });
      const res = raw?.data ?? raw;
      if (reqId.current !== myId) return;
      if (res?.success) {
        setResults(res.results || []);
        setTotal(res.total || 0);
        if (res.message) setNotIndexed(true);
        // AI overview runs after results are on screen so the list never waits
        if (q) {
          setAiLoading(true);
          base44.functions.invoke("searchKaspaApps", { query: q, category: cat, aiOnly: true })
            .then(r => {
              const d = r?.data ?? r;
              if (reqId.current === myId) setAi(d?.ai || null);
            })
            .catch(() => {})
            .finally(() => { if (reqId.current === myId) setAiLoading(false); });
        }
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

  // Nothing is persisted — wipe the in-memory search trail when the user leaves.
  const closeAndWipe = () => {
    reqId.current++;
    setQuery(""); setSubmitted(""); setResults([]); setTotal(0); setAi(null); setAgentApp(null);
    onClose?.();
  };

  const submit = (e) => {
    e?.preventDefault();
    setSubmitted(query.trim());
    runSearch(query.trim(), activeCategory === KAS_TAB ? "X Profiles" : activeCategory);
  };

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    runSearch(submitted, cat === KAS_TAB ? "X Profiles" : cat);
  };

  const isKasTab = activeCategory === KAS_TAB;

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
          <div className="px-4 pt-6 pb-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <div className="flex items-center gap-3 w-full max-w-4xl mx-auto">
            <button onClick={closeAndWipe} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <img
                src="https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png"
                alt="Kaspa"
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <span className="text-white font-bold text-sm tracking-tight hidden sm:inline">Search <span className="text-cyan-300">Kaspa</span></span>
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

            <button
              onClick={() => setListOpen(true)}
              title="List your site"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          </div>

          <ListSiteModal
            open={listOpen}
            onClose={() => setListOpen(false)}
            onListed={(res) => {
              const cat = res?.app?.category;
              if (cat) {
                setActiveCategory(cat);
                runSearch(submitted, cat);
              } else {
                runSearch(submitted, activeCategory);
              }
            }}
          />

          {/* Category chips */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-white/5 w-full max-w-4xl mx-auto">
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
          <div className="px-4 py-1.5 text-[11px] text-white/40 font-mono border-b border-white/5 w-full max-w-4xl mx-auto">
            {loading ? "Searching…" : notIndexed
              ? "Index not built yet — run the indexer"
              : `${results.length} of ${total} apps in ${activeCategory}${submitted ? ` · results for "${submitted}"` : ""}`}
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
            ) : isKasTab ? (
              <div className="space-y-4">
                <KaspianProfileGrid profiles={results.slice(0, visible)} onAskAI={setAgentApp} />
                {visible < results.length && (
                  <button
                    onClick={() => setVisible(v => v + PAGE_SIZE)}
                    className="w-full max-w-4xl mx-auto block py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
                  >
                    Show more Kaspians ({results.length - visible} remaining)
                  </button>
                )}
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="px-2">
                <AiOverviewCard text={ai} loading={aiLoading} />
                <div className="flex flex-col items-center justify-center text-center px-6 py-10">
                  <Globe className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm mb-1">No matching apps</p>
                  <p className="text-white/30 text-xs">Try a different keyword or category.</p>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-5">
                <AiOverviewCard text={ai} loading={aiLoading} />
                {results.slice(0, visible).map((app, i) => (
                  <div key={app.id || i} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-colors p-3.5">
                    <div className="flex items-start gap-3">
                      <SiteLogo app={app} size={36} />
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
                        <div className="flex items-center gap-3 mt-1.5">
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Open app
                          </a>
                          <button
                            onClick={() => setAgentApp(app)}
                            className="inline-flex items-center gap-1 text-[11px] text-cyan-300/70 hover:text-cyan-200 transition-colors"
                          >
                            <Bot className="w-3 h-3" /> Ask its AI
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {visible < results.length && (
                  <button
                    onClick={() => setVisible(v => v + PAGE_SIZE)}
                    className="w-full py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
                  >
                    Show more ({results.length - visible} remaining)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-black/40 flex items-center justify-center gap-2">
            <span className="text-[10px] text-white/40 font-mono">tttz.xyz</span>
          </div>

          <SiteAgentChat app={agentApp} onClose={() => setAgentApp(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}