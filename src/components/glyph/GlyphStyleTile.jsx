import React, { useEffect, useRef, useState } from 'react';
import { Check, Heart } from 'lucide-react';
import { renderTo } from './glyphEngine';
import { previewParams } from './glyphLibrary';

/**
 * One style in the library: a real render of the user's own picture in that
 * style. Tiles only draw once they scroll into view, so opening the library on
 * a large image stays instant.
 */
export default function GlyphStyleTile({ entry, params, preview, active, favorite, onApply, onFavorite }) {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: '240px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen || !preview || !params || !canvasRef.current) return;
    const p = previewParams(entry, params, preview);
    if (!p) return;
    renderTo(canvasRef.current, preview, p, 0);
  }, [seen, preview, params, entry]);

  return (
    <div ref={hostRef} className="group relative">
      <button
        onClick={() => onApply(entry.id)}
        className={`w-full text-left rounded-xl overflow-hidden transition-all ${active ? 'glyph-tile-on' : 'glyph-tile'}`}
        title={`${entry.name} — ${entry.tags}`}
      >
        <span className="block relative w-full aspect-[4/3] bg-black/40 overflow-hidden">
          {preview ? (
            <canvas ref={canvasRef} className="w-full h-full block" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-2xl glyph-muted">{entry.icon}</span>
          )}
          <span className="absolute top-1.5 left-1.5 text-[11px] leading-none px-1.5 py-1 rounded-md bg-black/55 backdrop-blur-sm glyph-word">
            {entry.icon}
          </span>
          {active && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
              <Check className="w-3 h-3" />
            </span>
          )}
        </span>
        <span className="block px-2 py-1.5">
          <span className="block text-[11px] leading-tight glyph-word truncate">{entry.name}</span>
          <span className="block text-[9px] leading-tight glyph-muted truncate">{entry.tags}</span>
        </span>
      </button>
      <button
        onClick={() => onFavorite(entry.id)}
        className={`absolute bottom-7 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
          favorite ? 'opacity-100 text-rose-400 bg-black/60' : 'opacity-0 group-hover:opacity-100 text-white/70 bg-black/60'
        }`}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className="w-3.5 h-3.5" fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}