import React from "react";
import { motion } from "framer-motion";

export default function ImposterRenderLoader({ status, progress, elapsed }) {
  const isError = status === "error";
  const mins = Math.floor((elapsed || 0) / 60);
  const secs = (elapsed || 0) % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, "0")}`;

  const statusLabel = {
    queued: "Queued",
    rendering: "Rendering",
    error: "Failed",
  }[status] || "Working";

  const statusColor = isError
    ? { bg: "rgba(255,50,50,0.08)", border: "rgba(255,50,50,0.3)", text: "rgba(255,120,120,1)", dot: "#ef4444" }
    : { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.3)", text: "rgba(6,182,212,1)", dot: "#06b6d4" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[90%] rounded-2xl overflow-hidden"
      style={{ background: statusColor.bg, border: `1px solid ${statusColor.border}` }}
    >
      {/* Header with status + timer */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {!isError && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: statusColor.dot }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: statusColor.dot }} />
            </span>
          )}
          {isError && <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusColor.dot }} />}
          <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: statusColor.text }}>
            {statusLabel}
          </span>
        </div>
        {!isError && (
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
            {timeStr}
          </span>
        )}
      </div>

      {/* Animated bars while rendering */}
      {!isError && (
        <div className="px-3.5 pb-2 flex items-end gap-[3px] h-[18px]">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-sm"
              style={{ background: `linear-gradient(to top, ${statusColor.dot}, rgba(255,255,255,0.3))` }}
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {/* Progress text from Kai */}
      {progress && (
        <div className="px-3.5 pb-3 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          {progress}
        </div>
      )}
    </motion.div>
  );
}