import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import GlyphWorkCard from './GlyphWorkCard';
import { signature } from './glyphGalleryStore';

const download = (work) => {
  const a = document.createElement('a');
  a.href = work.url;
  a.download = `glyph-${work.style}-${work.seed}.jpg`;
  a.click();
};

// The shelf: ideas generated on the spot, and everything the user has kept.
export default function GlyphGalleryTab({ ideas, works, busy, stocking, onInspire, onUse, onKeep, onRemove }) {
  const kept = new Set(works.map(signature));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0">
          <p className="glyph-word text-[13px]">Inspiration</p>
          <p className="glyph-muted mt-0.5 text-[11px]">
            Fresh looks for the picture in the studio — rendered instantly, and only kept if you say so.
          </p>
        </div>
        <button onClick={onInspire} disabled={busy} className="glyph-btn glyph-btn-primary ml-auto shrink-0">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? 'Generating' : ideas.length ? 'More ideas' : 'Inspire me'}
        </button>
      </div>

      {ideas.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ideas.map((idea) => (
            <GlyphWorkCard
              key={idea.id}
              work={idea}
              onUse={onUse}
              onKeep={onKeep}
              kept={kept.has(signature(idea))}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-2">
        <p className="glyph-word text-[13px]">Your gallery</p>
        <span className="glyph-muted text-[11px]">{works.length} kept</span>
        {stocking && <span className="glyph-muted ml-auto inline-flex items-center gap-1.5 text-[11px]"><Loader2 className="h-3 w-3 animate-spin" /> stocking your shelf</span>}
      </div>

      {works.length === 0 && !stocking ? (
        <p className="glyph-muted mt-3 text-[12px]">
          Nothing kept yet — generate some ideas and keep the ones you like. They stay here after a refresh.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {works.map((work) => (
            <GlyphWorkCard
              key={work.id}
              work={work}
              onUse={onUse}
              onDownload={download}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}