import React from "react";
import { Plus, Type, Bot, Download, Loader2, Settings2 } from "lucide-react";

/**
 * Compact bottom action bar for phones.
 * Sticks to the bottom of the screen with safe-area padding.
 * Buttons are 44px tall (iOS HIG) with large tap targets.
 */
export default function MockMobileBar({
  placementMode,
  onTogglePlacement,
  onAddText,
  onOpenAgent,
  onExport,
  onReset,
  onOpenControls,
  exporting,
  hasSelection,
}) {
  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch gap-1 px-2 py-2">
        <button
          onClick={onOpenAgent}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white active:opacity-80"
          aria-label="Ask AI"
        >
          <Bot className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">AI</span>
        </button>
        <button
          onClick={onTogglePlacement}
          className={`flex-1 flex flex-col items-center justify-center h-12 rounded-xl active:opacity-80 ${
            placementMode
              ? "bg-cyan-400 text-black"
              : "bg-white/5 border border-white/10 text-white/80"
          }`}
          aria-label="Add device"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Device</span>
        </button>
        <button
          onClick={onAddText}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-white/5 border border-white/10 text-white/80 active:opacity-80"
          aria-label="Add text"
        >
          <Type className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Text</span>
        </button>
        <button
          onClick={onOpenControls}
          className={`flex-1 flex flex-col items-center justify-center h-12 rounded-xl active:opacity-80 ${
            hasSelection
              ? "bg-white/10 border border-white/20 text-white"
              : "bg-white/5 border border-white/10 text-white/50"
          }`}
          aria-label="Edit selected"
        >
          <Settings2 className="w-4 h-4" />
          <span className="text-[9px] font-bold mt-0.5">Edit</span>
        </button>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex-1 flex flex-col items-center justify-center h-12 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white active:opacity-80 disabled:opacity-40"
          aria-label="Export"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="text-[9px] font-bold mt-0.5">{exporting ? "…" : "PNG"}</span>
        </button>
      </div>
    </div>
  );
}