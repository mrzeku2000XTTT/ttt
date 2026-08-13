import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, TrendingUp, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CryptoProfileGrid from "./CryptoProfileGrid";

const BTC_LOGO = "https://assets.coingecko.com/coins/images/1/large/bitcoin.png";

export default function CryptoSearchBrowser({ open, onClose }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [coins, setCoins] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("coins"); // coins | profiles
  const [profiles, setProfiles] = useState([]);

  // Load trending coins for the home view
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
        const data = await res.json();
        setTrending((data?.coins || []).map(c => c.item));
      } catch { /* trending is optional */ }
    })();
    (async () => {
      try {
        const rows = await base44.entities.KaspaHubApp.filter({ category: "Crypto X Profiles" }, "-created_date", 200);
        setProfiles(rows || []);
      } catch { /* profiles are optional */ }
    })();
  }, [open]);

  const runSearch = useCallback(async (q) => {
    const term = (q || "").trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError(null);
    setCoins([]);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(term)}`);
      const data = await res.json();
      const found = (data?.coins || []).slice(0, 20);
      if (found.length === 0) { setCoins([]); setLoading(false); return; }
      // Fetch live prices for the found coins
      const ids = found.map(c => c.id).join(",");
      let markets = [];
      try {
        const mRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=20`);
        markets = await mRes.json();
      } catch { /* prices optional */ }
      const priceMap = {};
      if (Array.isArray(markets)) markets.forEach(m => { priceMap[m.id] = m; });
      setCoins(found.map(c => ({ ...c, market: priceMap[c.id] || null })));
    } catch (e) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) { setInput(""); setQuery(""); setCoins([]); setError(null); setLoading(false); setTab("coins"); }
  }, [open]);

  const fmtPrice = (p) => {
    if (p == null) return "—";
    if (p >= 1) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return `$${p.toPrecision(4)}`;
  };

  const openCoin = (id) => window.open(`https://www.coingecko.com/en/coins/${id}`, "_blank", "noopener");

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
            <img src={BTC_LOGO} alt="" className="w-5 h-5 rounded-full" />
            <form
              onSubmit={(e) => { e.preventDefault(); if (tab === "coins") runSearch(input); }}
              className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full bg-white/[0.06] border border-white/10 focus-within:border-amber-500/40 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search any coin or token…"
                className="flex-1 bg-transparent text-white text-xs placeholder:text-white/30 focus:outline-none font-mono min-w-0"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </form>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-zinc-950">
            <button
              onClick={() => setTab("coins")}
              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border transition-colors ${tab === "coins" ? "bg-amber-500/20 border-amber-400/50 text-amber-200" : "border-white/10 text-white/50 hover:text-white"}`}
            >
              Coins
            </button>
            <button
              onClick={() => setTab("profiles")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border transition-colors ${tab === "profiles" ? "bg-amber-500/20 border-amber-400/50 text-amber-200" : "border-white/10 text-white/50 hover:text-white"}`}
            >
              <Users className="w-3 h-3" /> Crypto Profiles
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide bg-zinc-950 px-4 py-4">
            {tab === "profiles" ? (
              <div className="max-w-md mx-auto">
                <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-3">
                  Crypto X profiles · {profiles.length} indexed
                </p>
                <CryptoProfileGrid profiles={profiles} filter={input} />
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-3" />
                <span className="text-white/40 text-xs font-mono">Searching crypto…</span>
              </div>
            ) : error ? (
              <div className="text-center py-24">
                <p className="text-white/60 text-sm mb-1">Search failed</p>
                <p className="text-white/30 text-xs">{error}</p>
              </div>
            ) : query ? (
              coins.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-24">No coins found for "{query}"</p>
              ) : (
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-3">Results for "{query}"</p>
                  {coins.map(c => (
                    <button
                      key={c.id}
                      onClick={() => openCoin(c.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-amber-500/30 transition-colors text-left"
                    >
                      <img src={c.large || c.thumb} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{c.name}</div>
                        <div className="text-white/40 text-[10px] font-mono uppercase">{c.symbol}{c.market_cap_rank ? ` · #${c.market_cap_rank}` : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-xs font-mono">{fmtPrice(c.market?.current_price)}</div>
                        {c.market?.price_change_percentage_24h != null && (
                          <div className={`text-[10px] font-mono ${c.market.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {c.market.price_change_percentage_24h >= 0 ? "+" : ""}{c.market.price_change_percentage_24h.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="max-w-md mx-auto">
                <div className="flex flex-col items-center pt-10 pb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center mb-4">
                    <img src={BTC_LOGO} alt="" className="w-8 h-8 rounded-full" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Search Crypto</h3>
                  <p className="text-white/40 text-xs text-center max-w-xs">
                    Live prices, ranks and 24h moves for any coin or token.
                  </p>
                </div>
                {trending.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-widest mb-3">
                      <TrendingUp className="w-3 h-3" /> Trending now
                    </div>
                    <div className="space-y-2">
                      {trending.map(t => (
                        <button
                          key={t.id}
                          onClick={() => openCoin(t.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-amber-500/30 transition-colors text-left"
                        >
                          <img src={t.large || t.thumb} alt="" className="w-8 h-8 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-semibold truncate">{t.name}</div>
                            <div className="text-white/40 text-[10px] font-mono uppercase">{t.symbol}{t.market_cap_rank ? ` · #${t.market_cap_rank}` : ""}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}