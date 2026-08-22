import React, { useState, useEffect, useMemo } from "react";
import { Loader2, ExternalLink, Trophy, Flame, Sparkles, Zap, Search } from "lucide-react";
import { loadKcc20Tokens } from "@/components/agentinternet/Kcc20TokenBrowser";

function fmtKas(n) {
  if (n == null || !isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} KAS`;
  if (n >= 1) return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS`;
  return `${n.toPrecision(3)} KAS`;
}

// One-click market launcher: lists every KCC20 token from KRON with its logo,
// name and live stats. Two tabs — Leaderboard (volume/TVL) and New (bonding
// curve, fewest holders) — mirroring how KRON surfaces tokens. Each row has a
// "Market" button that hands the token to Tree for a full ad campaign.
export default function TreeTokenBrowser({ onMarket, marketingTick }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("leaderboard"); // leaderboard | new
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadKcc20Tokens()
      .then((t) => alive && setTokens(t))
      .catch((e) => alive && setError(e?.message || "Failed to load KCC20 tokens"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => {
    const f = q.trim().toUpperCase();
    let list = tokens;
    if (f) list = list.filter((t) => t.tick.includes(f) || (t.name || "").toUpperCase().includes(f));
    if (view === "new") {
      list = [...list]
        .filter((t) => t.hasMarket && !t.graduated)
        .sort((a, b) => (a.holderTotal || 0) - (b.holderTotal || 0) || (a.tvl || 0) - (b.tvl || 0));
    } else {
      list = [...list].sort(
        (a, b) => (b.volume24h || 0) - (a.volume24h || 0) || (b.tvl || 0) - (a.tvl || 0) || a.tick.localeCompare(b.tick)
      );
    }
    return list;
  }, [tokens, view, q]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-3" />
        <span className="text-white/40 text-xs font-mono">Indexing KCC20 tokens from KRON…</span>
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

  const Seg = ({ id, label, Icon }) => (
    <button
      onClick={() => setView(id)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${
        view === id
          ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
          : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
      }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Seg id="leaderboard" label="Leaderboard" Icon={Trophy} />
          <Seg id="new" label="New" Icon={Sparkles} />
        </div>
        <a
          href="https://kron.technology"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300/70 hover:text-emerald-200"
        >
          kron <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tick or name…"
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-emerald-500/20 text-white text-xs outline-none focus:border-emerald-400/60"
        />
      </div>

      <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-2">
        {view === "new" ? "🚀 New launches · bonding curve · fewest holders first" : `🏆 Top KCC20 by volume · ${tokens.length} indexed`}
      </p>

      {visible.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-24">No tokens match "{q}"</p>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const kronUrl = t.covenantId
              ? `https://kron.technology/token/${t.covenantId}`
              : "https://kron.technology";
            const isMarketing = marketingTick === t.tick;
            return (
              <div
                key={t.tick + (t.covenantId || "")}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                  t.featured
                    ? "bg-emerald-500/[0.08] border-emerald-400/50"
                    : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-emerald-500/30"
                }`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                  {t.logo ? (
                    <img src={t.logo} alt="" className="w-9 h-9 object-contain" />
                  ) : (
                    <span className="text-[10px] font-mono text-white/40">{t.tick.slice(0, 3)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white text-sm font-semibold">{t.tick}</span>
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
                  {t.hasMarket ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/70 text-[10px] font-mono">{fmtKas(t.price)}</span>
                      {t.change24h !== 0 && (
                        <span className={`text-[10px] font-mono ${t.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                        </span>
                      )}
                      <span className="text-white/30 text-[10px] font-mono">· {t.holderTotal || 0} holders</span>
                    </div>
                  ) : (
                    <div className="text-white/30 text-[10px] font-mono uppercase tracking-wider mt-0.5">Pending</div>
                  )}
                </div>
                <button
                  onClick={() => onMarket(t)}
                  disabled={isMarketing}
                  title="One-click: scrape this token's site & launch a full ad campaign"
                  className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    isMarketing
                      ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 cursor-wait"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:opacity-90"
                  }`}
                >
                  {isMarketing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Market
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

      <p className="text-white/20 text-[9px] font-mono text-center mt-4">
        Covenant tokens on Kaspa L1 · one click scrapes the project site & launches a Tree campaign
      </p>
    </div>
  );
}