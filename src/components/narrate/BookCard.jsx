import React from "react";
import { BookOpen, Headphones, Lock } from "lucide-react";

export default function BookCard({ book, onOpen }) {
  const readable = book.source === "scan" || !!book.ia_id || (book.text && book.text.length > 20);
  const subjects = (book.subjects || []).slice(0, 2).join(" · ");
  return (
    <button
      onClick={onOpen}
      className="text-left group rounded-xl p-2 -m-2 transition-all hover:bg-white/5 active:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 mb-2 relative shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-hover:shadow-[0_6px_20px_rgba(255,255,255,0.12)] group-hover:border-white/30 transition-all">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
            <BookOpen className="w-8 h-8 text-white/25" />
          </div>
        )}
        {/* Tap-to-read affordance on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white text-black rounded-full px-3 py-1.5 text-[11px] font-semibold">
            <Headphones className="w-3.5 h-3.5" />
            {readable ? "Listen" : "Preview"}
          </div>
        </div>
        {!readable && (
          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur flex items-center justify-center" title="Full text unavailable — scan your copy">
            <Lock className="w-3 h-3 text-amber-400" />
          </div>
        )}
      </div>
      <div className="text-[12.5px] text-white/90 line-clamp-2 leading-snug group-hover:text-white">{book.title}</div>
      <div className="text-[11px] text-white/45 truncate mt-0.5">
        {book.author}
        {book.year ? ` · ${book.year}` : ""}
      </div>
      {subjects && <div className="text-[10px] text-white/35 truncate mt-0.5">{subjects}</div>}
      {!readable && (
        <div className="text-[10px] text-amber-400/70 mt-1 flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" /> Scan your copy to read
        </div>
      )}
    </button>
  );
}