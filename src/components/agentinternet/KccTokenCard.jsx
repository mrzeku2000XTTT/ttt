import React from "react";
import { motion } from "framer-motion";
import {
  ExternalLink, ChevronDown, Lock, ShieldCheck, Globe, Send,
  Flame, Activity, Clock, ArrowUpRight,
} from "lucide-react";

const fmt = (n) => {
  const v = typeof n === "string" ? Number(n) : n;
  return typeof v === "number" && !Number.isNaN(v) ? v.toLocaleString() : "—";
};

const timeAgo = (iso) => {
  if (!iso) return "—";
  const d = typeof iso === "number" ? new Date(iso) : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const SENTIMENT = {
  hot: { label: "Hot", icon: Flame, cls: "bg-red-500/15 border-red-400/40 text-red-300" },
  active: { label: "Active", icon: Activity, cls: "bg-amber-500/15 border-amber-400/40 text-amber-300" },
  quiet: { label: "Quiet", icon: Activity, cls: "bg-white/[0.05] border-white/10 text-white/40" },
};

/** One real KRON KCC-20 token from the live launch registry. Expands into a widget box. */
export default function KccTokenCard({ token: t, rank, expanded, onToggle, onTrade }) {
  const sent = SENTIMENT[t.sentiment] || SENTIMENT.quiet;
  const SentIcon = sent.icon;

  return (
    <motion.div
      layout
      onClick={onToggle}
      className={`cursor-pointer rounded-2xl border transition-colors ${
        expanded ? "border-cyan-400/40 bg-cyan-500/[0.06]" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="w-5 text-center font-mono text-xs text-white/30">{rank}</span>
        {t.image ? (
          <img src={t.image} alt={t.tick} className="w-9 h-9 rounded-full object-cover bg-white/10 flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/50 flex-shrink-0">
            {t.tick?.slice(0, 3)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[10px] font-mono">${t.tick}</span>
            <span className="text-white text-[13px] font-medium truncate">{t.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {t.x_handle && <span className="text-cyan-400/60 text-[11px] font-mono">@{t.x_handle}</span>}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${sent.cls}`}>
              <SentIcon className="w-2.5 h-2.5" />{sent.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {t.liquidity_locked && <Lock className="w-3.5 h-3.5 text-emerald-400/80" title="Liquidity locked" />}
          {t.mint_renounced && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" title="Mint renounced" />}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4">
          <div className="rounded-xl bg-black/40 border border-white/[0.07] p-4">
            {t.description && <p className="text-white/65 text-[12px] leading-relaxed mb-3">{t.description}</p>}

            {/* Dev holdings — real, from KRON */}
            <div className="rounded-lg bg-cyan-500/[0.06] border border-cyan-400/20 p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] uppercase tracking-widest text-cyan-300/70">Dev holdings</span>
                <span className="text-[9px] text-white/30 font-mono flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> updated {timeAgo(t.image_updated_at || t.created_at)}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-white text-[15px] font-bold tabular-nums">
                    {t.dev_holding_pct != null ? `${t.dev_holding_pct}%` : "—"}
                  </div>
                  <div className="text-[9px] text-white/40">of max supply</div>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <div className="text-white text-[13px] font-semibold tabular-nums">{fmt(t.dev_amount)}</div>
                  <div className="text-[9px] text-white/40">${t.tick} tokens</div>
                </div>
              </div>
            </div>

            {/* Activity / sentiment — real, from Kascov live feed */}
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.07] p-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-white/40">Market activity</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${sent.cls}`}>
                  <SentIcon className="w-2.5 h-2.5" />{sent.label}
                </span>
              </div>
              <div className="flex items-end gap-3 mt-1.5">
                <div>
                  <div className="text-white text-[13px] font-semibold tabular-nums">{t.recent_buys ?? 0}</div>
                  <div className="text-[9px] text-white/40">recent trades (Kascov live)</div>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <div className="text-white text-[13px] font-semibold tabular-nums">
                    {t.progress_pct != null ? `${t.progress_pct}%` : "—"}
                  </div>
                  <div className="text-[9px] text-white/40">curve progress</div>
                </div>
              </div>
              <p className="text-[9px] text-white/30 mt-1.5 leading-relaxed">
                Per-token holder count is not published by the KRON or Kascov public APIs.
                Trade count reflects real on-chain covenant transitions over Kascov's live window.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <Stat label="Max supply" value={fmt(t.max_supply)} />
              <Stat label="Curve supply" value={fmt(t.supply)} />
              <Stat label="Graduation" value={fmt(t.graduation_supply)} />
              <Stat label="Decimals" value={t.decimals ?? "—"} />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono mb-3">
              <Clock className="w-3 h-3" />
              launched {timeAgo(t.created_at)}
              {t.graduated && <span className="text-emerald-400/80"> · graduated</span>}
            </div>

            {t.creator && (
              <p className="text-white/30 text-[10px] font-mono break-all mb-3">creator {t.creator}</p>
            )}

            {/* Trade button — opens the honest trade panel */}
            <button
              onClick={(e) => { e.stopPropagation(); onTrade?.(t); }}
              className="w-full mb-3 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-400/40 text-cyan-100 text-[12px] font-semibold hover:from-cyan-500/30 hover:to-fuchsia-500/30 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Trade ${t.tick}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {t.x_url && <Pill href={t.x_url} label={`@${t.x_handle || "X"}`} />}
              {t.website && <Pill href={t.website} label="Website" icon={<Globe className="w-3 h-3" />} />}
              {t.telegram && <Pill href={t.telegram} label="Telegram" icon={<Send className="w-3 h-3" />} />}
              <Pill href={t.kron_url} label="KRON" />
              <Pill href={t.kascov_url} label="kascov" />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const Stat = ({ label, value }) => (
  <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] p-2">
    <div className="text-[9px] uppercase tracking-widest text-white/35 mb-0.5">{label}</div>
    <div className="text-white text-[12px] font-semibold tabular-nums truncate">{value}</div>
  </div>
);

const Pill = ({ href, label, icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/60 hover:text-cyan-300 hover:border-cyan-400/40 text-[11px] transition-colors"
  >
    {icon}{label} <ExternalLink className="w-3 h-3" />
  </a>
);