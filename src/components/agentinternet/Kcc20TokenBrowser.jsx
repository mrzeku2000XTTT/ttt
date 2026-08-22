import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ExternalLink, Trophy, Flame, Bot, Star, Sparkles, Wallet } from "lucide-react";
import Kcc20TokenDetail from "./Kcc20TokenDetail";
import Kcc20SellAlerts from "./Kcc20SellAlerts";
import { getFavorites, toggleFavorite } from "@/lib/kcc20Favorites";

// Real KRON endpoints (same ones the KCC20-wallet repo calls)
const REG = "https://api.kron.technology";
const IDX = "https://idx.kron.technology/v1/kcc20";

const KAS_LOGO = "https://assets.coingecko.com/coins/images/28298/large/kaspa.png";

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body?.result ?? body;
}

// Per-token live oracle detail. The /markets list is NOT exhaustive — many
// trading tokens (KKDAG, CHIP, CLOCK, …) only expose live price/TVL/holders
// via /token/{tick}. We backfill every registry token missing from /markets
// so the "live oracle" really covers the whole list.
async function fetchTokenDetail(tick) {
  try {
    const res = await fetch(`${IDX}/token/${encodeURIComponent(tick)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    const d = body?.result ?? body;
    return Array.isArray(d) ? d[0] || null : d || null;
  } catch { return null; }
}

export async function loadKcc20Tokens() {
  const [listRes, mkts] = await Promise.all([
    fetchJson(`${REG}/api/registry/tokenlist`).catch(() => ({ tokens: [] })),
    fetchJson(`${IDX}/markets`).catch(() => []),
  ]);

  const regByTick = new Map();
  for (const e of (listRes?.tokens || [])) {
    const t = String(e.symbol || "").toUpperCase();
    if (t) regByTick.set(t, e);
  }

  // Start the live map from the /markets bulk list.
  const liveMap = new Map();
  for (const m of (Array.isArray(mkts) ? mkts : [])) {
    const t = String(m.tick || "").toUpperCase();
    if (t) liveMap.set(t, m);
  }

  // Backfill registry tokens that /markets skipped, via per-token oracle lookups
  // (bounded concurrency so we don't hammer the indexer).
  const missing = [];
  for (const t of regByTick.keys()) if (!liveMap.has(t)) missing.push(t);
  const CONC = 6;
  for (let i = 0; i < missing.length; i += CONC) {
    const batch = missing.slice(i, i + CONC);
    const details = await Promise.all(batch.map(fetchTokenDetail));
    details.forEach((d, idx) => {
      if (!d) return;
      const hasData = Number(d.price) || Number(d.tvl) || Number(d.volume24h) || Number(d.holderTotal);
      if (hasData) liveMap.set(batch[idx], { ...d, tick: batch[idx] });
    });
  }

  const seen = new Set();
  const tokens = [];

  // 1) Every token with live oracle data (from /markets or per-token backfill).
  for (const [tick, m] of liveMap.entries()) {
    if (seen.has(tick)) continue;
    seen.add(tick);
    const e = regByTick.get(tick) || {};
    tokens.push({
      tick,
      name: m.name || e.name || tick,
      decimals: Number(e.decimals ?? m.dec ?? 0),
      logo: e.logoURI || "",
      website: e.extensions?.website || e.extensions?.url || "",
      covenantId: m.covenantId || e.covenantId || "",
      graduated: !!(e.extensions?.graduated || m.graduated),
      price: Number(m.price || 0),
      change24h: Number(m.change24h || 0),
      volume24h: Number(m.volume24h || 0),
      tvl: Number(m.tvl || 0),
      holderTotal: Number(m.holderTotal || 0),
      hasMarket: true,
      featured: tick === "KKDAG",
    });
  }

  // 2) Registry tokens with genuinely no oracle data (not launched / empty).
  for (const e of (listRes?.tokens || [])) {
    const tick = String(e.symbol || "").toUpperCase();
    if (!tick || seen.has(tick)) continue;
    seen.add(tick);
    tokens.push({
      tick,
      name: e.name || tick,
      decimals: Number(e.decimals || 0),
      logo: e.logoURI || "",
      website: e.extensions?.website || e.extensions?.url || "",
      covenantId: e.covenantId || "",
      graduated: !!(e.extensions?.graduated),
      price: 0,
      change24h: 0,
      volume24h: 0,
      tvl: 0,
      holderTotal: 0,
      hasMarket: false,
      featured: tick === "KKDAG",
    });
  }

  // Featured (KKDAG) first, then live volume, then TVL, then alphabetical.
  tokens.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (b.volume24h || 0) - (a.volume24h || 0)
      || (b.tvl || 0) - (a.tvl || 0)
      || a.tick.localeCompare(b.tick);
  });
  return tokens;
}

function fmtKas(n) {
  if (n == null || !isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} KAS`;
  if (n >= 1) return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS`;
  return `${n.toPrecision(3)} KAS`;
}

function fmtUsd(kas, kasPrice) {
  if (kas == null || !kasPrice) return null;
  const usd = kas * kasPrice;
  return `$${usd >= 1 ? usd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : usd.toPrecision(2)}`;
}

// A favorite is under "selling pressure" when it's down ≥3% over 24h with real volume.
const SELL_DROP = -3;

export default function Kcc20TokenBrowser({ filter, kasPrice, onAskAI, onSellAlertCount }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("all"); // all | new | fav
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem("kcc20_alerts_dismissed") || "[]")); }
    catch { return new Set(); }
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loadKcc20Tokens()
      .then((t) => alive && setTokens(t))
      .catch((e) => alive && setError(e?.message || "Failed to load KCC20 tokens"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  // Keep favorites fresh if changed in another tab.
  useEffect(() => {
    const onStorage = (e) => { if (e.key === "kcc20_favorites_v1") setFavorites(getFavorites()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const favCount = useMemo(
    () => tokens.filter((t) => favorites.has(t.tick)).length,
    [tokens, favorites],
  );

  const newCount = useMemo(
    () => tokens.filter((t) => t.hasMarket && !t.graduated).length,
    [tokens],
  );

  // Sell-pressure alerts on favorited tokens (24h drop + volume).
  const sellAlerts = useMemo(() => {
    return tokens
      .filter((t) => favorites.has(t.tick) && t.hasMarket && t.change24h <= SELL_DROP && t.volume24h > 0)
      .filter((t) => !dismissedAlerts.has(t.tick))
      .sort((a, b) => a.change24h - b.change24h);
  }, [tokens, favorites, dismissedAlerts]);

  // Surface the alert count to the parent so it can badge the KCC20 tab.
  useEffect(() => {
    if (onSellAlertCount) onSellAlertCount(sellAlerts.length);
  }, [sellAlerts, onSellAlertCount]);

  const dismissAlert = (tick) => {
    const next = new Set(dismissedAlerts);
    next.add(tick);
    setDismissedAlerts(next);
    try { sessionStorage.setItem("kcc20_alerts_dismissed", JSON.stringify([...next])); } catch { /* ignore */ }
  };

  const onToggleFav = (tick) => {
    setFavorites(toggleFavorite(tick));
  };

  const openKccWallet = () => {
    // Hard navigate to the iframed KCC20 wallet app (closes this overlay).
    window.location.href = "/KCC20";
  };

  const visible = useMemo(() => {
    const f = (filter || "").trim().toUpperCase();
    let list = tokens;
    if (view === "new") list = list.filter((t) => t.hasMarket && !t.graduated);
    if (view === "fav") list = list.filter((t) => favorites.has(t.tick));
    if (f) list = list.filter((t) => t.tick.includes(f) || (t.name || "").toUpperCase().includes(f));
    if (view === "new") {
      // Fewest holders first = earliest opportunity to buy.
      list = [...list].sort((a, b) =>
        (a.holderTotal || 0) - (b.holderTotal || 0) ||
        (a.tvl || 0) - (b.tvl || 0) ||
        a.tick.localeCompare(b.tick));
    }
    return list;
  }, [tokens, view, favorites, filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-3" />
        <span className="text-white/40 text-xs font-mono">Loading KCC20 tokens from KRON…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-white/60 text-sm mb-1">Couldn't load KCC20 tokens</p>
        <p className="text-white/30 text-xs font-mono">{error}</p>
      </div>
    );
  }

  const graduatedCount = tokens.filter((t) => t.graduated).length;

  const Seg = ({ id, label, count, Icon }) => (
    <button
      onClick={() => setView(id)}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${
        view === id
          ? "bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {count > 0 && (
        <span className={`ml-0.5 px-1 rounded-full text-[8px] ${view === id ? "bg-amber-400/30 text-amber-100" : "bg-white/10 text-white/50"}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Action bar: segmented views + KCC20 wallet app */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Seg id="all" label="All" Icon={Flame} count={tokens.length} />
          <Seg id="new" label="New" Icon={Sparkles} count={newCount} />
          <Seg id="fav" label="Favs" Icon={Star} count={favCount} />
        </div>
        <button
          onClick={openKccWallet}
          title="Open the KCC20 wallet app"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest border border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:border-amber-400/60 transition-all"
        >
          <Wallet className="w-3.5 h-3.5" /> Wallet
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
          {view === "new" && "🚀 New launches · buy early on the bonding curve"}
          {view === "fav" && "⭐ Your favorite KCC20 tokens"}
          {view === "all" && `KCC20 on KRON · ${tokens.length} · ${graduatedCount} graduated`}
        </p>
        <a
          href="https://kron.technology"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-amber-300/70 hover:text-amber-200"
        >
          kron <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* In-app sell-pressure notification for favorites */}
      {view !== "fav" && (
        <Kcc20SellAlerts
          alerts={sellAlerts}
          onDismiss={() => sellAlerts.forEach((a) => dismissAlert(a.tick))}
          onView={(a) => setSelected(a)}
        />
      )}

      {visible.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-24">
          {view === "fav" ? "Tap the ⭐ on any token to add it to your favorites" : `No KCC20 tokens match "${filter}"`}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const usd = fmtUsd(t.price, kasPrice);
            const kronUrl = t.covenantId
              ? `https://kron.technology/token/${t.covenantId}`
              : "https://kron.technology";
            const isFav = favorites.has(t.tick);
            const isNew = view === "new" || (t.hasMarket && !t.graduated && (t.holderTotal || 0) <= 40);
            return (
              <div
                key={t.tick + (t.covenantId || "")}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                  t.featured
                    ? "bg-amber-500/[0.08] border-amber-400/50 hover:bg-amber-500/[0.12]"
                    : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-amber-500/30"
                }`}
              >
                <button
                  onClick={() => setSelected(t)}
                  className="flex-1 flex items-center gap-2 min-w-0 text-left"
                  title="Tap for 24h profit, whales & analysis"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                    {t.logo ? (
                      <img src={t.logo} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-[10px] font-mono text-white/40">{t.tick.slice(0, 3)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white text-sm font-semibold truncate">{t.tick}</span>
                      {t.featured && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase text-amber-300 bg-amber-500/20 border border-amber-400/50 rounded px-1">
                          <Star className="w-2 h-2" /> Featured
                        </span>
                      )}
                      {t.graduated && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1">
                          <Trophy className="w-2 h-2" /> Grad
                        </span>
                      )}
                      {!t.graduated && t.hasMarket && t.volume24h > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1">
                          <Flame className="w-2 h-2" /> Live
                        </span>
                      )}
                      {isNew && !t.featured && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded px-1">
                          <Sparkles className="w-2 h-2" /> Early
                        </span>
                      )}
                    </div>
                    <div className="text-white/40 text-[10px] truncate">{t.name}</div>
                  </div>
                  <div className="text-right">
                    {t.hasMarket ? (
                      <>
                        <div className="text-white text-xs font-mono">{fmtKas(t.price)}</div>
                        {usd && <div className="text-[9px] font-mono text-white/30">{usd}</div>}
                        {t.change24h !== 0 && (
                          <div className={`text-[10px] font-mono ${t.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-white/30 text-[10px] font-mono uppercase tracking-wider">Pending</div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => onToggleFav(t.tick)}
                  title={isFav ? "Remove from favorites" : "Add to favorites"}
                  className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all ${
                    isFav
                      ? "bg-amber-500/25 border-amber-400/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                      : "bg-white/[0.06] border-white/10 text-white/40 hover:text-amber-300 hover:border-amber-400/40"
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFav ? "fill-amber-300" : ""}`} />
                </button>
                <button
                  onClick={() => onAskAI && onAskAI(t)}
                  title="Ask AI to analyze this token"
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 transition-colors"
                >
                  <Bot className="w-4 h-4" />
                </button>
                <a
                  href={kronUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-white/50 hover:text-white transition-colors"
                  title="Open on kron.technology"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <Kcc20TokenDetail
          token={selected}
          kasPrice={kasPrice}
          onClose={() => setSelected(null)}
          onAskAI={(tok, ctx) => { setSelected(null); onAskAI?.(tok, ctx); }}
        />
      )}

      <p className="text-white/20 text-[9px] font-mono text-center mt-4">
        Covenant tokens on Kaspa L1 · prices in KAS via idx.kron.technology
      </p>
    </div>
  );
}