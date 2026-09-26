import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { paletteById } from './glyphPalettes';
import {
  CATEGORIES,
  FEATURED,
  RECIPES,
  STYLES,
  analyzeSource,
  searchStyles,
  suggestStyles,
  stylesByCategory,
} from './glyphLibrary';
import GlyphStyleTile from './GlyphStyleTile';

const FAV_KEY = 'glyph_style_favorites';

const TABS = [
  { id: 'explore', label: 'Explore' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'suggested', label: 'Suggested for this image' },
  { id: 'recipes', label: 'Recipes' },
  ...CATEGORIES,
];

const Section = ({ children }) => (
  <h3 className="glyph-word glyph-muted text-[10px] mt-5 mb-2 first:mt-1">{children}</h3>
);

/**
 * The style library. Every tile is a real render of the user's own picture in
 * that style, so browsing shows what you would actually get — and every style
 * is free: the shelves are just different ways of rebuilding the image.
 */
export default function GlyphStyleGallery({ params, preview, onApply, onRecipe, onClose }) {
  const [tab, setTab] = useState('explore');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch (err) {
      /* a full or blocked store simply means favorites do not persist */
    }
  }, [favorites]);

  const analysis = useMemo(() => analyzeSource(preview), [preview]);
  const suggested = useMemo(
    () => suggestStyles(analysis).map((id) => STYLES.find((s) => s.id === id)).filter(Boolean),
    [analysis],
  );

  const toggleFav = (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const results = query.trim() ? searchStyles(query) : null;

  const grid = (entries) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 gap-2">
      {entries.map((s) => (
        <GlyphStyleTile
          key={s.id}
          entry={s}
          params={params}
          preview={preview}
          active={params?.style === s.id}
          favorite={favorites.includes(s.id)}
          onApply={onApply}
          onFavorite={toggleFav}
        />
      ))}
    </div>
  );

  const trait = analysis
    ? `${analysis.luma < 95 ? 'dark' : analysis.luma > 175 ? 'bright' : 'mid-toned'} · ${
        analysis.sat > 0.32 ? 'colourful' : 'muted'
      } · ${analysis.contrast > 0.42 ? 'high detail' : 'soft'}`
    : '';

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: 'rgba(4,7,12,0.95)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center gap-2 px-3 sm:px-5 py-3" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <span className="glyph-word glyph-accent-text text-xs">Style library</span>
        <span className="glyph-muted hidden text-[10px] sm:inline">{STYLES.length} styles · all free</span>
        <label
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5"
          style={{ border: '1px solid var(--g-line)' }}
        >
          <Search className="glyph-muted h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search styles"
            className="w-24 bg-transparent text-[11px] outline-none sm:w-44"
            style={{ color: 'var(--g-ink)' }}
          />
        </label>
        <button onClick={onClose} className="glyph-pill flex h-8 w-8 items-center justify-center rounded-full" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scrollbar-hide flex gap-1.5 overflow-x-auto px-3 sm:px-5 py-2.5" style={{ borderBottom: '1px solid var(--g-line)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setQuery('');
            }}
            className={`glyph-chip whitespace-nowrap ${tab === t.id && !query ? 'glyph-chip-on' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-5 pb-10">
        {!preview && (
          <p className="glyph-muted mb-3 mt-3 text-[11px]">
            Drop an image in and every tile here renders your own picture in that style.
          </p>
        )}

        {results ? (
          results.length ? (
            <div className="pt-3">{grid(results)}</div>
          ) : (
            <p className="glyph-muted pt-4 text-xs">No style matches “{query}”.</p>
          )
        ) : tab === 'favorites' ? (
          <div className="pt-3">
            {favorites.length ? (
              grid(STYLES.filter((s) => favorites.includes(s.id)))
            ) : (
              <p className="glyph-muted text-xs">Tap the heart on any tile to keep it here.</p>
            )}
          </div>
        ) : tab === 'suggested' ? (
          <div className="pt-3">
            <Section>{trait ? `Chosen from this picture — ${trait}` : 'Chosen from this picture'}</Section>
            {grid(suggested)}
          </div>
        ) : tab === 'recipes' ? (
          <div className="pt-3">
            <Section>A style and the palette it was tuned for</Section>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7">
              {RECIPES.map((r) => {
                const entry = STYLES.find((s) => s.id === r.style);
                if (!entry) return null;
                return (
                  <div key={r.id}>
                    <GlyphStyleTile
                      entry={entry}
                      params={{ ...params, palette: r.palette, paletteObj: paletteById(r.palette) }}
                      preview={preview}
                      active={params?.palette === r.palette && params?.style === r.style}
                      favorite={favorites.includes(entry.id)}
                      onApply={() => onRecipe(r.style, r.palette)}
                      onFavorite={toggleFav}
                    />
                    <p className="glyph-muted mt-1 truncate text-[10px]">{r.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : tab === 'explore' ? (
          <div className="pt-3">
            <Section>Top picks</Section>
            {grid(FEATURED)}
            {CATEGORIES.map((c) => {
              const entries = stylesByCategory(c.id);
              if (!entries.length) return null;
              return (
                <React.Fragment key={c.id}>
                  <Section>{c.label}</Section>
                  {grid(entries)}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="pt-3">{grid(stylesByCategory(tab))}</div>
        )}
      </div>
    </div>
  );
}