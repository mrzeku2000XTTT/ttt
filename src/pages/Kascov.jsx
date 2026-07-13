import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function Kascov() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/90">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "monospace" }}>
              KASCOV
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:inline">
              covenant explorer · scan ZK smart coins
            </span>
          </div>
        </div>
        <a
          href="https://kascov.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          kascov.io
        </a>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}
        <iframe
          src="https://kascov.io"
          title="Kascov — Kaspa covenant explorer"
          className="w-full h-full border-0"
          onLoad={() => setLoaded(true)}
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}