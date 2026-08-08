import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Loader2, RefreshCw, ArrowUpRight, Coins, Users, Clock, Activity, Sparkles, AlertCircle,
} from "lucide-react";

// Editorial Light palette — matches Idea Lab
const WHITE = "#ffffff";
const INK = "#000000";
const INK_SOFT = "#1a1a1a";
const GREY = "#6b6b6b";
const GREY_LIGHT = "#a8a8a8";
const LINE = "#e5e5e5";
const SERIF = "'Fraunces', Georgia, serif";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "—");

/**
 * KronTokensPanel — indexes KRON.technology KCC-20 covenant tokens that are
 * still graduating (on the bonding curve, not yet migrated to the locked AMM),
 * cross-referenced on kascov.io (the KCC covenant explorer). Data is sourced
 * live via Gemini web search (kron.technology, kascov.io, kaspa.news, X,
 * explorers) — KRON has no documented public API. Each token card can launch a
 * "proof-of-work utility app" idea into Idea Lab.
 */
export default function KronTokensPanel({ onGenerateIdea }) {
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fast, setFast] = useState(false);

  const schema = {
    type: "object",
    properties: {
      tokens: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ticker: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            market_cap_kas: { type: "number" },
            graduation_pct: { type: "number" },
            holders: { type: "number" },
            age_hours: { type: "number" },
            kron_url: { type: "string" },
            kascov_url: { type: "string" },
            potential_utility: { type: "string" },
          },
        },
      },
    },
  };

  const loadTokens = async () => {
    setLoading(true);
    setError(false);
    setTokens(null);
    setFast(false);

    // Live web scan (kron.technology + kascov.io) — can take 40-60s, so we race
    // it against a 28s cap and fall back to a fast model-knowledge call that has
    // been running in parallel since t=0. Total time is therefore ≤ ~28s.
    const webPrompt =
      `Search the live web (kron.technology, kascov.io, kaspa.news, X.com) for REAL Kaspa KCC-20 covenant tokens on KRON's bonding curve still graduating (not yet at the locked AMM). KCC-20 = Kaspa Covenant Contract standard (SilverScript), NOT KRC-20. kascov.io is the KCC explorer — include its covenant page URL per token. Return: ticker, name, description, market_cap_kas, graduation_pct, holders, age_hours, kron_url, kascov_url, potential_utility. Only real tokens with web evidence. Sort by graduation_pct desc.`;

    const fastPrompt =
      `List up to 4 Kaspa KCC-20 covenant tokens that have been launched on KRON (kron.technology) bonding curves. KCC-20 = Kaspa Covenant Contract token standard (SilverScript), NOT KRC-20. Return your best knowledge of: ticker, name, description, market_cap_kas, graduation_pct, holders, age_hours, kron_url, kascov_url, potential_utility. Sort by graduation_pct desc. Data may be approximate.`;

    const fastPromise = base44.integrations.Core.InvokeLLM({
      prompt: fastPrompt, model: "gemini_3_flash", response_json_schema: schema,
    }).catch(() => null);

    const webPromise = base44.integrations.Core.InvokeLLM({
      prompt: webPrompt, add_context_from_internet: true, model: "gemini_3_flash", response_json_schema: schema,
    }).catch(() => null);

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve("__timeout__"), 28000));

    try {
      const winner = await Promise.race([webPromise, timeoutPromise]);
      if (winner && winner !== "__timeout__" && Array.isArray(winner.tokens) && winner.tokens.length) {
        setTokens(winner.tokens);
      } else {
        // Live scan timed out (or empty) — use the parallel fast result.
        const fastRes = await fastPromise;
        if (fastRes && Array.isArray(fastRes.tokens) && fastRes.tokens.length) {
          setTokens(fastRes.tokens);
          setFast(true);
        } else {
          setError(true);
        }
      }
    } catch {
      const fastRes = await fastPromise;
      if (fastRes && Array.isArray(fastRes.tokens) && fastRes.tokens.length) {
        setTokens(fastRes.tokens);
        setFast(true);
      } else {
        setError(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const genIdea = (t) => {
    const prompt =
      `Build a proof-of-work app on Kaspa that gives real utility and sustainable value to the KCC-20 covenant token "${t.ticker}" (${t.name}). ` +
      `Token context: ${t.description || ""} Currently on KRON's bonding curve — market cap ~${fmt(t.market_cap_kas)} KAS, graduation ${t.graduation_pct ?? "?"}%, ${fmt(t.holders)} holders, ~${Math.round(t.age_hours || 0)}h old. ` +
      `Design an app where users perform real Proof-of-Work / on-chain activity to earn, burn, or stake this covenant token, creating genuine demand and utility beyond speculation.`;
    onGenerateIdea?.(prompt);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-2">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>KCC-20 · KRON · kascov.io</p>
          <h1 className="text-[clamp(1.7rem,5vw,2.4rem)] font-bold leading-[1.05] mt-1" style={{ color: INK, fontFamily: SERIF }}>
            Graduating Tokens
          </h1>
        </div>
        <button
          onClick={loadTokens}
          disabled={loading}
          className="flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-semibold transition-opacity hover:opacity-60 disabled:opacity-50"
          style={{ color: WHITE, background: INK, fontFamily: SERIF }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>
      <p className="text-[13px] leading-relaxed mb-6 max-w-md" style={{ color: GREY, fontFamily: SERIF }}>
        Live KCC-20 covenant tokens still on KRON's bonding curve, sourced from kron.technology & cross-referenced on kascov.io. Tap any token to generate a proof-of-work utility app idea for it.
      </p>

      {fast && !loading && tokens && (
        <p className="text-[12px] mb-4 italic" style={{ color: GREY, fontFamily: SERIF }}>
          Live scan timed out — showing model-knowledge tokens. Tap Refresh to retry the live scan.
        </p>
      )}

      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" style={{ color: INK }} />
          <p className="text-[14px]" style={{ color: INK_SOFT, fontFamily: SERIF }}>Scanning kron.technology & kascov.io for graduating KCC-20 covenants…</p>
        </div>
      )}

      {error && !loading && (
        <div className="py-12 text-center">
          <AlertCircle className="w-5 h-5 mx-auto mb-3" style={{ color: INK }} />
          <p className="text-[14px] mb-3" style={{ color: GREY, fontFamily: SERIF }}>Couldn't fetch live tokens right now.</p>
          <button onClick={loadTokens} className="text-[13px] font-semibold underline underline-offset-2" style={{ color: INK, fontFamily: SERIF }}>Try again</button>
        </div>
      )}

      {!loading && !error && tokens && tokens.length === 0 && (
        <div className="py-12 text-center">
          <Coins className="w-5 h-5 mx-auto mb-3" style={{ color: INK }} />
          <p className="text-[14px]" style={{ color: GREY, fontFamily: SERIF }}>No graduating tokens surfaced from the live web. Try refreshing.</p>
        </div>
      )}

      {!loading && !error && tokens && tokens.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tokens.map((t, i) => {
            const pct = Math.max(0, Math.min(100, Math.round(t.graduation_pct || 0)));
            return (
              <motion.div
                key={t.ticker + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg p-5 flex flex-col"
                style={{ background: WHITE, border: `1px solid ${INK}` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: INK, color: WHITE }}>${t.ticker}</span>
                      <span className="text-[15px] font-bold truncate" style={{ color: INK, fontFamily: SERIF }}>{t.name}</span>
                    </div>
                    <p className="text-[13px] mt-1.5 leading-snug" style={{ color: GREY, fontFamily: SERIF }}>{t.description || "—"}</p>
                  </div>
                </div>

                {/* graduation progress */}
                <div className="mt-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>Graduation</span>
                    <span className="text-[12px] font-semibold tabular-nums" style={{ color: INK, fontFamily: SERIF }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: LINE }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: INK }} />
                  </div>
                </div>

                {/* stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Stat icon={<Coins className="w-3 h-3" />} label="Mcap KAS" value={fmt(t.market_cap_kas)} />
                  <Stat icon={<Users className="w-3 h-3" />} label="Holders" value={fmt(t.holders)} />
                  <Stat icon={<Clock className="w-3 h-3" />} label="Age (h)" value={fmt(t.age_hours)} />
                </div>

                {t.potential_utility && (
                  <div className="mb-4 p-3 rounded" style={{ background: "rgba(0,0,0,0.03)", border: `1px solid ${LINE}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 flex items-center gap-1" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>
                      <Sparkles className="w-3 h-3" /> Utility angle
                    </p>
                    <p className="text-[13px] leading-snug" style={{ color: INK_SOFT, fontFamily: SERIF }}>{t.potential_utility}</p>
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => genIdea(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-[12px] font-semibold transition-opacity hover:opacity-60"
                    style={{ color: WHITE, background: INK, fontFamily: SERIF }}
                  >
                    <Activity className="w-3.5 h-3.5" /> Generate PoW app idea
                  </button>
                  {t.kron_url && (
                    <a
                      href={t.kron_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on KRON"
                      className="flex items-center justify-center h-10 px-3 rounded-full flex-shrink-0 text-[11px] font-semibold transition-opacity hover:opacity-60"
                      style={{ color: INK, border: `1px solid ${INK}`, fontFamily: SERIF }}
                    >
                      KRON <ArrowUpRight className="w-3 h-3 ml-1" />
                    </a>
                  )}
                  {t.kascov_url && (
                    <a
                      href={t.kascov_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on kascov.io"
                      className="flex items-center justify-center h-10 px-3 rounded-full flex-shrink-0 text-[11px] font-semibold transition-opacity hover:opacity-60"
                      style={{ color: INK, border: `1px solid ${INK}`, fontFamily: SERIF }}
                    >
                      kascov <ArrowUpRight className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] mt-6 leading-relaxed" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>
        AI-sourced from the live web — may be delayed or incomplete. Not financial advice.
      </p>
    </div>
  );
}

const Stat = ({ icon, label, value }) => (
  <div className="rounded p-2" style={{ background: "rgba(0,0,0,0.03)", border: `1px solid ${LINE}` }}>
    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] mb-0.5" style={{ color: GREY_LIGHT, fontFamily: SERIF }}>
      {icon}{label}
    </div>
    <div className="text-[13px] font-semibold tabular-nums truncate" style={{ color: INK, fontFamily: SERIF }}>{value}</div>
  </div>
);