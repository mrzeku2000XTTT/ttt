import React from "react";

const config = {
  critical: { bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-400", label: "CRITICAL" },
  high: { bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-400", label: "HIGH RISK" },
  medium: { bg: "bg-yellow-500/15", border: "border-yellow-500/30", text: "text-yellow-400", label: "MEDIUM RISK" },
  low: { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400", label: "LOW RISK" },
  minimal: { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", label: "MINIMAL RISK" },
  info: { bg: "bg-white/5", border: "border-white/10", text: "text-white/50", label: "INFO" },
};

export default function SeverityBadge({ severity }) {
  const c = config[severity] || config.info;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.border} ${c.text} border`}>
      {c.label}
    </span>
  );
}