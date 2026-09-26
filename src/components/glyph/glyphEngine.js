// GLYPH — engine. Loads the source, grades it, runs the chosen renderer and
// the effect stack, and exports the result. Everything happens locally.

import { drawStyle } from './glyphRenderers';
import { styleById } from './glyphStyles';

export const MAX_DIM = 1100;
export const MAX_DIM_ANIM = 640;
// Video is re-rendered every frame, so it works at a smaller size than a still.
export const MAX_DIM_VIDEO = 480;

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

// Downscale to a sane working resolution once — never stretch the source.
export function prepareSource(img, animated) {
  const max = animated ? MAX_DIM_ANIM : MAX_DIM;
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const scale = Math.min(1, max / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true;
  g.drawImage(img, 0, 0, w, h);
  return { width: w, height: h, imageData: g.getImageData(0, 0, w, h) };
}

// A video is sampled frame by frame into the same shape the renderers already
// expect, so every style works on moving pictures without changing.
export function createVideoSource(video) {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 360;
  const scale = Math.min(1, MAX_DIM_VIDEO / Math.max(vw, vh));
  const width = Math.max(1, Math.round(vw * scale));
  const height = Math.max(1, Math.round(vh * scale));
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true;
  let frame = 0;
  return {
    width,
    height,
    isVideo: true,
    // null until the element actually has pixels to give
    sample() {
      if (!video.videoWidth) return null;
      g.drawImage(video, 0, 0, width, height);
      frame += 1;
      return { width, height, imageData: g.getImageData(0, 0, width, height), frame };
    },
  };
}

/* brightness / contrast / saturation are applied once per render, not per cell */
let gradeCache = { key: '', data: null };

function graded(source, p, stamp = '') {
  const key = `${source.width}x${source.height}|${p.brightness}|${p.contrast}|${p.saturation}|${source.imageData.data[0]}|${source.imageData.data.length}|${stamp}`;
  if (gradeCache.key === key) return gradeCache.data;
  const src = source.imageData.data;
  const out = new Uint8ClampedArray(src.length);
  const b = p.brightness;
  const c = p.contrast;
  const s = p.saturation;
  for (let i = 0; i < src.length; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let bl = src[i + 2];
    if (s !== 1) {
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r = l + (r - l) * s;
      g = l + (g - l) * s;
      bl = l + (bl - l) * s;
    }
    out[i] = (r - 128) * c + 128 + b;
    out[i + 1] = (g - 128) * c + 128 + b;
    out[i + 2] = (bl - 128) * c + 128 + b;
    out[i + 3] = src[i + 3];
  }
  gradeCache = { key, data: out };
  return out;
}

export function isAnimated(params) {
  return !!styleById(params.style).animated;
}

// Two reusable offscreen canvases: a masked render needs a layer for the style
// and a layer for the picture underneath, and video would otherwise allocate
// both on every frame.
const scratch = {};

function scratchCanvas(key, w, h) {
  let c = scratch[key];
  if (!c) {
    c = document.createElement('canvas');
    scratch[key] = c;
  }
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

// `stamp` only matters for a moving source: two video frames can share a first
// pixel, so the grade cache needs a nudge to know it is looking at a new frame.
// `mask` (optional) is a canvas the size of the source: the style is only kept
// where the mask is opaque, and the graded picture shows through everywhere else.
export function renderTo(canvas, source, params, t = 0, stamp = '', mask = null) {
  if (!canvas || !source || !params) return;
  const W = source.width;
  const H = source.height;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.clearRect(0, 0, W, H);
  const data = graded(source, params, stamp);
  const src = { data, width: W, height: H };

  if (mask) {
    const styled = scratchCanvas('styled', W, H);
    const sctx = styled.getContext('2d');
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalAlpha = 1;
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, W, H);
    drawStyle(sctx, src, W, H, params, t);
    // keep only the painted region
    sctx.globalCompositeOperation = 'destination-in';
    sctx.drawImage(mask, 0, 0, W, H);
    sctx.globalCompositeOperation = 'source-over';

    const base = scratchCanvas('base', W, H);
    base.getContext('2d').putImageData(new ImageData(data, W, H), 0, 0);
    ctx.drawImage(base, 0, 0);
    ctx.drawImage(styled, 0, 0);
    return;
  }

  drawStyle(ctx, src, W, H, params, t);
}

/**
 * How closely a render still resembles its source: the graded source and the
 * canvas are each reduced to the same 24×24 luminance grid and correlated.
 * A reconstruction scores high (structure survived, whatever the palette);
 * a texture, noise field or over-eager effect scores near zero. Glyph uses
 * this to fall back to Pixel Art rather than show something unrecognisable.
 */
export function reconstructionFidelity(source, canvas, params) {
  const N = 24;
  const sd = graded(source, params);
  const cw = canvas.width;
  const ch = canvas.height;
  if (!cw || !ch) return 1;
  const cd = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cw, ch).data;

  const blockLuma = (data, w, h, i, j) => {
    const x0 = Math.floor((i * w) / N);
    const x1 = Math.max(x0 + 1, Math.floor(((i + 1) * w) / N));
    const y0 = Math.floor((j * h) / N);
    const y1 = Math.max(y0 + 1, Math.floor(((j + 1) * h) / N));
    const stepX = Math.max(1, Math.floor((x1 - x0) / 6));
    const stepY = Math.max(1, Math.floor((y1 - y0) / 6));
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y += stepY) {
      for (let x = x0; x < x1; x += stepX) {
        const p = (y * w + x) * 4;
        sum += 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
        n++;
      }
    }
    return n ? sum / n : 0;
  };

  const a = [];
  const b = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      a.push(blockLuma(sd, source.width, source.height, i, j));
      b.push(blockLuma(cd, cw, ch, i, j));
    }
  }
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  // A flat source has no structure to preserve, so nothing can be judged.
  if (va <= 0) return 1;
  if (vb <= 0) return 0;
  const r = cov / Math.sqrt(va * vb);
  return (Math.max(-1, Math.min(1, r)) + 1) / 2;
}

/* ── export ───────────────────────────────────────────────────────────── */

function scaleSource(source, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true;
  g.drawImage(source.imageData ? imageDataToCanvas(source.imageData) : null, 0, 0, w, h);
  return g.getImageData(0, 0, w, h);
}

function imageDataToCanvas(id) {
  const c = document.createElement('canvas');
  c.width = id.width;
  c.height = id.height;
  c.getContext('2d').putImageData(id, 0, 0);
  return c;
}

// Renders a still at 1× / 2× / 4×. Cell sizes scale too, so the extra
// resolution carries real detail instead of a blur.
export function renderStill(source, params, scale = 1, mask = null) {
  const w = Math.round(source.width * scale);
  const h = Math.round(source.height * scale);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  if (scale === 1) {
    renderTo(out, source, params, 0, '', mask);
    return out;
  }
  const scaled = { width: w, height: h, imageData: scaleSource(source, w, h) };
  const p = {
    ...params,
    cellSize: Math.max(1, params.cellSize * scale),
    spacing: params.spacing * scale,
  };
  renderTo(out, scaled, p, 0, '', mask);
  return out;
}

/**
 * Tune the render to the picture: a small search over cell size and contrast,
 * scored with the same fidelity measure the fallback uses. It runs on a reduced
 * copy so it stays quick, then the winning values are applied to the real
 * source. Brightness is neutralised, which is what keeps a look faithful.
 */
export function autoTune(source, params) {
  const max = 340;
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const small = scale === 1 ? source : { width: w, height: h, imageData: scaleSource(source, w, h) };
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const base = Math.max(3, Math.round(params.cellSize * scale));
  let best = null;
  for (const cm of [0.65, 0.85, 1.15]) {
    for (const contrast of [0.95, 1.05, 1.18]) {
      const cand = { ...params, cellSize: Math.max(3, Math.round(base * cm)), contrast, brightness: 0 };
      renderTo(canvas, small, cand, 0);
      const score = reconstructionFidelity(small, canvas, cand);
      if (!best || score > best.score) best = { score, cm, contrast };
    }
  }
  return {
    score: best.score,
    params: {
      ...params,
      cellSize: Math.max(2, Math.round(params.cellSize * best.cm)),
      contrast: best.contrast,
      brightness: 0,
    },
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function stillBlob(canvas, format) {
  const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, 0.95));
}

// Animated styles record a real WEBM straight off the canvas.
export function recordWebm(source, params, seconds = 4, fps = 24, mask = null) {
  return new Promise((resolve, reject) => {
    const c = document.createElement('canvas');
    c.width = source.width;
    c.height = source.height;
    if (typeof MediaRecorder === 'undefined' || typeof c.captureStream !== 'function') {
      reject(new Error('This browser cannot record video.'));
      return;
    }
    const stream = c.captureStream(fps);
    let rec;
    try {
      rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch (err) {
      reject(new Error('This browser cannot record video.'));
      return;
    }
    const chunks = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    rec.start();
    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      // a video source hands back a fresh frame each pass; a still is reused
      const frame = source.sample ? source.sample() : source;
      if (frame) renderTo(c, frame, params, t, source.sample ? `v${frame.frame}` : '', mask);
      if (t < seconds) requestAnimationFrame(loop);
      else rec.stop();
    };
    loop();
  });
}