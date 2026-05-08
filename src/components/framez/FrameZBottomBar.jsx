import React from "react";
import { ChevronLeft, RotateCw, MoreHorizontal, LayoutPanelTop } from "lucide-react";

/**
 * Bottom browser-style bar showing the current deck domain (faces.app style).
 */
export default function FrameZBottomBar({ domain = "framez.app" }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-3 bg-zinc-50 border-t border-zinc-200">
      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm active:scale-95 transition-all">
        <ChevronLeft className="w-4 h-4 text-zinc-700" strokeWidth={2.2} />
      </button>

      <div className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-white border border-zinc-200 shadow-sm px-4">
        <LayoutPanelTop className="w-4 h-4 text-zinc-500" strokeWidth={2} />
        <span className="text-sm font-semibold text-zinc-800">{domain}</span>
        <button className="ml-auto w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-100 active:scale-95 transition-all">
          <RotateCw className="w-3.5 h-3.5 text-zinc-600" strokeWidth={2} />
        </button>
      </div>

      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm active:scale-95 transition-all">
        <MoreHorizontal className="w-4 h-4 text-zinc-700" strokeWidth={2.2} />
      </button>
    </div>
  );
}