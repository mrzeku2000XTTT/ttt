// GLYPH — the renderers. Each one reads the source pixels and rebuilds the
// image out of a different visual primitive. No AI, no server: plain canvas.

import { CHAR_SETS } from './glyphStyles';
import { luma, mapColor, nearestColor, plateColor, rgbCss } from './glyphPalettes';

/* ── sampling helpers ─────────────────────────────────────────────────── */

function cellAvg(src, x0, y0, w, h) {
  const sx = Math.max(0, Math.floor(x0));
  const sy = Math.max(0, Math.floor(y0));
  const x1 = Math.min(src.width, Math.max(sx + 1, Math.floor(x0 + w)));
  const y1 = Math.min(src.height, Math.max(sy + 1, Math.floor(y0 + h)));
  const stepX = Math.max(1, Math.floor((x1 - sx) / 7));
  const stepY = Math.max(1, Math.floor((y1 - sy) / 7));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = sy; y < y1; y += stepY) {
    for (let x = sx; x < x1; x += stepX) {
      const i = (y * src.width + x) * 4;
      r += src.data[i];
      g += src.data[i + 1];
      b += src.data[i + 2];
      n++;
    }
  }
  if (!n) return [0, 0, 0];
  return [r / n, g / n, b / n];
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

function rampIndex(ramp, l) {
  const i = Math.round((l / 255) * (ramp.length - 1));
  return Math.max(0, Math.min(ramp.length - 1, i));
}

/* ── Characters ───────────────────────────────────────────────────────── */

function drawCharacters(ctx, src, W, H, p, rng) {
  const cs = Math.max(2, p.cellSize);
  const ramp = (CHAR_SETS[p.charSet] || CHAR_SETS.classic).chars;
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  const fs = Math.max(4, Math.round(cs * p.fontScale));
  ctx.font = `${fs}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const flicker = p.style === 'animatedAscii';
  for (let y = 0; y < H; y += cs) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, cs);
      let idx = rampIndex(ramp, luma(c[0], c[1], c[2]));
      if (flicker && rng() < 0.05 * (0.4 + p.jitter * 1.6)) idx = Math.floor(rng() * ramp.length);
      const ch = ramp[idx];
      if (!ch || ch === ' ') continue;
      const col = mapColor(c[0], c[1], c[2], p.paletteObj);
      ctx.fillStyle = rgbCss(col);
      ctx.fillText(ch, x + cs / 2, y + cs / 2);
    }
  }
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

function drawDither(ctx, src, W, H, p) {
  const cs = Math.max(1, p.cellSize);
  const dw = Math.max(1, Math.round(W / cs));
  const dh = Math.max(1, Math.round(H / cs));
  const bw = W / dw;
  const bh = H / dh;
  const bias = p.threshold - 128;
  const pick = ditherPicker(p);
  const algo = p.ditherAlgo || 'floyd';
  const out = new Float32Array(dw * dh * 3);

  for (let j = 0; j < dh; j++) {
    for (let i = 0; i < dw; i++) {
      const c = cellAvg(src, i * bw, j * bh, bw, bh);
      const k = (j * dw + i) * 3;
      out[k] = c[0];
      out[k + 1] = c[1];
      out[k + 2] = c[2];
    }
  }

  const result = new Float32Array(dw * dh * 3);

  if (algo.startsWith('bayer')) {
    const n = Number(algo.replace('bayer', ''));
    const m = BAYER[n] || BAYER[4];
    const span = n * n;
    for (let j = 0; j < dh; j++) {
      for (let i = 0; i < dw; i++) {
        const k = (j * dw + i) * 3;
        const t = (m[j % n][i % n] / span - 0.5) * 210;
        const c = pick(out[k] + bias + t, out[k + 1] + bias + t, out[k + 2] + bias + t);
        result[k] = c[0];
        result[k + 1] = c[1];
        result[k + 2] = c[2];
      }
    }
  } else {
    const { div, taps } = KERNELS[algo] || KERNELS.floyd;
    const buf = Float32Array.from(out);
    for (let j = 0; j < dh; j++) {
      const dir = j % 2 === 1 ? -1 : 1;
      for (let step = 0; step < dw; step++) {
        const i = dir === 1 ? step : dw - 1 - step;
        const k = (j * dw + i) * 3;
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
          if (nx < 0 || nx >= dw || ny >= dh) continue;
          const nk = (ny * dw + nx) * 3;
          const w = taps[t][2] / div;
          buf[nk] += er * w;
          buf[nk + 1] += eg * w;
          buf[nk + 2] += eb * w;
        }
      }
    }
  }

  for (let j = 0; j < dh; j++) {
    for (let i = 0; i < dw; i++) {
      const k = (j * dw + i) * 3;
      ctx.fillStyle = rgbCss([result[k], result[k + 1], result[k + 2]]);
      const x0 = Math.floor(i * bw);
      const y0 = Math.floor(j * bh);
      ctx.fillRect(x0, y0, Math.ceil((i + 1) * bw) - x0 + 1, Math.ceil((j + 1) * bh) - y0 + 1);
    }
  }
}

/* ── Pixel art ────────────────────────────────────────────────────────── */

function drawPixel(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  for (let y = 0; y < H; y += cs) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, cs);
      const col = mapColor(c[0], c[1], c[2], p.paletteObj);
      ctx.fillStyle = rgbCss(col);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      ctx.fillRect(x0, y0, Math.ceil(x + cs) - x0 + 1, Math.ceil(y + cs) - y0 + 1);
    }
  }
}

/* ── Mosaic ───────────────────────────────────────────────────────────── */

function drawMosaic(ctx, src, W, H, p, rng) {
  const cs = Math.max(3, p.cellSize);
  const gap = p.spacing;
  const base = (p.rotation * Math.PI) / 180;
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += cs) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, cs);
      const col = mapColor(c[0], c[1], c[2], p.paletteObj);
      const rot = base + (rng() - 0.5) * 0.12 * (0.4 + p.jitter);
      const size = cs - gap;
      ctx.save();
      ctx.translate(x + cs / 2, y + cs / 2);
      ctx.rotate(rot);
      ctx.fillStyle = rgbCss(col);
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(-size / 2, -size / 2, size, size * 0.3);
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

/* ── Dots ─────────────────────────────────────────────────────────────── */

function drawDots(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  const shape = p.dotShape || 'circle';
  for (let y = 0; y < H; y += cs) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, cs);
      const l = luma(c[0], c[1], c[2]);
      const r = ((1 - l / 255) * (cs - p.spacing)) / 2;
      if (r < 0.4) continue;
      const col = mapColor(c[0], c[1], c[2], p.paletteObj);
      ctx.fillStyle = rgbCss(col);
      const cx = x + cs / 2;
      const cy = y + cs / 2;
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
    }
  }
}

/* ── Halftone ─────────────────────────────────────────────────────────── */

function halftonePass(ctx, src, W, H, cs, angle, ink, channel) {
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
      const r = ((1 - l / 255) * cs * 0.72) / 2;
      if (r < 0.3) continue;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHalftone(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  ctx.fillStyle = p.halftoneMode === 'rgb' ? '#ffffff' : plateColor(p);
  ctx.fillRect(0, 0, W, H);
  if (p.halftoneMode === 'rgb') {
    ctx.globalCompositeOperation = 'multiply';
    halftonePass(ctx, src, W, H, cs, p.rotation, '#00ffff', 0);
    halftonePass(ctx, src, W, H, cs, p.rotation + 15, '#ff00ff', 1);
    halftonePass(ctx, src, W, H, cs, p.rotation + 30, '#ffff00', 2);
    ctx.globalCompositeOperation = 'source-over';
    return;
  }
  const ink = p.paletteObj && p.paletteObj.colors ? rgbCss(p.paletteObj.colors[0]) : '#0a0a0a';
  halftonePass(ctx, src, W, H, cs, p.rotation, ink, 'lum');
}

/* ── Crosshatch ───────────────────────────────────────────────────────── */

function drawCrosshatch(ctx, src, W, H, p) {
  const cs = Math.max(4, p.cellSize);
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  const ink = p.paletteObj && p.paletteObj.colors ? rgbCss(p.paletteObj.colors[0]) : '#111111';
  const angles = p.hatchAngles || [45, -45];
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, cs * 0.09);
  ctx.lineCap = 'round';
  for (let y = 0; y < H; y += cs) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, cs);
      const d = 1 - luma(c[0], c[1], c[2]) / 255;
      if (d < 0.07) continue;
      const count = Math.max(1, Math.round(d * angles.length));
      const cx = x + cs / 2;
      const cy = y + cs / 2;
      const len = cs * 1.5;
      ctx.globalAlpha = Math.min(1, 0.25 + d);
      for (let i = 0; i < count; i++) {
        const a = (angles[i] * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * len, cy - Math.sin(a) * len);
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/* ── LEGO ─────────────────────────────────────────────────────────────── */

function drawLego(ctx, src, W, H, p) {
  const cs = Math.max(4, p.cellSize);
  const bh = cs * 0.82;
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += bh) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, bh);
      const col = mapColor(c[0], c[1], c[2], p.paletteObj);
      ctx.fillStyle = rgbCss(col);
      ctx.fillRect(x + 1, y + 1, cs - 2, bh - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.ellipse(x + cs / 2, y + bh / 2, cs * 0.18, cs * 0.18 * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(x + 1, y + bh - 3, cs - 2, 2);
    }
  }
}

/* ── Disco ────────────────────────────────────────────────────────────── */

function drawDisco(ctx, src, W, H, p, rng) {
  const cs = Math.max(4, p.cellSize);
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += cs) {
    for (let x = 0; x < W; x += cs) {
      const c = cellAvg(src, x, y, cs, cs);
      const col = mapColor(c[0], c[1], c[2], p.paletteObj).map((v) => Math.min(255, v * 1.25 + 12));
      ctx.fillStyle = rgbCss(col);
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      const a = rng() * Math.PI * 2;
      const g = ctx.createLinearGradient(x, y, x + Math.cos(a) * cs, y + Math.sin(a) * cs);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    }
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.5);
  const streak = ctx.createLinearGradient(-W, 0, W, 0);
  streak.addColorStop(0, 'rgba(255,255,255,0)');
  streak.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  streak.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = streak;
  ctx.fillRect(-W, -H * 0.16, W * 2, H * 0.32);
  ctx.restore();
}

/* ── Matrix ───────────────────────────────────────────────────────────── */

function drawMatrix(ctx, src, W, H, p, rng, t) {
  const cs = Math.max(4, p.cellSize);
  const ramp = (CHAR_SETS[p.charSet] || CHAR_SETS.matrix).chars;
  ctx.fillStyle = plateColor(p);
  ctx.fillRect(0, 0, W, H);
  const fs = Math.max(4, Math.round(cs * p.fontScale));
  ctx.font = `${fs}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const base = p.paletteObj && p.paletteObj.colors ? p.paletteObj.colors : [[51, 255, 102]];
  const speed = 40 + p.jitter * 160;
  const cols = Math.ceil(W / cs);
  for (let i = 0; i < cols; i++) {
    const head = ((t * speed * (0.6 + rng() * 0.8) + i * 53) % (H + 400)) - 200;
    for (let y = head - 340; y < head; y += cs) {
      const sy = Math.round(y);
      if (sy < 0 || sy >= H) continue;
      const c = cellAvg(src, i * cs, sy, cs, cs);
      const l = luma(c[0], c[1], c[2]);
      if (l < 30) continue;
      const fade = Math.max(0, 1 - (head - y) / 340);
      const idx = rampIndex(ramp, l);
      const col = base[Math.min(base.length - 1, Math.floor((l / 255) * base.length))];
      ctx.globalAlpha = Math.min(1, (l / 255) * 0.9 * (0.25 + fade * 0.75));
      ctx.fillStyle = rgbCss(col);
      ctx.fillText(ramp[idx], i * cs + cs / 2, sy + cs / 2);
    }
  }
  ctx.globalAlpha = 1;
}

/* ── Mixed ────────────────────────────────────────────────────────────── */

function drawMixed(ctx, src, W, H, p, rng, t) {
  const bands = p.bands && p.bands.length ? p.bands : [{ renderer: 'characters', from: 0, to: 0.5 }, { renderer: 'pixel', from: 0.5, to: 1 }];
  bands.forEach((band) => {
    const fn = RENDERERS[band.renderer] || drawCharacters;
    const y0 = Math.floor(band.from * H);
    const y1 = Math.ceil(band.to * H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y0, W, y1 - y0);
    ctx.clip();
    fn(ctx, src, W, H, { ...p, style: band.renderer }, rng, t);
    ctx.restore();
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
  lego: drawLego,
  disco: drawDisco,
  matrix: drawMatrix,
  mixed: drawMixed,
};

export function drawStyle(ctx, src, W, H, p, rng, t = 0) {
  const fn = RENDERERS[p.style] || drawCharacters;
  fn(ctx, src, W, H, p, rng, t);
}