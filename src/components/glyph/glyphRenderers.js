// GLYPH — the renderers.
//
// ONE RULE FOR EVERY RENDERER: the output is the ORIGINAL IMAGE rebuilt out of
// a visual primitive.
//
//   the canvas is exactly the source's pixel size, so the aspect ratio can
//   never change and the whole picture is always covered.
//
//   for every cell of the source grid:
//     sample that exact region of the image  →  average RGB + luminance
//     draw a primitive AT THAT CELL'S RECT, sized/toned/coloured from it
//
// No renderer may invent a pattern, move a primitive off the cell it
// represents, or cover the reconstruction with a full-canvas texture.

import { CHAR_SETS } from './glyphStyles';
import { luma, mapColor, nearestColor, plateColor, plateRgb, rgbCss } from './glyphPalettes';

/* ── sampling ─────────────────────────────────────────────────────────── */

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// Average RGB of one source region — up to 8×8 probes per cell, which is all a
// single cell can show and keeps a 1100px render interactive.
function cellAvg(src, x0, y0, w, h) {
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

// The image's own mean colour, used as the plate so a bright picture keeps a
// bright ground and a dark one stays dark — instead of everything landing on
// white, which is what made renders read as blank.
const meanCache = new WeakMap();
function sourceMean(src) {
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

const plateFor = (p, src) => plateColor(p, sourceMean(src));
const groundFor = (p, src) => plateRgb(p, sourceMean(src));

/* ── grid ─────────────────────────────────────────────────────────────── */

// Every renderer walks the grid through this one walker, so cells always tile
// the canvas exactly: no gaps, no overlap, and never a drift from the source
// pixels the cell represents.
// `aspect` is the cell's height ÷ its width. A latin monospace glyph is about
// 0.6 wide for 0.72 tall, so its cell wants to be 1.2× taller than wide —
// matching the cell to the glyph is what makes the marks tile densely instead
// of floating apart with air between them.
function eachCell(W, H, cs, fn, aspect = 1) {
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

// Sparse primitives (characters, hatching) leave the plate showing between
// their marks, so they first lay the cell's own tone underneath. That keeps
// mid-tones and large bright areas in the picture without hiding the marks.
function toneBase(ctx, x, y, w, h, col, alpha) {
  ctx.fillStyle = `rgba(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])},${alpha})`;
  ctx.fillRect(x, y, w, h);
}

function rampIndex(ramp, l) {
  const i = Math.round((l / 255) * (ramp.length - 1));
  return Math.max(0, Math.min(ramp.length - 1, i));
}

// Deterministic per-cell noise for the animated styles: same cell, same tick,
// same glyph. A render never uses Math.random, so a seed always reproduces.
function hash3(a, b, c) {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

const lighten = (col, amount) => col.map((v) => Math.min(255, v + amount));
const darken = (col, amount) => col.map((v) => Math.max(0, v * (1 - amount)));

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Cell shape and glyph size per family: latin glyphs are narrow and tall,
// full-width katakana are square, so each gets the cell it can fill.
const LATIN_ASPECT = 1.2;
const LATIN_FONT = 1.67;
const WIDE_ASPECT = 0.78;

/* ── Characters ───────────────────────────────────────────────────────── */

// Bright source → dense character, dark source → sparse one, drawn in the
// cell's own colour at the cell's own position.
function drawCharacters(ctx, src, W, H, p, t) {
  const cs = Math.max(2, p.cellSize);
  const ramp = (CHAR_SETS[p.charSet] || CHAR_SETS.classic).chars;
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  // Glyphs are ink: on a dark ground a brighter cell gets the heavier mark.
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  const fs = Math.max(4, cs * LATIN_FONT * p.fontScale);
  ctx.font = `${fs}px ${MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const animated = p.style === 'animatedAscii';
  const tick = animated ? Math.floor(t * 9) : 0;
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const l = luma(c[0], c[1], c[2]);
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    let idx = rampIndex(ramp, ink ? 255 - l : l);
    if (animated && hash3(i, j, tick + p.seed) < 0.06 * (0.4 + p.jitter * 1.6)) {
      idx = Math.floor(hash3(j, i, tick + p.seed + 7) * ramp.length);
    }
    toneBase(ctx, x, y, w, h, col, 0.22);
    const ch = ramp[idx];
    if (!ch || ch === ' ') return;
    ctx.fillStyle = rgbCss(col);
    ctx.fillText(ch, x + w / 2, y + h / 2);
  }, LATIN_ASPECT);
}

/* ── Pixel art ────────────────────────────────────────────────────────── */

// The reference reconstruction — and the fallback when another renderer loses
// the picture: every cell is filled with the source region's average colour.
function drawPixel(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    ctx.fillStyle = rgbCss(mapColor(c[0], c[1], c[2], p.paletteObj));
    ctx.fillRect(x, y, w, h);
  });
}

/* ── Dither ───────────────────────────────────────────────────────────── */

function bayer(n) {
  if (n === 1) return [[0]];
  const h = n / 2;
  const prev = bayer(h);
  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < h; x++) {
      const v = prev[y][x] * 4;
      m[y][x] = v;
      m[y][x + h] = v + 2;
      m[y + h][x] = v + 3;
      m[y + h][x + h] = v + 1;
    }
  }
  return m;
}

const BAYER = { 2: bayer(2), 4: bayer(4), 8: bayer(8) };

const KERNELS = {
  floyd: { div: 16, taps: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]] },
  atkinson: { div: 8, taps: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]] },
  sierra: { div: 4, taps: [[1, 0, 2], [-1, 1, 1], [0, 1, 1]] },
  stucki: {
    div: 42,
    taps: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2], [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1]],
  },
  burkes: {
    div: 32,
    taps: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2]],
  },
};

function ditherPicker(p) {
  const pal = p.paletteObj;
  if (pal && pal.colors) return (r, g, b) => nearestColor(pal.colors, clamp255(r), clamp255(g), clamp255(b));
  const levels = [0, 85, 170, 255];
  const q = (v) => levels[Math.max(0, Math.min(3, Math.floor(clamp255(v) / 64)))];
  return (r, g, b) => [q(r), q(g), q(b)];
}

// Real error diffusion over the SOURCE pixels: edges, silhouettes and
// brightness all survive because the algorithm only decides which of the
// palette's colours each cell becomes.
function drawDither(ctx, src, W, H, p) {
  const cs = Math.max(1, p.cellSize);
  const cols = Math.max(1, Math.round(W / cs));
  const rows = Math.max(1, Math.round(H / cs));
  const bw = W / cols;
  const bh = H / rows;
  const bias = p.threshold - 128;
  const pick = ditherPicker(p);
  const algo = p.ditherAlgo || 'floyd';
  const out = new Float32Array(cols * rows * 3);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const c = cellAvg(src, i * bw, j * bh, bw, bh);
      const k = (j * cols + i) * 3;
      out[k] = c[0];
      out[k + 1] = c[1];
      out[k + 2] = c[2];
    }
  }

  const result = new Float32Array(cols * rows * 3);

  if (algo.startsWith('bayer')) {
    const n = Number(algo.replace('bayer', '')) || 4;
    const m = BAYER[n] || BAYER[4];
    const span = n * n;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 3;
        const th = (m[j % n][i % n] / span - 0.5) * 210;
        const c = pick(out[k] + bias + th, out[k + 1] + bias + th, out[k + 2] + bias + th);
        result[k] = c[0];
        result[k + 1] = c[1];
        result[k + 2] = c[2];
      }
    }
  } else {
    const { div, taps } = KERNELS[algo] || KERNELS.floyd;
    const buf = Float32Array.from(out);
    for (let j = 0; j < rows; j++) {
      const dir = j % 2 === 1 ? -1 : 1;
      for (let step = 0; step < cols; step++) {
        const i = dir === 1 ? step : cols - 1 - step;
        const k = (j * cols + i) * 3;
        const r = buf[k] + bias;
        const g = buf[k + 1] + bias;
        const b = buf[k + 2] + bias;
        const c = pick(r, g, b);
        result[k] = c[0];
        result[k + 1] = c[1];
        result[k + 2] = c[2];
        const er = r - c[0];
        const eg = g - c[1];
        const eb = b - c[2];
        for (let t = 0; t < taps.length; t++) {
          const nx = i + taps[t][0] * dir;
          const ny = j + taps[t][1];
          if (nx < 0 || nx >= cols || ny >= rows) continue;
          const nk = (ny * cols + nx) * 3;
          const wgt = taps[t][2] / div;
          buf[nk] += er * wgt;
          buf[nk + 1] += eg * wgt;
          buf[nk + 2] += eb * wgt;
        }
      }
    }
  }

  for (let j = 0; j < rows; j++) {
    const y0 = Math.floor((j * H) / rows);
    const y1 = Math.floor(((j + 1) * H) / rows);
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 3;
      const x0 = Math.floor((i * W) / cols);
      const x1 = Math.floor(((i + 1) * W) / cols);
      ctx.fillStyle = rgbCss([result[k], result[k + 1], result[k + 2]]);
      ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
    }
  }
}

/* ── Mosaic ───────────────────────────────────────────────────────────── */

// One tile per source cell, in that cell's colour, at that cell's position.
// Tiles shrink with Spacing and may tilt, but never move off their cell.
function drawMosaic(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const gap = Math.max(0, p.spacing);
  const rot = (p.rotation * Math.PI) / 180;
  ctx.fillStyle = plateFor(p, src);
  ctx.fillRect(0, 0, W, H);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    const tw = Math.max(1, w - gap);
    const th = Math.max(1, h - gap);
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (rot) ctx.rotate(rot);
    ctx.fillStyle = rgbCss(col);
    ctx.fillRect(-tw / 2, -th / 2, tw, th);
    ctx.fillStyle = `rgba(${lighten(col, 55).map(Math.round).join(',')},0.4)`;
    ctx.fillRect(-tw / 2, -th / 2, tw, Math.max(1, th * 0.22));
    ctx.restore();
  });
}

/* ── Dots ─────────────────────────────────────────────────────────────── */

// Halftone dots: the darker the source cell, the larger the dot. Dots sit at
// their own cell's centre and take that cell's colour, so they rebuild the
// picture rather than decorating it.
function drawDots(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const shape = p.dotShape || 'circle';
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  // On a dark ground the brighter cell gets the larger dot, so the marks build
  // the light instead of the shadow.
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const l = luma(c[0], c[1], c[2]);
    const cover = ink ? l / 255 : 1 - l / 255;
    const r = (cover * (Math.min(w, h) - Math.min(p.spacing, Math.min(w, h) - 1))) / 2;
    if (r < 0.4) return;
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    ctx.fillStyle = rgbCss(col);
    const cx = x + w / 2;
    const cy = y + h / 2;
    if (shape === 'square') {
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    } else if (shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/* ── Halftone ─────────────────────────────────────────────────────────── */

function halftonePass(ctx, src, W, H, cs, angle, p, channel, ink, invert) {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(-a);
  const sin = Math.sin(-a);
  const D = Math.hypot(W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(a);
  for (let y = -D / 2; y < D / 2; y += cs) {
    for (let x = -D / 2; x < D / 2; x += cs) {
      const sx = W / 2 + x * cos - y * sin;
      const sy = H / 2 + x * sin + y * cos;
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const c = cellAvg(src, sx, sy, cs, cs);
      const l = channel === 'lum' ? luma(c[0], c[1], c[2]) : c[channel];
      const r = ((invert ? l / 255 : 1 - l / 255) * cs * 0.74) / 2;
      if (r < 0.3) continue;
      ctx.fillStyle = ink === 'cell' ? rgbCss(mapColor(c[0], c[1], c[2], p.paletteObj)) : ink;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Print-style screens. Mono keeps the image's own colour in the dots; RGB uses
// real CMY screens multiplied together.
function drawHalftone(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  if (p.halftoneMode === 'rgb') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    halftonePass(ctx, src, W, H, cs, p.rotation, p, 0, '#00ffff');
    halftonePass(ctx, src, W, H, cs, p.rotation + 15, p, 1, '#ff00ff');
    halftonePass(ctx, src, W, H, cs, p.rotation + 30, p, 2, '#ffff00');
    ctx.globalCompositeOperation = 'source-over';
    return;
  }
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  halftonePass(ctx, src, W, H, cs, p.rotation, p, 'lum', 'cell', ink);
}

/* ── Crosshatch ───────────────────────────────────────────────────────── */

// Hatch marks are clipped INSIDE their own cell, so they can never join up
// into full-width lines across the picture.
function drawCrosshatch(ctx, src, W, H, p) {
  const cs = Math.max(4, p.cellSize);
  const angles = p.hatchAngles || [45, -45];
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    const d = ink ? luma(c[0], c[1], c[2]) / 255 : 1 - luma(c[0], c[1], c[2]) / 255;
    toneBase(ctx, x, y, w, h, col, 0.34);
    if (d < 0.06) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = rgbCss(col);
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.11);
    ctx.lineCap = 'round';
    ctx.globalAlpha = Math.min(1, 0.3 + d);
    const count = Math.max(1, Math.round(d * angles.length));
    const len = Math.hypot(w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;
    for (let k = 0; k < count; k++) {
      const a = (angles[k] * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx - (Math.cos(a) * len) / 2, cy - (Math.sin(a) * len) / 2);
      ctx.lineTo(cx + (Math.cos(a) * len) / 2, cy + (Math.sin(a) * len) / 2);
      ctx.stroke();
    }
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

/* ── LEGO ─────────────────────────────────────────────────────────────── */

function drawLego(ctx, src, W, H, p) {
  const cs = Math.max(4, p.cellSize);
  ctx.fillStyle = plateFor(p, src);
  ctx.fillRect(0, 0, W, H);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    ctx.fillStyle = rgbCss(col);
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
    ctx.fillStyle = `rgba(${lighten(col, 60).map(Math.round).join(',')},0.85)`;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w * 0.17, h * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ── Disco ────────────────────────────────────────────────────────────── */

// Glossy tiles: every sheen is built from the cell's own colour, so the tiles
// still read as the photograph.
function drawDisco(ctx, src, W, H, p) {
  const cs = Math.max(4, p.cellSize);
  ctx.fillStyle = plateFor(p, src);
  ctx.fillRect(0, 0, W, H);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    ctx.fillStyle = rgbCss(col);
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, `rgba(${lighten(col, 75).map(Math.round).join(',')},0.5)`);
    g.addColorStop(0.5, `rgba(${lighten(col, 20).map(Math.round).join(',')},0.1)`);
    g.addColorStop(1, `rgba(${darken(col, 0.5).map(Math.round).join(',')},0.45)`);
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
  });
}

/* ── Matrix ───────────────────────────────────────────────────────────── */

// Cell-locked glyph rain: the glyph for a cell is chosen by that cell's own
// brightness and it stays in that cell — only the character flickers.
function drawMatrix(ctx, src, W, H, p, t) {
  const cs = Math.max(4, p.cellSize);
  const ramp = (CHAR_SETS[p.charSet] || CHAR_SETS.matrix).chars;
  ctx.fillStyle = plateFor(p, src);
  ctx.fillRect(0, 0, W, H);
  const fs = Math.max(4, Math.round(cs * p.fontScale));
  ctx.font = `${fs}px ${MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tick = Math.floor(t * 8);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    const l = luma(c[0], c[1], c[2]);
    toneBase(ctx, x, y, w, h, col, 0.26);
    const flick = hash3(i, j, tick + p.seed);
    let idx = rampIndex(ramp, l);
    if (flick < 0.1 * (0.4 + p.jitter)) idx = Math.floor(hash3(j, i, tick + p.seed + 31) * ramp.length);
    const ch = ramp[idx];
    if (!ch || ch === ' ') return;
    ctx.globalAlpha = Math.min(1, 0.35 + (l / 255) * 0.65);
    ctx.fillStyle = rgbCss(col);
    ctx.fillText(ch, x + w / 2, y + h / 2);
  }, WIDE_ASPECT);
  ctx.globalAlpha = 1;
}

/* ── Mixed ────────────────────────────────────────────────────────────── */

// Two or three renderers stacked in bands. Each band is clipped to its own
// slice of the picture and reconstructs that slice with its own primitive.
function drawMixed(ctx, src, W, H, p, t) {
  const bands = p.bands && p.bands.length
    ? p.bands
    : [{ renderer: 'characters', from: 0, to: 0.5 }, { renderer: 'pixel', from: 0.5, to: 1 }];
  bands.forEach((band) => {
    const fn = RENDERERS[band.renderer] || drawCharacters;
    const y0 = Math.floor(band.from * H);
    const y1 = Math.ceil(band.to * H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y0, W, y1 - y0);
    ctx.clip();
    fn(ctx, src, W, H, { ...p, style: band.renderer }, t);
    ctx.restore();
  });
}

/* ── Diagonal ─────────────────────────────────────────────────────────── */

// Diagonal line art: one stroke per cell, thick where the cell is bright. Each
// stroke is clipped to its own cell and runs corner to corner, so neighbours
// line up into continuous hatching without ever leaving the grid.
function drawDiagonal(ctx, src, W, H, p) {
  const cs = Math.max(4, p.cellSize);
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  const a = ((45 + p.rotation) * Math.PI) / 180;
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const l = luma(c[0], c[1], c[2]);
    const cover = ink ? l / 255 : 1 - l / 255;
    if (cover < 0.05) return;
    const col = mapColor(c[0], c[1], c[2], p.paletteObj);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = rgbCss(col);
    ctx.lineWidth = Math.max(1, Math.min(w, h) * cover);
    const len = Math.hypot(w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.moveTo(cx - (Math.cos(a) * len) / 2, cy - (Math.sin(a) * len) / 2);
    ctx.lineTo(cx + (Math.cos(a) * len) / 2, cy + (Math.sin(a) * len) / 2);
    ctx.stroke();
    ctx.restore();
  });
}

/* ── Diamond ──────────────────────────────────────────────────────────── */

// A rhombus per cell, sized by the cell's brightness — the halftone idea with a
// diamond mark, so the picture reads as a diamond screen.
function drawDiamond(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  const rot = (p.rotation * Math.PI) / 180;
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const l = luma(c[0], c[1], c[2]);
    const cover = ink ? l / 255 : 1 - l / 255;
    const rx = (cover * (w - p.spacing)) / 2;
    const ry = (cover * (h - p.spacing)) / 2;
    if (rx < 0.4 || ry < 0.4) return;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (rot) ctx.rotate(rot);
    ctx.fillStyle = rgbCss(mapColor(c[0], c[1], c[2], p.paletteObj));
    ctx.beginPath();
    ctx.moveTo(0, -ry);
    ctx.lineTo(rx, 0);
    ctx.lineTo(0, ry);
    ctx.lineTo(-rx, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

/* ── Lines ────────────────────────────────────────────────────────────── */

// Horizontal line art: the cell's brightness sets the height of its rule, so the
// picture is rebuilt as stacked bars — a scanline screen that keeps the light.
function drawLines(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const l = luma(c[0], c[1], c[2]);
    const cover = ink ? l / 255 : 1 - l / 255;
    const bh = Math.max(1, cover * h * 0.85 - p.spacing);
    if (cover < 0.04) return;
    ctx.fillStyle = rgbCss(mapColor(c[0], c[1], c[2], p.paletteObj));
    ctx.fillRect(x, y + (h - bh) / 2, w, bh);
  });
}

/* ── dispatch ─────────────────────────────────────────────────────────── */

export const RENDERERS = {
  characters: drawCharacters,
  animatedAscii: drawCharacters,
  dither: drawDither,
  pixel: drawPixel,
  mosaic: drawMosaic,
  dots: drawDots,
  halftone: drawHalftone,
  crosshatch: drawCrosshatch,
  diagonal: drawDiagonal,
  diamond: drawDiamond,
  lines: drawLines,
  lego: drawLego,
  disco: drawDisco,
  matrix: drawMatrix,
  mixed: drawMixed,
};

export function drawStyle(ctx, src, W, H, p, t = 0) {
  const fn = RENDERERS[p.style] || drawPixel;
  fn(ctx, src, W, H, p, t);
}