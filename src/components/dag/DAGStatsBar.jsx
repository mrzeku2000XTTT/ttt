import React from "react";
import { Cpu, CircleDollarSign, Users, Pickaxe, Coins, Timer } from "lucide-react";

export default function DAGStatsBar({ stats, isLive }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-black/80 border-b border-teal-500/20 backdrop-blur-sm overflow-x-auto scrollbar-hide">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${isLive ? "bg-teal-400 animate-pulse" : "bg-red-400"}`} />
        <span className="text-teal-400 font-mono text-xs font-bold">{isLive ? "LIVE" : "..."}</span>
      </div>

      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      <StatItem icon={<Cpu className="w-3 h-3" />} label="Hashrate" value={stats.hashrate ? formatHashrate(stats.hashrate) : "—"} color="teal" />
      <StatItem icon={<Users className="w-3 h-3" />} label="Nodes" value={stats.nodes ?? "—"} color="teal" />
      <StatItem icon={<Pickaxe className="w-3 h-3" />} label="Miners" value={stats.miners ?? "—"} color="teal" />
      <StatItem icon={<Coins className="w-3 h-3" />} label="Circulating" value={stats.circulating ? formatCirculating(stats.circulating) : "—"} color="teal" />
      <StatItem icon={<CircleDollarSign className="w-3 h-3" />} label="Block Reward" value={stats.blockReward ? `ꓘ ${stats.blockReward.toFixed(2)}` : "—"} color="teal" />
      <StatItem icon={<Timer className="w-3 h-3" />} label="Next Halving" value={stats.nextHalving ?? "—"} color="teal" />
      <StatItem label="KAS" value={stats.price ? `$${stats.price.toFixed(4)}` : "—"} color="green" />
    </div>
  );
}

function StatItem({ icon, label, value, color }) {
  const colorMap = {
    teal: "text-teal-400",
    green: "text-green-400",
  };
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {icon && <span className={colorMap[color]}>{icon}</span>}
      <div>
        <div className="text-white/30 font-mono text-[9px] leading-none">{label}</div>
        <div className={`font-mono text-xs font-bold leading-none mt-0.5 ${colorMap[color]}`}>{value}</div>
      </div>
    </div>
  );
}

// PH/s style - API returns TH/s values, so thresholds are adjusted
function formatHashrate(h) {
  if (h >= 1e6) return (h / 1e6).toFixed(2) + " EH/s";
  if (h >= 1e3) return (h / 1e3).toFixed(2) + " PH/s";
  if (h >= 1) return h.toFixed(2) + " TH/s";
  if (h >= 1e-3) return (h * 1e3).toFixed(2) + " GH/s";
  return (h * 1e6).toFixed(2) + " MH/s";
}

// e.g. 27.29B
function formatCirculating(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return String(n);
}