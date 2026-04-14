import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Maximize2 } from "lucide-react";

export default function EmbeddedSiteViewer({ url, label, onClose }) {
  if (!url) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-cyan-400">K</span>
            </div>
            <span className="text-[13px] font-semibold text-white truncate">{label}</span>
            <span className="text-[11px] text-zinc-500 truncate hidden sm:block">{url}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 bg-white/10 hover:bg-white/15 rounded-lg text-[11px] font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> New Tab
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 relative">
          <iframe
            src={url}
            title={label}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}