import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ExternalLink, Trophy, Flame, Bot, Star } from "lucide-react";
import Kcc20TokenDetail from "./Kcc20TokenDetail";

// Real KRON endpoints (same ones the KCC20-wallet repo calls)
const REG = "https://api.kron.technology";
const IDX = "https://idx.kron.technology/v1/kcc20";

const KAS_LOGO =
  "https://assets.coingecko.com/coins/images/28298/large/kaspa.png";

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body?.result ?? body;
}

// Merge live indexer markets + registry tokenlist into one list.
// The /markets endpoint is the real "live oracle" — every token there has a
// live KAS price. Registry-only tokens are not trading yet (no market), so we
// show them as "Pending" rather than a misleading "0".
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

  const seen = new Set();
  const tokens = [];

  // 1) Live-market tokens (real oracle prices) — includes tokens that may not
  //    be in the registry yet.
  for (const m of (Array.isArray(mkts) ? mkts : [])) {
    const tick = String(m.tick || "").toUpperCase();
    if (!tick || seen.has(tick)) continue;
    seen.add(tick);
    const e = regByTick.get(tick) || {};
    tokens.push({
      tick,
      name: m.name || e.name || tick,
      decimals: Number(e.decimals ?? m.dec ?? 0),
      logo: e.logoURI || "",
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

  // 2) Registry tokens not yet on the market (pending / no oracle yet).
  for (const e of (listRes?.tokens || [])) {
    const tick = String(e.symbol || "").toUpperCase();
    if (!tick || seen.has(tick)) continue;
    seen.add(tick);
    tokens.push({
      tick,
      name: e.name || tick,
      decimals: Number(e.decimals || 0),
      logo: e.logoURI || "",
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

export default function Kcc20TokenBrowser({ filter, kasPrice, onAskAI }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

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

  const filtered = useMemo(() => {
    const f = (filter || "").trim().toUpperCase();
    if (!f) return tokens;
    return tokens.filter((t) => t.tick.includes(f) || (t.name || "").toUpperCase().includes(f));
  }, [tokens, filter]);

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

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
          KCC20 on KRON · {tokens.length} tokens · {graduatedCount} graduated
        </p>
        <a
          href="https://kron.technology"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-amber-300/70 hover:text-amber-200"
        >
          kron.technology <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-24">No KCC20 tokens match "{filter}"</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const usd = fmtUsd(t.price, kasPrice);
            const kronUrl = t.covenantId
              ? `https://kron.technology/#/token/${t.covenantId}`
              : "https://kron.technology";
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
                    <div className="flex items-center gap-1.5">
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