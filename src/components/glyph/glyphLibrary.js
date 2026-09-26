// GLYPH — the style library: the shelves, the curated recipes, and the reading
// of a picture that decides what to suggest for it.
//
// Everything here is free and local: a style is just a way of rebuilding the
// source out of one visual primitive, so browsing costs nothing and previews are
// real renders of the picture in front of you.

import { STYLES, styleById } from './glyphStyles';

export const CATEGORIES = [
  { id: 'ascii', label: 'ASCII & Text' },
  { id: 'pixel', label: 'Pixel & Blocks' },
  { id: 'print', label: 'Print & Paper' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'distort', label: 'Distort' },
  { id: 'focus', label: 'Blur & Focus' },
  { id: 'glitch', label: 'Glitch & Signal' },
  { id: 'light', label: 'Light & Color' },
  { id: 'glass', label: 'Glass' },
  { id: 'material', label: 'Material & Texture' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function stylesByCategory(id) {
  return STYLES.filter((s) => s.category === id);
}

// The top row: the styles worth meeting first.
export const FEATURED = STYLES.filter((s) => s.featured || (s.core && ['characters', 'pixel', 'dither'].includes(s.id)));

export function searchStyles(query) {
  const q = query.trim().toLowerCase();
  if (!q) return STYLES;
  return STYLES.filter(
    (s) => s.name.toLowerCase().includes(q) || s.tags.includes(q) || s.category.includes(q),
  );
}

/** A style that deliberately transforms the read rather than reconstructing it. */
export function isFilterStyle(id) {
  const s = STYLES.find((x) => x.id === id);
  return !!(s && s.filter);
}

/**
 * One of the fifteen original renderers. The fidelity guard only second-guesses
 * those: the library's other shelves are deliberate looks (sparse line art, a
 * blur, a warp) that are meant to read the way they do.
 */
export function isCoreStyle(id) {
  const s = STYLES.find((x) => x.id === id);
  return !!(s && s.core);
}

/* ── recipes ──────────────────────────────────────────────────────────── */

// A recipe is a style plus the palette it was chosen for — the same renderer,
// tuned the way that pairing is meant to look.
export const RECIPES = [
  { id: 'terminal', name: 'Terminal Green', style: 'characters', palette: 'green' },
  { id: 'blueprint', name: 'Blueprint', style: 'schematic', palette: 'cyan' },
  { id: 'newsprint', name: 'Newsprint', style: 'halftone', palette: 'mono' },
  { id: 'sunsetPoster', name: 'Sunset Poster', style: 'warhol', palette: 'sunset' },
  { id: 'frosted', name: 'Frosted Window', style: 'frostedGlass', palette: 'ice' },
  { id: 'arcade', name: 'Neon Arcade', style: 'neonGrid', palette: 'neon' },
  { id: 'filmStill', name: 'Film Still', style: 'gradientMap', palette: 'amber' },
  { id: 'inkPaper', name: 'Ink on Paper', style: 'sketch', palette: 'mono' },
  { id: 'chromeDream', name: 'Chrome Dream', style: 'chrome', palette: 'nova' },
  { id: 'risoZine', name: 'Riso Zine', style: 'risograph', palette: 'magenta' },
];

/* ── what this picture wants ──────────────────────────────────────────── */

/** Read the picture's own character: how dark, how colourful, how busy. */
export function analyzeSource(src) {
  if (!src || !src.imageData) return null;
  const d = src.imageData.data;
  const total = src.width * src.height;
  const step = Math.max(1, Math.floor(total / 12000)) * 4;
  let r = 0;
  let g = 0;
  let b = 0;
  let sat = 0;
  let n = 0;
  const lums = [];
  for (let i = 0; i < d.length; i += step) {
    const rr = d[i];
    const gg = d[i + 1];
    const bb = d[i + 2];
    r += rr;
    g += gg;
    b += bb;
    const mx = Math.max(rr, gg, bb);
    const mn = Math.min(rr, gg, bb);
    sat += mx === 0 ? 0 : (mx - mn) / mx;
    lums.push(0.2126 * rr + 0.7152 * gg + 0.0722 * bb);
    n++;
  }
  if (!n) return null;
  const mean = lums.reduce((a, v) => a + v, 0) / n;
  const variance = lums.reduce((a, v) => a + (v - mean) * (v - mean), 0) / n;
  return {
    luma: mean,
    sat: sat / n,
    contrast: Math.sqrt(variance) / 128,
    warm: r / n - b / n,
  };
}

const BUCKETS = {
  dark: ['characters', 'dots', 'engraving', 'ledMatrix', 'halftone', 'stippling', 'scanline', 'lightWind', 'beacon', 'gradientMap'],
  bright: ['dither', 'risograph', 'sketch', 'cyanotype', 'mezzotint', 'pixelSort', 'stippling', 'comic', 'lines', 'emboss'],
  colorful: ['mosaic', 'disco', 'prism', 'cmykDrops', 'warhol', 'gradientMap', 'kaleidoscope', 'pointillize', 'neonGrid', 'oilPaint'],
  mono: ['duotone', 'dither', 'forensics', 'emboss', 'engraving', 'schematic', 'braille', 'shatter', 'flowField', 'marble'],
  busy: ['lowPoly', 'schematic', 'forensics', 'pixelSort', 'truchet', 'topography', 'hexMosaic', 'isoExtrude', 'lattice', 'aberration'],
  soft: ['frostedGlass', 'gaussianBlur', 'dreamdust', 'topography', 'watercolor', 'oilPaint', 'glassOrb', 'vitrine', 'thinFilm', 'lightWind'],
  smooth: ['voxel', 'lego', 'mosaic', 'pixel', 'tintedGlass', 'glassPixel', 'posterize', 'chrome', 'specimen', 'moltenMetal'],
};

/** Styles worth trying on this particular picture, best first. */
export function suggestStyles(analysis, limit = 14) {
  if (!analysis) return FEATURED.map((s) => s.id);
  const picked = [];
  const push = (list) => {
    list.forEach((id) => {
      if (!picked.includes(id)) picked.push(id);
    });
  };
  if (analysis.luma < 95) push(BUCKETS.dark);
  else if (analysis.luma > 175) push(BUCKETS.bright);
  else push(['mosaic', 'halftone', 'characters', 'dither', 'mosaic', 'cmykDrops']);
  if (analysis.sat > 0.32) push(BUCKETS.colorful);
  else push(BUCKETS.mono);
  if (analysis.contrast > 0.42) push(BUCKETS.busy);
  else push(BUCKETS.soft);
  push(BUCKETS.smooth);
  return picked.slice(0, limit);
}

/* ── previews ─────────────────────────────────────────────────────────── */

/**
 * A small copy of the working source, so the browser can render every tile in
 * the library from the user's own picture without touching the full-size one.
 */
export function makePreviewSource(source, maxW = 168) {
  if (!source || !source.imageData) return null;
  const full = document.createElement('canvas');
  full.width = source.width;
  full.height = source.height;
  full.getContext('2d').putImageData(source.imageData, 0, 0);
  const scale = Math.min(1, maxW / source.width);
  const out = document.createElement('canvas');
  out.width = Math.max(8, Math.round(source.width * scale));
  out.height = Math.max(8, Math.round(source.height * scale));
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(full, 0, 0, out.width, out.height);
  // The same shape as the working source, so every renderer reads it unchanged.
  return { width: out.width, height: out.height, imageData: ctx.getImageData(0, 0, out.width, out.height) };
}

/** The params a tile renders with: the live look, re-scaled to the thumbnail. */
export function previewParams(entry, params, preview) {
  if (!params || !preview) return null;
  const cell = Math.max(2, Math.round(Math.min(preview.width, preview.height) / 24));
  return {
    ...params,
    style: entry.id,
    cellSize: cell,
    spacing: entry.id === 'mosaic' || entry.id === 'dots' || entry.id === 'specimen' ? Math.min(3, params.spacing || 0) : 0,
    fontScale: entry.id === 'braille' || entry.id === 'block' ? 1 : params.fontScale,
  };
}

export { STYLES, styleById };