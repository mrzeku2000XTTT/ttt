import React from "react";
import { Link } from "react-router-dom";
import { Store, Maximize2 } from "lucide-react";

export default function Toolbar({ fullscreen, onToggleFullscreen }) {
  return (
    <div className="h-14 flex items-center justify-between px-4 sm:px-5 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[19px] font-bold tracking-tight text-[#1d1d1f]" style={{ fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif' }}>OC</span>
        <span className="hidden sm:inline text-[12px] text-[#86868b] ml-1" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>Motion</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggleFullscreen} title="Fullscreen"
          className="w-9 h-9 rounded-full hover:bg-black/[0.05] text-[#1d1d1f] flex items-center justify-center transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
        <Link to="/AppStoreV2" title="Exit to Store"
          className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/[0.05] hover:bg-black/[0.08] text-[13px] text-[#1d1d1f] transition-colors"
          style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
          <Store className="w-3.5 h-3.5" /> Store
        </Link>
      </div>
    </div>
  );
}