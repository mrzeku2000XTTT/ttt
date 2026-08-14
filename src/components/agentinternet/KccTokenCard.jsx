import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, Lock, ShieldCheck, Globe, Send } from "lucide-react";

const fmt = (n) => {
  const v = typeof n === "string" ? Number(n) : n;
  return typeof v === "number" && !Number.isNaN(v) ? v.toLocaleString() : "—";
};

/** One real KRON KCC-20 token from the live launch registry. Expands into a widget box. */
export default function KccTokenCard({ token: t, rank, expanded, onToggle }) {
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
          {t.x_handle && <span className="text-cyan-400/60 text-[11px] font-mono">@{t.x_handle}</span>}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <Stat label="Max supply" value={fmt(t.max_supply)} />
              <Stat label="Graduation" value={fmt(t.graduation_supply)} />
              <Stat label="Decimals" value={t.decimals ?? "—"} />
              <Stat label="Dev holding" value={t.dev_holding_pct != null ? `${t.dev_holding_pct}%` : "—"} />
            </div>

            {t.creator && (
              <p className="text-white/30 text-[10px] font-mono break-all mb-3">creator {t.creator}</p>
            )}

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