import React from "react";
import { motion } from "framer-motion";
import { X, Loader2, Terminal } from "lucide-react";

export default function RMXRunPanel({ logs, running, onClose }) {
  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      className="absolute bottom-0 left-0 right-0 z-30 max-h-[40vh] bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-white font-bold text-xs">Run Logs</span>
          {running && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs space-y-1">
        {logs.length === 0 ? (
          <div className="text-white/40">Waiting for output...</div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                l.type === "success" ? "text-green-400" :
                l.type === "error" ? "text-red-400" :
                "text-white/70"
              }`}
            >
              <span className="text-white/30 flex-shrink-0">{l.time}</span>
              <span className="break-words">{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}