import React from "react";

const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "rgba(148,163,184,0.3)" },
  rendering: { label: "⏳ Rendering", bg: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "rgba(234,179,8,0.35)" },
  done: { label: "✅ Done", bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.35)" },
  error: { label: "❌ Error", bg: "rgba(239,68,68,0.15)", color: "#f87171", border: "rgba(239,68,68,0.35)" },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}