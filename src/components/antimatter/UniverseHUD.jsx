import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Save, Loader2, Sparkles, Trash2 } from "lucide-react";

// 2D overlay UI: navigation, ghost-mode toggle, element counter, save indicator.
export default function UniverseHUD({ ghost, onToggleGhost, count, saving, onClearAll }) {
  return (
    <>
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-xl">
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white tracking-tight">Antimatter</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-bold">
              <Loader2 className="w-3 h-3 animate-spin" /> saving
            </div>
          )}
        </div>
      </nav>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-mono text-white/60">{count} elements</span>
          </div>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold backdrop-blur-md"
            title="Delete all elements"
          >
            <Trash2 className="w-3 h-3" /> Reset
          </button>
        </div>

        <button
          onClick={onToggleGhost}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border font-black text-xs transition-all ${
            ghost
              ? "bg-fuchsia-500 border-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/40"
              : "bg-white/5 border-white/15 text-white/70 hover:text-white"
          }`}
        >
          {ghost ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {ghost ? "Ghost Mode On" : "Ghost Mode"}
        </button>
      </div>

      {/* Helper hint */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[10px] text-white/50 font-mono pointer-events-none">
        drag to orbit · scroll to zoom · click ＋ to spawn
      </div>
    </>
  );
}