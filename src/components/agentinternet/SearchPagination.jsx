import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SearchPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return <nav aria-label="Search result pages" className="flex items-center justify-center gap-1 border-t border-white/10 bg-black/70 px-3 py-2">
    <button aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-25"><ChevronLeft className="h-4 w-4" /></button>
    {start > 1 && <span className="px-1 text-xs text-white/30">…</span>}
    {pages.map(number => <button key={number} aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)} className={`h-8 min-w-8 rounded-full px-2 text-xs font-medium ${number === page ? 'bg-cyan-400 text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>{number}</button>)}
    {pages[pages.length - 1] < totalPages && <span className="px-1 text-xs text-white/30">…</span>}
    <button aria-label="Next page" disabled={page === totalPages} onClick={() => onChange(page + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-25"><ChevronRight className="h-4 w-4" /></button>
  </nav>;
}