import React from "react";
import { Activity, AlertTriangle } from "lucide-react";

const STATS = {
  totalKasLocked: 1_250_000,
  totalKusdMinted: 70_800,
  activeVaults: 342,
};

const LIQUIDATION_QUEUE = [
  { vault: "vault-0x8f2a", kas: 12_400, kusd: 902, ratio: 116.8, timeLeft: "2h 14m" },
  { vault: "vault-0x3c91", kas: 5_200, kusd: 391, ratio: 113.0, timeLeft: "44m" },
  { vault: "vault-0xb7e4", kas: 28_900, kusd: 2_071, ratio: 118.6, timeLeft: "5h 02m" },
];

export default function VaultHealthDashboard() {
  const globalRatio = ((STATS.totalKasLocked * 0.085) / STATS.totalKusdMinted) * 100;
  const ratioColor = globalRatio > 200 ? "text-green-400" : globalRatio >= 150 ? "text-yellow-400" : "text-red-400";
  const barColor = globalRatio > 200 ? "bg-green-500" : globalRatio >= 150 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-400" /> Vault Health Dashboard
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-black/40 rounded-2xl p-4">
          <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-1">TOTAL KAS LOCKED</div>
          <div className="text-white font-bold text-lg font-mono">{STATS.totalKasLocked.toLocaleString()}</div>
        </div>
        <div className="bg-black/40 rounded-2xl p-4">
          <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-1">TOTAL kUSD MINTED</div>
          <div className="text-white font-bold text-lg font-mono">{STATS.totalKusdMinted.toLocaleString()}</div>
        </div>
        <div className="bg-black/40 rounded-2xl p-4">
          <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-1">COLLATERAL RATIO</div>
          <div className={`font-bold text-lg font-mono ${ratioColor}`}>{globalRatio.toFixed(1)}%</div>
        </div>
        <div className="bg-black/40 rounded-2xl p-4">
          <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-1">ACTIVE VAULTS</div>
          <div className="text-white font-bold text-lg font-mono">{STATS.activeVaults}</div>
        </div>
      </div>

      {/* Global collateralization progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span>Global Collateralization</span>
          <span className={ratioColor}>{globalRatio.toFixed(1)}% / 300%</span>
        </div>
        <div className="h-3 bg-black/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min((globalRatio / 300) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Liquidation queue */}
      <div>
        <h3 className="text-sm text-white font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Liquidation Queue <span className="text-zinc-500 font-normal">(below 120%)</span>
        </h3>
        <div className="space-y-2">
          {LIQUIDATION_QUEUE.map((v) => (
            <div key={v.vault} className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-2xl px-4 py-3">
              <div>
                <div className="text-white font-mono text-sm">{v.vault}</div>
                <div className="text-xs text-zinc-500">{v.kas.toLocaleString()} KAS · {v.kusd.toLocaleString()} kUSD</div>
              </div>
              <div className="text-right">
                <div className="text-red-400 font-bold font-mono text-sm">{v.ratio}%</div>
                <div className="text-xs text-zinc-500">liquidates in {v.timeLeft}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}