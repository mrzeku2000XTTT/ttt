import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, Coins, Users, Clock, TrendingUp } from "lucide-react";
import XAvatar from "./XAvatar";

const fmt = (n) => (typeof n === "number" && n > 0 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—");

/** One KCC-20 token row that expands into a full widget box. */
export default function KccTokenCard({ token: t, rank, expanded, onToggle }) {
  const pct = Math.max(0, Math.min(100, Math.round(t.graduation_pct || 0)));

  return (
    <motion.div
      layout
      onClick={onToggle}
      className={`cursor-pointer rounded-2xl border transition-colors ${
        expanded ? "border-cyan-400/40 bg-cyan-500/[0.06]" : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`w-5 text-center font-mono text-xs ${rank === 1 ? "text-amber-300" : rank <= 3 ? "text-white/70" : "text-white/30"}`}>{rank}</span>
        <XAvatar url={t.x_url} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[10px] font-mono">${t.ticker}</span>
            <span className="text-white text-[13px] font-medium truncate">{t.name}</span>
          </div>
          {t.x_handle && <span className="text-cyan-400/60 text-[11px] font-mono">@{t.x_handle}</span>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white text-[13px] font-semibold tabular-nums">{fmt(t.market_cap_kas)} <span className="text-white/40 text-[10px]">KAS</span></p>
          <p className="text-emerald-300/80 text-[10px]">{pct}% graduated</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4">
          <div className="rounded-xl bg-black/40 border border-white/[0.07] p-4">
            {t.description && <p className="text-white/65 text-[12px] leading-relaxed mb-3">{t.description}</p>}

            <div className="h-1.5 w-full rounded-full bg-white/10 mb-3">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${pct}%` }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <Stat icon={<Coins className="w-3 h-3" />} label="Price KAS" value={fmt(t.price_kas)} />
              <Stat icon={<TrendingUp className="w-3 h-3" />} label="Vol 24h" value={fmt(t.volume_24h_kas)} />
              <Stat icon={<Users className="w-3 h-3" />} label="Holders" value={fmt(t.holders)} />
              <Stat icon={<Clock className="w-3 h-3" />} label="Age (h)" value={fmt(t.age_hours)} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {t.x_url && <Pill href={t.x_url} label={`@${t.x_handle || "profile"}`} />}
              {t.kron_url && <Pill href={t.kron_url} label="KRON" />}
              {t.kascov_url && <Pill href={t.kascov_url} label="kascov" />}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const Stat = ({ icon, label, value }) => (
  <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] p-2">
    <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-white/35 mb-0.5">{icon}{label}</div>
    <div className="text-white text-[12px] font-semibold tabular-nums truncate">{value}</div>
  </div>
);

const Pill = ({ href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/60 hover:text-cyan-300 hover:border-cyan-400/40 text-[11px] transition-colors"
  >
    {label} <ExternalLink className="w-3 h-3" />
  </a>
);