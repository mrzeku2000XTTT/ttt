import React from "react";
import { Activity, Cpu, DollarSign, Layers, Zap } from "lucide-react";

export default function DAGStatsBar({ stats, isLive }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-black/80 border-b border-teal-500/20 backdrop-blur-sm overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${isLive ? "bg-teal-400 animate-pulse" : "bg-red-400"}`} />
        <span className="text-teal-400 font-mono text-xs font-bold">{isLive ? "LIVE" : "CONNECTING..."}</span>
      </div>

      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      <StatItem icon={<Zap className="w-3 h-3" />} label="BPS" value={stats.networkTps != null ? `${stats.networkTps}` : "—"} color="teal" />
      <StatItem icon={<Activity className="w-3 h-3" />} label="OBS TPS" value={stats.tps ?? "—"} color="teal" />
      <StatItem icon={<Layers className="w-3 h-3" />} label="BLOCKS" value={stats.blockCount ? formatBig(stats.blockCount) : "—"} color="white" />
      <StatItem icon={<Cpu className="w-3 h-3" />} label="HASHRATE" value={stats.hashrate ? formatHashrate(stats.hashrate) : "—"} color="purple" />
      <StatItem icon={<DollarSign className="w-3 h-3" />} label="KAS" value={stats.price ? `$${stats.price.toFixed(4)}` : "—"} color="green" />
      <StatItem label="BLUE SCORE" value={stats.blueScore ? formatBig(stats.blueScore) : "—"} color="yellow" />
      <StatItem label="MEMPOOL" value={stats.mempoolSize ?? "—"} color="orange" />
    </div>
  );
}

function StatItem({ icon, label, value, color }) {
  const colorMap = {
    teal: "text-teal-400",
    white: "text-white",
    purple: "text-purple-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
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

function formatBig(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function formatHashrate(h) {
  if (h >= 1e18) return (h / 1e18).toFixed(2) + " EH/s";
  if (h >= 1e15) return (h / 1e15).toFixed(2) + " PH/s";
  if (h >= 1e12) return (h / 1e12).toFixed(2) + " TH/s";
  return h + " H/s";
}