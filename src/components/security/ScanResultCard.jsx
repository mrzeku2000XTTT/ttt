import React, { useState } from "react";
import { ChevronDown, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import SeverityBadge from "./SeverityBadge";

const statusIcons = {
  pass: { icon: CheckCircle, color: "text-emerald-400" },
  warn: { icon: AlertTriangle, color: "text-yellow-400" },
  fail: { icon: XCircle, color: "text-red-400" },
  info: { icon: Info, color: "text-blue-400" },
};

export default function ScanResultCard({ label, icon: Icon, status, severity, findings, missingHeaders }) {
  const [expanded, setExpanded] = useState(status === "fail" || status === "warn");
  const StatusIcon = statusIcons[status]?.icon || Info;
  const statusColor = statusIcons[status]?.color || "text-white/40";

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
        <span className="text-white/80 text-sm font-medium flex-1 text-left">{label}</span>
        <SeverityBadge severity={severity} />
        <StatusIcon className={`w-4 h-4 ${statusColor} flex-shrink-0`} />
        <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-0 space-y-2 border-t border-white/[0.04]">
          {findings?.length > 0 && (
            <ul className="space-y-1.5 pt-2">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-white/50 text-xs leading-relaxed">
                  <span className="text-white/15 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {missingHeaders?.length > 0 && (
            <div className="pt-1">
              <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">Missing Headers</p>
              <div className="flex flex-wrap gap-1">
                {missingHeaders.map((h, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/15 rounded text-red-400/70 text-[10px] font-mono">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(!findings || findings.length === 0) && (!missingHeaders || missingHeaders.length === 0) && (
            <p className="text-white/20 text-xs pt-2">No specific findings.</p>
          )}
        </div>
      )}
    </div>
  );
}