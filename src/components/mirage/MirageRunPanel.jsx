import React from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

export default function MirageRunPanel({ logs, running, onClose }) {
  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 240 }}
      className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-30 bg-black/85 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/20 overflow-hidden max-h-[300px] flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-amber-500/10">
        <div className="flex items-center gap-2">
          {running ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className="text-white font-black text-xs tracking-wide">
            {running ? "Running…" : "Run Log"}
          </span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono">
        {logs.length === 0 && (
          <div className="text-white/30 text-[11px]">Waiting for execution…</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            <span className="text-white/30 shrink-0">{log.time}</span>
            <span
              className={
                log.type === "error"
                  ? "text-red-300"
                  : log.type === "success"
                  ? "text-emerald-300"
                  : "text-white/70"
              }
            >
              {log.msg}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}