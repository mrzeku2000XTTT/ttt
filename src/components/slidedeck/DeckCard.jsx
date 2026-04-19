import React from "react";
import { Trash2, Film, Clock } from "lucide-react";
import StyleDot from "./StyleDot";
import StatusBadge from "./StatusBadge";

export default function DeckCard({ deck, onOpen, onDelete }) {
  return (
    <div
      onClick={() => onOpen(deck)}
      className="group cursor-pointer rounded-2xl p-4 transition-all hover:scale-[1.02] hover:border-teal-400/50"
      style={{ background: "rgba(15,18,25,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <StyleDot style={deck.style} />
          <h3 className="text-white font-bold text-sm truncate">{deck.title}</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(deck); }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Delete deck"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {deck.description && (
        <p className="text-white/50 text-[12px] line-clamp-2 mb-3 leading-relaxed">{deck.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 text-[11px] text-white/50">
          <span className="flex items-center gap-1">
            <Film className="w-3 h-3" />
            {deck.total_slides || 0}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deck.total_duration || 0}s
          </span>
        </div>
        <StatusBadge status={deck.status || "draft"} />
      </div>
    </div>
  );
}