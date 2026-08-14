import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Globe, ExternalLink, Loader2, Database, Sparkles, Plus, Bot, UserPlus, CheckCircle2, AlertCircle, Dices, Share2, Swords, Wand2, Coins, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AiOverviewCard from "./AiOverviewCard";
import ListSiteModal from "./ListSiteModal";
import SiteAgentChat from "./SiteAgentChat";
import SiteLogo from "./SiteLogo";
import KaspianProfileGrid from "./KaspianProfileGrid";
import KaspaPulseBar from "./KaspaPulseBar";
import ShareCardModal from "./ShareCardModal";
import AgentBattleModal from "./AgentBattleModal";
import TipListingModal from "./TipListingModal";
import TipLeaderboardModal from "./TipLeaderboardModal";
import { translateQuery } from "./nlSearch";

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
  const [linkAdd, setLinkAdd] = useState(null); // { status: 'adding'|'added'|'exists'|'error', handle, error }
  const [verifiedUrls, setVerifiedUrls] = useState(new Set()); // KNS-verified owners
  const [shareCard, setShareCard] = useState(null);
  const [battleOpen, setBattleOpen] = useState(false);
  const [nlHint, setNlHint] = useState(null); // what the AI understood from a spoken-style query
  const [ownerAddresses, setOwnerAddresses] = useState(new Map()); // verified url -> kaspa address
  const [tipTarget, setTipTarget] = useState(null);
  const [boardOpen, setBoardOpen] = useState(false);
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
      setLinkAdd(null);
      runSearch("", "All");
      setTimeout(() => inputRef.current?.focus(), 300);
      base44.entities.SiteOwnerClaim.filter({ verified: true }, "-created_date", 500)
        .then(rows => {
          const list = rows || [];
          const key = (u) => (u || "").toLowerCase().replace(/\/+$/, "");
          setVerifiedUrls(new Set(list.map(r => key(r.site_url))));
          setOwnerAddresses(new Map(list.filter(r => r.owner_address).map(r => [key(r.site_url), r.owner_address])));
        })
        .catch(() => {});
    }
  }, [open, runSearch]);

  // "I'm feeling lucky" — jump to a random listing with its AI agent open.
  const feelingLucky = () => {
    if (!results.length) return;
    setAgentApp(results[Math.floor(Math.random() * results.length)]);
  };

  // Only KNS-verified owners can receive tips — the address comes from their claim.
  const tipAddressFor = (app) => ownerAddresses.get((app?.url || "").toLowerCase().replace(/\/+$/, ""));
  const tipApp = (app) => {
    const address = tipAddressFor(app);
    if (address) setTipTarget({ name: app.name, url: app.url, address });
  };

  const shareApp = (app) => setShareCard({
    title: app.name,
    subtitle: hostOf(app.url),
    description: app.description,
    logo: app.logo,
  });

  // Nothing is persisted — wipe the in-memory search trail when the user leaves.
  const closeAndWipe = () => {
    reqId.current++;
    setQuery(""); setSubmitted(""); setResults([]); setTotal(0); setAi(null); setAgentApp(null);
    onClose?.();
  };

  // Smart bar: a pasted X/Twitter profile link auto-adds the Kaspian and shows them.
  const RESERVED = ["home", "search", "explore", "i", "intent", "hashtag", "share", "settings", "notifications", "messages"];
  const extractXHandle = (q) => {
    const m = (q || "").match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})/i);
    return m && !RESERVED.includes(m[1].toLowerCase()) ? m[1] : null;
  };

  const addXProfileFromLink = async (handle) => {
    setLinkAdd({ status: "adding", handle });
    try {
      const raw = await base44.functions.invoke("submitXProfile", { handle });
      const res = raw?.data ?? raw;
      if (res?.success) {
        setLinkAdd({ status: res.already_listed ? "exists" : "added", handle });
        setActiveCategory(KAS_TAB);
        setQuery(handle);
        setSubmitted(handle);
        runSearch(handle, "X Profiles");
      } else {
        setLinkAdd({ status: "error", handle, error: res?.error || "Could not verify this profile" });
      }
    } catch (e) {
      setLinkAdd({ status: "error", handle, error: e?.message || "Failed to add profile" });
    }
  };

  // Any non-X link gets security-scanned and indexed as a Kaspa site.
  const isLink = (q) => /^(https?:\/\/|www\.)\S+$/i.test(q) || /^[a-z0-9-]+\.[a-z]{2,}(\/\S*)?$/i.test(q);

  const addSiteFromLink = async (url) => {
    setLinkAdd({ status: "adding", handle: url });
    try {
      const raw = await base44.functions.invoke("submitKaspaSite", { url });
      const res = raw?.data ?? raw;
      if (res?.success && res.app) {
        setLinkAdd({ status: res.already_listed ? "exists" : "added", handle: url });
        const cat = res.app.category || "Ecosystem";
        setActiveCategory(cat);
        setQuery(res.app.name);
        setSubmitted(res.app.name);
        runSearch(res.app.name, cat);
      } else if (res?.verified === false) {
        setLinkAdd({ status: "error", handle: url, error: res?.security?.explanation || "This site failed the security scan." });
      } else {
        setLinkAdd({ status: "error", handle: url, error: res?.error || "Could not index this link" });
      }
    } catch (e) {
      setLinkAdd({ status: "error", handle: url, error: e?.message || "Failed to index link" });
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    const handle = extractXHandle(q);
    if (handle) { addXProfileFromLink(handle); return; }
    if (isLink(q)) { addSiteFromLink(q); return; }
    setLinkAdd(null);
    setNlHint(null);
    setSubmitted(q);
    const cat = activeCategory === KAS_TAB ? "X Profiles" : activeCategory;
    runSearch(q, cat);

    // Natural-language queries get re-run with AI-extracted keywords
    const nl = await translateQuery(q);
    if (nl && nl.keywords.toLowerCase() !== q.toLowerCase()) {
      setNlHint(nl);
      const nlCat = nl.category || cat;
      if (nl.category) setActiveCategory(nl.category);
      runSearch(nl.keywords, nlCat);
    }
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
          <div className="flex flex-wrap items-center gap-y-2 gap-x-3 w-full max-w-4xl mx-auto">
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

            <form onSubmit={submit} className="flex-1 min-w-[200px] flex items-center gap-2 px-4 h-11 rounded-full bg-white/[0.06] border border-white/15 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_0_4px_rgba(6,182,212,0.1)] transition-all max-w-2xl">
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

            <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setBoardOpen(true)}
              title="Tip leaderboard"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 hover:bg-amber-500/25 transition-colors"
            >
              <Trophy className="w-4 h-4" />
            </button>

            <button
              onClick={() => setBattleOpen(true)}
              title="Agent battle — ask 3 agents at once"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-300 hover:bg-fuchsia-500/25 transition-colors"
            >
              <Swords className="w-4 h-4" />
            </button>

            <button
              onClick={feelingLucky}
              title="I'm feeling lucky — random Kaspa app + its AI"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/15 text-white/60 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
            >
              <Dices className="w-4 h-4" />
            </button>

            <button
              onClick={() => setListOpen(true)}
              title="List your site"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            </div>
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

          <KaspaPulseBar />

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

          {/* Smart link banner */}
          {linkAdd && (
            <div className="px-4 py-2 border-b border-white/5 w-full max-w-4xl mx-auto">
              {linkAdd.status === "adding" ? (
                <div className="flex items-center gap-2 text-[11px] text-cyan-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <span>Link detected — security-scanning <span className="font-mono">{linkAdd.handle.includes(".") ? linkAdd.handle : `@${linkAdd.handle}`}</span> and indexing it…</span>
                </div>
              ) : linkAdd.status === "added" ? (
                <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span><span className="font-mono">{linkAdd.handle.includes(".") ? linkAdd.handle : `@${linkAdd.handle}`}</span> verified and added to the index.</span>
                </div>
              ) : linkAdd.status === "exists" ? (
                <div className="flex items-center gap-2 text-[11px] text-cyan-300">
                  <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
                  <span><span className="font-mono">{linkAdd.handle.includes(".") ? linkAdd.handle : `@${linkAdd.handle}`}</span> is already indexed — here it is.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-red-300">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{linkAdd.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Natural-language interpretation */}
          {nlHint && (
            <div className="px-4 py-2 border-b border-white/5 w-full max-w-4xl mx-auto flex items-center gap-2 text-[11px] text-fuchsia-300">
              <Wand2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Understood as <span className="font-mono text-white">{nlHint.keywords}</span>
                {nlHint.category ? <> in <span className="font-mono text-white">{nlHint.category}</span></> : null}
              </span>
            </div>
          )}

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
                <KaspianProfileGrid
                  profiles={results.slice(0, visible)}
                  onAskAI={setAgentApp}
                  onShare={shareApp}
                  onTip={tipApp}
                  canTip={(app) => !!tipAddressFor(app)}
                  verifiedUrls={verifiedUrls}
                />
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
                          <button
                            onClick={() => shareApp(app)}
                            className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                          >
                            <Share2 className="w-3 h-3" /> Share card
                          </button>
                          {tipAddressFor(app) && (
                            <button
                              onClick={() => tipApp(app)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-300/80 hover:text-amber-200 transition-colors"
                            >
                              <Coins className="w-3 h-3" /> Tip KAS
                            </button>
                          )}
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
          <ShareCardModal card={shareCard} onClose={() => setShareCard(null)} />
          <AgentBattleModal open={battleOpen} onClose={() => setBattleOpen(false)} pool={results} verifiedUrls={verifiedUrls} />
          <TipListingModal target={tipTarget} onClose={() => setTipTarget(null)} />
          <TipLeaderboardModal open={boardOpen} onClose={() => setBoardOpen(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}