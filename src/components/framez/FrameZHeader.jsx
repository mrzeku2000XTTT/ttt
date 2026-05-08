import React from "react";
import { Link } from "react-router-dom";
import { X, Columns2, Palette, History, Play } from "lucide-react";

/**
 * FrameZ top header — exact pixel clone of the screenshot.
 * Left: close (×). Right: split-view, theme, history, play, Publish button.
 */
export default function FrameZHeader() {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-200 bg-white">
      <Link
        to="/AppStoreV2"
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 active:scale-95 transition-all"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-zinc-700" strokeWidth={2.2} />
      </Link>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg px-1 py-1">
          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 active:scale-95 transition-all">
            <Columns2 className="w-3.5 h-3.5 text-zinc-700" strokeWidth={2} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 active:scale-95 transition-all">
            <Palette className="w-3.5 h-3.5 text-zinc-700" strokeWidth={2} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 active:scale-95 transition-all">
            <History className="w-3.5 h-3.5 text-zinc-700" strokeWidth={2} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 active:scale-95 transition-all">
            <Play className="w-3.5 h-3.5 text-zinc-700 fill-zinc-700" strokeWidth={2} />
          </button>
        </div>

        <button className="px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white text-sm font-semibold shadow-sm">
          Publish
        </button>
      </div>
    </div>
  );
}