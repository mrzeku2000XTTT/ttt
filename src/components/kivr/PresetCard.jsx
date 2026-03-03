import React from "react";
import { motion } from "framer-motion";
import { Phone, Trash2, CheckCircle, Clock } from "lucide-react";

const ORANGE = "#ff5a14";

const statusColors = {
  active: { bg: "rgba(52,199,89,0.1)", border: "rgba(52,199,89,0.25)", text: "#34c759" },
  used: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.35)" },
  expired: { bg: "rgba(255,59,48,0.08)", border: "rgba(255,59,48,0.2)", text: "#ff3b30" },
  cancelled: { bg: "rgba(255,59,48,0.08)", border: "rgba(255,59,48,0.2)", text: "#ff3b30" },
};

export default function PresetCard({ preset, index, onDelete }) {
  const s = statusColors[preset.status] || statusColors.active;
  const shortTo = preset.to_address
    ? `${preset.to_address.slice(0, 10)}...${preset.to_address.slice(-6)}`
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Slot badge */}
      {preset.slot_number && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,90,20,0.15)", border: "1px solid rgba(255,90,20,0.3)" }}>
          <span className="text-xs font-black" style={{ color: ORANGE }}>
            {preset.slot_number}
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,90,20,0.1)", border: "1px solid rgba(255,90,20,0.2)" }}>
          <Phone size={16} color={ORANGE} />
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm truncate">{preset.label || "Payment Preset"}</span>
          </div>
          <div className="text-lg font-black mb-1" style={{ color: ORANGE }}>
            {preset.amount?.toLocaleString("en-US", { maximumFractionDigits: 4 })} KAS
          </div>
          <div className="text-xs font-mono mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            → {shortTo}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
              {preset.status}
            </span>
            {preset.phone_number && (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                📞 {preset.phone_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete */}
      {onDelete && preset.status === "active" && (
        <button
          onClick={() => onDelete(preset.id)}
          className="absolute bottom-3 right-3 p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.2)" }}
          onMouseEnter={e => e.currentTarget.style.color = "#ff3b30"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
        >
          <Trash2 size={13} />
        </button>
      )}
    </motion.div>
  );
}