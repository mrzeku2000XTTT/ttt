// GLYPH — inspiration.
//
// An inspiration has to look good before the user has asked for anything, so it
// is not a plain randomize: the settings are tamed, the density is fitted to the
// picture, and every candidate is scored with the same fidelity measure the
// studio's fallback uses — a piece that lost the subject is thrown away rather
// than shown.

import { randomizeParams } from './glyphStyles';
import { isAnimated, reconstructionFidelity, renderStill, renderTo } from './glyphEngine';
import { makePreviewSource } from './glyphLibrary';

// The shelves worth landing on uninvited: marks that rebuild the picture and
// stay readable at a glance.
export const INSPIRE_STYLES = [
  'characters',
  'asciiStudio',
  'mixed',
  'matrix',
  'braille',
  'block',
  'dither',
  'halftone',
  'stippling',
  'dots',
  'pixel',
  'mosaic',
  'engraving',
  'ledMatrix',
  'scanline',
  'lines',
  'crosshatch',
  'pointillize',
  'risograph',
  'duotone',
  'gradientMap',
];

const INSPIRE_PALETTES = [
  'original',
  'cyan',
  'dusk',
  'nova',
  'mono',
  'electric',
  'magenta',
  'green',
  'amber',
  'red',
  'purple',
  'neon',
  'ice',
  'sunset',
  'fire',
  'terminal',
];

// Below this the render no longer resembles the picture. The studio's own
// fallback trips at 0.5, so nothing on the shelf can be weaker than that.
const MIN_FIDELITY = 0.54;
const THUMB_W = 300;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Tame a randomize so the piece reads as the picture, not as an effect. */
function gentle(params) {
  return {
    ...params,
    brightness: 0,
    contrast: clamp(params.contrast, 0.96, 1.08),
    saturation: clamp(params.saturation, 0.92, 1.1),
    fontScale: Math.min(1, params.fontScale),
    jitter: Math.min(0.35, params.jitter),
    spacing: Math.min(2, params.spacing || 0),
    plate: 'auto',
  };
}

/** Density from the picture's own size, so every source reads at the same scale. */
function withDensity(params, source, cols) {
  return { ...params, cellSize: Math.max(3, Math.round(Math.min(source.width, source.height) / cols)) };
}

/** The thumbnail render, plus the params it actually used. */
function renderThumb(preview, params, scale) {
  const p = {
    ...params,
    cellSize: Math.max(2, Math.round(params.cellSize * scale)),
    spacing: Math.round((params.spacing || 0) * scale),
  };
  const canvas = document.createElement('canvas');
  canvas.width = preview.width;
  canvas.height = preview.height;
  renderTo(canvas, preview, p, 0);
  return { canvas, params: p };
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Fresh ideas for this picture: distinct renderers, each verified to still read
 * as the source. Returns fewer than `count` only if the picture refuses to
 * survive that many looks.
 */
export function buildInspirations(source, count = 8) {
  if (!source) return [];
  const preview = makePreviewSource(source, THUMB_W);
  if (!preview) return [];
  const scale = preview.width / source.width;
  const out = [];
  const used = [];
  let guard = 0;

  while (out.length < count && guard < count * 5) {
    guard += 1;
    const fresh = INSPIRE_STYLES.filter((s) => !used.includes(s));
    const style = pick(fresh.length ? fresh : INSPIRE_STYLES);
    const params = withDensity(gentle(randomizeParams(null, { style, palette: pick(INSPIRE_PALETTES) })), source, 34 + Math.floor(Math.random() * 22));
    const attempt = renderThumb(preview, params, scale);
    if (reconstructionFidelity(preview, attempt.canvas, attempt.params) < MIN_FIDELITY) continue;
    used.push(style);
    out.push({
      id: `idea-${params.seed}`,
      style: params.style,
      palette: params.palette,
      seed: params.seed,
      params,
      animated: isAnimated(params),
      url: attempt.canvas.toDataURL('image/jpeg', 0.86),
    });
  }
  return out;
}

/** The piece as it will be kept: a real render, big enough to download. */
export function renderWork(source, params, maxW = 720) {
  const scale = Math.min(1, maxW / Math.max(source.width, source.height));
  return renderStill(source, params, scale).toDataURL('image/jpeg', 0.88);
}

/** A render plus the settings that made it — one item for the gallery. */
export function workFromParams(source, params, kind = 'studio') {
  return {
    id: `work-${params.seed}-${Date.now()}`,
    url: renderWork(source, params),
    style: params.style,
    palette: params.palette,
    seed: params.seed,
    params,
    animated: isAnimated(params),
    kind,
    savedAt: Date.now(),
  };
}

/** Starter pieces, so a new gallery never opens empty. */
export function buildBackups(source, count = 6) {
  const now = Date.now();
  return buildInspirations(source, count).map((idea, i) => ({
    ...workFromParams(source, idea.params, 'starter'),
    id: `starter-${idea.seed}`,
    savedAt: now - i * 1000,
  }));
}