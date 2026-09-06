import React from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";

export default function FrameStrip({ frames, selected, onSelect, onRetry }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {frames.map((f) => {
        const active = f.index === selected;
        return (
          <button
            key={f.index}
            onClick={() => onSelect(f.index)}
            className={`relative flex-shrink-0 rounded-lg overflow-hidden border transition-all ${
              active ? "border-white scale-[1.04]" : "border-white/10 opacity-70 hover:opacity-100"
            }`}
            title={`Frame ${f.index + 1}`}
          >
            <img src={f.dataUrl} alt={`frame ${f.index + 1}`} className="h-16 w-auto object-cover" />
            <span className="absolute top-1 left-1 text-[9px] font-bold bg-black/70 px-1 rounded text-white/80">
              {f.index + 1}
            </span>
            <span className="absolute bottom-1 right-1 flex items-center justify-center">
              {f.status === "cloning" && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
              {f.status === "done" && f.html && <Check className="w-3.5 h-3.5 text-green-400" />}
              {f.status === "failed" && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry?.(f.index);
                  }}
                  className="flex items-center justify-center w-5 h-5"
                  title="Retry this frame"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}