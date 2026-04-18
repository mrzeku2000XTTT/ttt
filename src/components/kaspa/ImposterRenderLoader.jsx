import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ImposterRenderLoader({ status, progress, elapsed, startedAt }) {
  const isError = status === "error";
  const isSlow = status === "slow";

  // Live-tick elapsed every second from startedAt (fallback to prop)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (isError) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isError]);

  const computedElapsed = startedAt
    ? Math.floor((Date.now() - startedAt) / 1000)
    : (elapsed || 0);
  const safeElapsed = Math.max(0, computedElapsed);
  const mins = Math.floor(safeElapsed / 60);
  const secs = safeElapsed % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, "0")}`;
  // reference tick so React re-renders each second
  void tick;

  const statusLabel = {
    queued: "Queued",
    rendering: "Rendering",
    slow: "Still cooking",
    error: "Failed",
  }[status] || "Working";

  const statusColor = isError
    ? { bg: "rgba(255,50,50,0.08)", border: "rgba(255,50,50,0.3)", text: "rgba(255,120,120,1)", dot: "#ef4444" }
    : isSlow
    ? { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", text: "rgba(251,191,36,1)", dot: "#f59e0b" }
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