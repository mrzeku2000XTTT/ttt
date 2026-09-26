// GLYPH — the shared toolkit every renderer family builds on: one grid walker,
// one region sampler, and the small helpers for tone, noise and ramps.
//
// Every family obeys the same rule: the canvas is the source's exact pixel size,
// and each cell is filled from the region of the picture it represents. A
// renderer may change WHICH region a cell reads — warped, blurred, split,
// re-coloured — but never where the cell is drawn.

import { plateColor, plateRgb } from './glyphPalettes';

export const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/* ── sampling ─────────────────────────────────────────────────────────── */

// Average RGB of one source region — up to 8×8 probes per cell, which is all a
// single cell can show and keeps a large render interactive.
export function cellAvg(src, x0, y0, w, h) {
  const sx = Math.max(0, Math.min(src.width - 1, Math.floor(x0)));
  const sy = Math.max(0, Math.min(src.height - 1, Math.floor(y0)));
  const x1 = Math.max(sx + 1, Math.min(src.width, Math.round(x0 + w)));
  const y1 = Math.max(sy + 1, Math.min(src.height, Math.round(y0 + h)));
  const stepX = Math.max(1, Math.floor((x1 - sx) / 8));
  const stepY = Math.max(1, Math.floor((y1 - sy) / 8));
  const d = src.data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = sy; y < y1; y += stepY) {
    for (let x = sx; x < x1; x += stepX) {
      const i = (y * src.width + x) * 4;
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
  }
  if (!n) return [0, 0, 0];
  return [r / n, g / n, b / n];
}

/** Nearest source pixel at pixel coordinates, clamped to the picture. */
export function px(src, x, y) {
  const sx = Math.max(0, Math.min(src.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(src.height - 1, Math.round(y)));
  const i = (sy * src.width + sx) * 4;
  return [src.data[i], src.data[i + 1], src.data[i + 2]];
}

/** Nearest source pixel at normalised coordinates; x wraps, so polar reads work. */
export function pxWrap(src, u, v) {
  const x = ((u % 1) + 1) % 1;
  const y = Math.max(0, Math.min(0.999, v));
  return px(src, x * (src.width - 1), y * (src.height - 1));
}

/** Average of a square patch centred on (cx, cy) — the blur and glass base. */
export function areaAvg(src, cx, cy, radius) {
  return cellAvg(src, cx - radius, cy - radius, radius * 2, radius * 2);
}

/** Average along one direction — a real motion-blur read of the source. */
export function dirAvg(src, cx, cy, radius, dx, dy, steps = 7) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1) - 0.5) * 2 * radius;
    const c = px(src, cx + dx * t, cy + dy * t);
    r += c[0];
    g += c[1];
    b += c[2];
    n++;
  }
  return [r / n, g / n, b / n];
}

/* ── grid ─────────────────────────────────────────────────────────────── */

// Every renderer walks the grid through this one walker, so cells always tile
// the canvas exactly: no gaps, no overlap, and never a drift from the source
// pixels the cell represents.
// `aspect` is the cell's height ÷ its width. A latin monospace glyph is about
// 0.6 wide for 0.72 tall, so its cell wants to be 1.2× taller than wide —
// matching the cell to the glyph is what makes the marks tile densely instead
// of floating apart with air between them.
export function eachCell(W, H, cs, fn, aspect = 1) {
  const cols = Math.max(1, Math.round(W / Math.max(1, cs)));
  const rows = Math.max(1, Math.round(H / (Math.max(1, cs) * aspect)));
  for (let j = 0; j < rows; j++) {
    const y0 = Math.floor((j * H) / rows);
    const y1 = Math.floor(((j + 1) * H) / rows);
    for (let i = 0; i < cols; i++) {
      const x0 = Math.floor((i * W) / cols);
      const x1 = Math.floor(((i + 1) * W) / cols);
      fn(i, j, x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0), cols, rows);
    }
  }
}

/* ── tone ─────────────────────────────────────────────────────────────── */

// The image's own mean colour, used as the plate so a bright picture keeps a
// bright ground and a dark one stays dark.
const meanCache = new WeakMap();
export function sourceMean(src) {
  const cached = meanCache.get(src.data);
  if (cached) return cached;
  const d = src.data;
  const step = Math.max(4, Math.floor(d.length / 4 / 20000) * 4);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += step) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
    n++;
  }
  const mean = n ? [r / n, g / n, b / n] : [0, 0, 0];
  meanCache.set(src.data, mean);
  return mean;
}

export const plateFor = (p, src) => plateColor(p, sourceMean(src));
export const groundFor = (p, src) => plateRgb(p, sourceMean(src));

// Sparse primitives leave the plate showing between their marks, so they first
// lay the cell's own tone underneath. That keeps mid-tones and large bright
// areas in the picture without hiding the marks.
export function toneBase(ctx, x, y, w, h, col, alpha) {
  ctx.fillStyle = `rgba(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])},${alpha})`;
  ctx.fillRect(x, y, w, h);
}

export function rampIndex(ramp, l) {
  const i = Math.round((l / 255) * (ramp.length - 1));
  return Math.max(0, Math.min(ramp.length - 1, i));
}

/* ── small maths ──────────────────────────────────────────────────────── */

// Deterministic per-cell noise: same cell, same tick, same mark. A render never
// uses Math.random, so a seed always reproduces.
export function hash3(a, b, c) {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export const lighten = (col, amount) => col.map((v) => Math.min(255, v + amount));
export const darken = (col, amount) => col.map((v) => Math.max(0, v * (1 - amount)));
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const css = (col, alpha = 1) =>
  `rgba(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])},${alpha})`;

export const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Cell shape and glyph size per family: latin glyphs are narrow and tall,
// full-width katakana are square, so each gets the cell it can fill.
export const LATIN_ASPECT = 1.2;
export const LATIN_FONT = 1.67;
export const WIDE_ASPECT = 0.78;

/** The two ends of the active palette, for the duotone and print families. */
export function duoColors(p) {
  const pal = p.paletteObj;
  const cols = pal && pal.colors && pal.colors.length ? pal.colors : [[18, 22, 30], [242, 247, 255]];
  return [cols[0], cols[cols.length - 1]];
}

/** A luminance ramp from the palette, or a neutral one when it has none. */
export function lumaRamp(p) {
  const pal = p.paletteObj;
  if (pal && pal.colors && pal.colors.length > 1) return pal.colors;
  return [[0, 0, 0], [64, 64, 64], [128, 128, 128], [192, 192, 192], [255, 255, 255]];
}