import React from 'react';
import { Download, Trash2 } from 'lucide-react';

// One piece in a grid: the render itself, what made it, and whatever actions the
// shelf it sits on offers.
export default function GlyphWorkCard({ work, onUse, onKeep, kept, onDownload, onRemove }) {
  return (
    <div className="glyph-card overflow-hidden rounded-2xl">
      <button onClick={() => onUse(work)} className="block w-full" title="Open this look in the studio">
        <img src={work.url} alt={`${work.style} in ${work.palette}`} className="block h-auto w-full" />
      </button>

      <div className="flex items-center gap-1.5 px-2 pt-1.5">
        <span className="glyph-muted truncate text-[10px]">{work.style} · {work.palette}</span>
        {work.animated && (
          <span className="glyph-pill shrink-0 rounded-full px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em]">moves</span>
        )}
        {work.kind === 'starter' && (
          <span className="glyph-pill shrink-0 rounded-full px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em]">starter</span>
        )}
        <span className="glyph-mono glyph-muted ml-auto shrink-0 text-[9px]">{work.seed}</span>
      </div>

      <div className="flex items-center gap-1 px-2 py-1.5">
        <button onClick={() => onUse(work)} className="glyph-btn glyph-btn-ghost glyph-btn-sm flex-1">
          Use
        </button>
        {onKeep && (
          <button
            onClick={() => onKeep(work)}
            disabled={kept}
            className="glyph-btn glyph-btn-ghost glyph-btn-sm"
            title={kept ? 'Already in your gallery' : 'Keep this in your gallery'}
          >
            {kept ? 'Kept' : 'Keep'}
          </button>
        )}
        {onDownload && (
          <button onClick={() => onDownload(work)} className="glyph-btn glyph-btn-ghost glyph-btn-sm" title="Download this piece">
            <Download className="h-3 w-3" />
          </button>
        )}
        {onRemove && (
          <button onClick={() => onRemove(work)} className="glyph-btn glyph-btn-ghost glyph-btn-sm" title="Remove from your gallery">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}