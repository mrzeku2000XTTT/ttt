import React from "react";

const F = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

export default function DexHeader({ stats }) {
  const up = (stats?.changePct ?? 0) >= 0;
  const fmt = (n) => n == null ? "—" : "$" + Number(n).toLocaleString();
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 border-b border-white/[0.06]" style={{ fontFamily: F }}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">KAS / USDC</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-500/15 text-cyan-400">SPOT · REAL DATA</span>
        </div>
        <span className="text-[10px] text-white/30">Settles KAS ↔ iKAS via desk AMM</span>
      </div>
      <Stat label="Price" value={stats?.price != null ? `$${stats.price.toFixed(6)}` : "—"} valueClass="text-white" />
      <Stat label="24h Change" valueClass={up ? "text-emerald-400" : "text-red-400"}
        value={stats?.changePct != null ? `${up ? "+" : ""}${stats.changePct.toFixed(2)}%` : "—"} />
      <Stat label="24h Volume" value={fmt(stats?.volume)} valueClass="text-white" />
      <Stat label="Market Cap" value={fmt(stats?.mcap)} valueClass="text-white" />
    </div>
  );
}

function Stat({ label, value, valueClass }) {
  return (
    <div>
      <div className={`font-semibold text-sm ${valueClass}`}>{value}</div>
      <div className="text-[10px] text-white/30">{label}</div>
    </div>
  );
}