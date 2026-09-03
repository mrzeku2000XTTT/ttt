import React from "react";
import { BookOpen } from "lucide-react";

export default function BookCard({ book, onOpen }) {
  const readable = book.source === "scan" || !!book.ia_id || (book.text && book.text.length > 20);
  return (
    <button onClick={onOpen} className="text-left group">
      <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 mb-2 relative">
        {book.cover ? (
          <img src={book.cover} alt={book.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
            <BookOpen className="w-8 h-8 text-white/25" />
          </div>
        )}
      </div>
      <div className="text-[12.5px] text-white/90 line-clamp-2 leading-snug">{book.title}</div>
      <div className="text-[11px] text-white/45 truncate mt-0.5">{book.author}{book.year ? ` · ${book.year}` : ""}</div>
      {!readable && (
        <div className="text-[10px] text-amber-400/70 mt-1">Preview only · scan to read</div>
      )}
    </button>
  );
}