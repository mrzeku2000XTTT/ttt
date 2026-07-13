import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ExternalLink, Loader2 } from "lucide-react";

// Fullscreen in-app viewer for a nation's site
export default function NationViewer({ nation, onClose }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(80,255,180,0.3)", background: "rgba(0,12,8,0.95)" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{nation.flag}</span>
          <span className="text-[11px] font-black tracking-[0.25em]" style={{ color: "#7dffce", fontFamily: "monospace" }}>
            {nation.name}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-[9px] tracking-[0.25em] px-2 py-0.5"
            style={{ color: "#4ade80", border: "1px solid rgba(74,222,128,0.4)", fontFamily: "monospace" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href={nation.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] tracking-[0.25em] uppercase"
            style={{ border: "1px solid rgba(80,255,180,0.3)", color: "rgba(125,255,206,0.7)", fontFamily: "monospace" }}>
            <ExternalLink className="w-3 h-3" /> OPEN
          </a>
          <button onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] tracking-[0.25em] uppercase focus:outline-none"
            style={{ border: "1px solid rgba(80,255,180,0.4)", color: "#7dffce", background: "rgba(80,255,180,0.08)", fontFamily: "monospace" }}>
            <X className="w-3 h-3" /> CLOSE
          </button>
        </div>
      </div>

      {/* Site iframe */}
      <div className="flex-1 relative">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7dffce" }} />
            <span className="text-[9px] tracking-[0.4em] uppercase" style={{ color: "rgba(125,255,206,0.5)", fontFamily: "monospace" }}>
              ENTERING {nation.name}…
            </span>
          </div>
        )}
        <iframe src={nation.url} title={nation.name} onLoad={() => setLoaded(true)}
          className="w-full h-full border-0"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}
          allow="clipboard-write" />
      </div>
    </motion.div>
  );
}