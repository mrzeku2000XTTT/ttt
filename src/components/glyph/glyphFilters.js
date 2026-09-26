// GLYPH — the filter families: Distort, Blur & Focus, Glass, Glitch & Signal,
// Light & Color and Material & Texture.
//
// These still obey the one rule: every cell is filled from a region of the
// picture and drawn at that cell's own rect. What changes is WHICH region a cell
// reads — a warped, blurred, split, faceted or re-coloured one — never where the
// cell is drawn, so the aspect ratio and the picture itself always survive.

import { mapColor, rgbCss } from './glyphPalettes';
import {
  eachCell,
  px,
  pxWrap,
  cellAvg,
  areaAvg,
  dirAvg,
  hash3,
  groundFor,
  plateFor,
  lighten,
  darken,
  mix,
  css,
  luma,
  duoColors,
  lumaRamp,
  rampIndex,
} from './glyphSample';

/* ── shared bits ──────────────────────────────────────────────────────── */

const fill = (ctx, x, y, w, h, col) => {
  ctx.fillStyle = rgbCss(col);
  ctx.fillRect(x, y, w, h);
};

const tone = (p, c) => mapColor(c[0], c[1], c[2], p.paletteObj);

// A facet sheen built from the facet's own colour, so a glass tile still reads
// as the photograph underneath it.
function gloss(ctx, x, y, w, h, col, strength = 0.5, vertical = false) {
  if (strength <= 0) return;
  const g = ctx.createLinearGradient(x, y, vertical ? x : x + w, vertical ? y + h : y);
  g.addColorStop(0, css(lighten(col, 80), 0.42 * strength));
  g.addColorStop(0.5, css(col, 0));
  g.addColorStop(1, css(darken(col, 0.5), 0.38 * strength));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Nearest of a lattice of hashed seeds — the facet every glass family is built
// on. Returns the seed to sample from and how close the cell is to a facet edge.
function facetSeed(u, v, p, cells) {
  const gx = Math.floor(u * cells);
  const gy = Math.floor(v * cells);
  let d1 = 1e9;
  let d2 = 1e9;
  let best = [u, v];
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = gx + ox;
      const cy = gy + oy;
      const sx = (cx + 0.15 + hash3(cx, cy, p.seed) * 0.7) / cells;
      const sy = (cy + 0.15 + hash3(cx + 91, cy + 17, p.seed) * 0.7) / cells;
      const d = (sx - u) * (sx - u) + (sy - v) * (sy - v);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        best = [sx, sy];
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  const edge = Math.min(1, Math.max(0, (Math.sqrt(d2) - Math.sqrt(d1)) * cells * 1.6));
  return { at: best, edge };
}

/* ── Distort ──────────────────────────────────────────────────────────── */

// A warp changes where a cell READS from, never where it is drawn.
function warpUV(kind, u, v, p) {
  const cx = 0.5;
  const cy = 0.5;
  const dx = u - cx;
  const dy = v - cy;
  const amt = 0.3 + (p.jitter ?? 0.3) * 0.7;
  const r = Math.min(1, Math.hypot(dx, dy) * 2);
  switch (kind) {
    case 'pinch':
      return [cx + dx * (1 + amt * 1.1 * r * r), cy + dy * (1 + amt * 1.1 * r * r)];
    case 'spherize':
      return [cx + dx * (1 - amt * 0.62 * (1 - r * r)), cy + dy * (1 - amt * 0.62 * (1 - r * r))];
    case 'twirl': {
      const a = amt * 2.6 * (1 - r);
      const c = Math.cos(a);
      const s = Math.sin(a);
      return [cx + dx * c - dy * s, cy + dx * s + dy * c];
    }
    case 'shear':
      return [u + dy * amt * 1.2, v];
    case 'ripple': {
      const f = 0.06 * Math.max(4, p.cellSize) + 6;
      const o = 0.022 * amt;
      return [u + Math.sin(v * f + p.seed * 0.01) * o, v + Math.cos(u * f + p.seed * 0.013) * o];
    }
    case 'zigzag': {
      const n = 6 + Math.round((p.jitter ?? 0.3) * 16);
      const o = (Math.abs(((v * n) % 1) - 0.5) - 0.25) * 0.16 * amt;
      return [u + o, v];
    }
    case 'polar': {
      const a = Math.atan2(dy, dx);
      const rr = Math.hypot(dx, dy);
      return [0.5 + a / (Math.PI * 2), Math.min(0.999, rr * (1.7 + amt))];
    }
    case 'kaleidoscope': {
      const a = Math.atan2(dy, dx);
      const seg = (Math.PI * 2) / (4 + Math.round(amt * 5));
      const rr = Math.hypot(dx, dy);
      const m = Math.abs((((a % (seg * 2)) + seg * 2) % (seg * 2)) - seg);
      return [0.5 + Math.cos(m) * rr, 0.5 + Math.sin(m) * rr];
    }
    case 'droste': {
      const a = Math.atan2(dy, dx);
      const rr = Math.max(0.02, Math.hypot(dx, dy));
      const k = 1.85 - amt * 0.5;
      const s = Math.log(rr) / Math.log(k);
      return [0.5 + Math.cos(a + s * 0.85) * rr, 0.5 + Math.sin(a + s * 0.85) * rr];
    }
    default: {
      const n1 = hash3(Math.floor(u * 80), Math.floor(v * 80), p.seed);
      const n2 = hash3(Math.floor(u * 80) + 11, Math.floor(v * 80) + 5, p.seed);
      return [u + (n1 - 0.5) * 0.08 * amt, v + (n2 - 0.5) * 0.08 * amt];
    }
  }
}

function drawWarp(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const [u, v] = warpUV(p.style, (x + w / 2) / W, (y + h / 2) / H, p);
    fill(ctx, x, y, w, h, tone(p, pxWrap(src, u, v)));
  });
}

/* ── Blur & Focus ─────────────────────────────────────────────────────── */

function drawFocus(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  const style = p.style;
  const a = (p.rotation * Math.PI) / 180;
  const jitter = p.jitter ?? 0.3;

  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    let c;
    if (style === 'motionBlur') {
      const rad = Math.max(2, cs * (0.7 + jitter * 2.4));
      c = dirAvg(src, cx, cy, rad, Math.cos(a), Math.sin(a));
    } else if (style === 'tiltShift') {
      // A horizontal band stays sharp; everything away from it goes soft.
      const band = 0.16 + jitter * 0.32;
      const d = Math.abs(cy / H - 0.5);
      const soft = Math.max(0, (d - band) / Math.max(0.01, 0.5 - band));
      const rad = soft * cs * 2.6;
      c = rad > 0.7 ? areaAvg(src, cx, cy, rad) : cellAvg(src, x, y, w, h);
    } else if (style === 'radialBlur') {
      // Average along the ray from the centre, so the blur streaks outward.
      const dx = cx / W - 0.5;
      const dy = cy / H - 0.5;
      const len = Math.max(0.001, Math.hypot(dx, dy));
      const rad = cs * (0.6 + jitter * 2);
      c = dirAvg(src, cx, cy, rad, dx / len, dy / len);
    } else {
      const rad = Math.max(1, cs * (0.5 + jitter * 1.8));
      c = areaAvg(src, cx, cy, rad);
    }
    fill(ctx, x, y, w, h, tone(p, c));
  });
}

/* ── Glass ────────────────────────────────────────────────────────────── */

function drawGlass(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const style = p.style;
  const jitter = p.jitter ?? 0.3;
  const glass = [200, 226, 245];

  if (style === 'diamondGlass' || style === 'hexagon') {
    // Facet marks drawn inside their own cell, never crossing into a neighbour.
    const ground = groundFor(p, src);
    ctx.fillStyle = rgbCss(ground);
    ctx.fillRect(0, 0, W, H);
    const rot = (p.rotation * Math.PI) / 180;
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const col = tone(p, c);
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rot);
      ctx.beginPath();
      if (style === 'hexagon') {
        const r = Math.min(w, h) / 2;
        for (let k = 0; k < 6; k++) {
          const an = (Math.PI / 3) * k - Math.PI / 6;
          const px1 = Math.cos(an) * r;
          const py1 = Math.sin(an) * r;
          if (k === 0) ctx.moveTo(px1, py1);
          else ctx.lineTo(px1, py1);
        }
        ctx.closePath();
      } else {
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, 0);
        ctx.lineTo(0, h / 2);
        ctx.lineTo(-w / 2, 0);
        ctx.closePath();
      }
      ctx.fillStyle = rgbCss(col);
      ctx.fill();
      ctx.clip();
      gloss(ctx, -w / 2, -h / 2, w, h, col, 0.9);
      ctx.restore();
    });
    return;
  }

  if (style === 'seedyBubbles') {
    const ground = groundFor(p, src);
    ctx.fillStyle = rgbCss(ground);
    ctx.fillRect(0, 0, W, H);
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const u = (x + w / 2) / W;
      const v = (y + h / 2) / H;
      const cells = 3 + Math.round(jitter * 5);
      const { at, edge } = facetSeed(u, v, p, cells);
      const c = px(src, at[0] * (src.width - 1), at[1] * (src.height - 1));
      const col = mix(tone(p, c), glass, 0.18);
      fill(ctx, x, y, w, h, col);
      // the bubble's own rim, drawn only in the cells the rim passes through
      if (edge < 0.28) {
        ctx.fillStyle = css(lighten(col, 90), (0.28 - edge) * 1.6);
        ctx.fillRect(x, y, w, h);
      }
    });
    return;
  }

  if (style === 'iceCrackle' || style === 'crystallize') {
    const ground = groundFor(p, src);
    ctx.fillStyle = rgbCss(ground);
    ctx.fillRect(0, 0, W, H);
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const u = (x + w / 2) / W;
      const v = (y + h / 2) / H;
      const cells = 5 + Math.round(jitter * 9);
      const { at, edge } = facetSeed(u, v, p, cells);
      const c = px(src, at[0] * (src.width - 1), at[1] * (src.height - 1));
      let col = tone(p, c);
      if (style === 'crystallize') col = mix(col, [255, 255, 255], 0.12);
      fill(ctx, x, y, w, h, col);
      if (edge < 0.22) {
        ctx.fillStyle = css(lighten(col, 95), (0.22 - edge) * 2.2);
        ctx.fillRect(x, y, w, h);
      }
    });
    return;
  }

  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const u = cx / W;
    const v = cy / H;
    let c;
    let strength = 0.6;
    let vertical = false;

    switch (style) {
      case 'glassOrb': {
        const dx = u - 0.5;
        const dy = v - 0.5;
        const r = Math.min(1, Math.hypot(dx, dy) * 2);
        const k = 1 - 0.55 * (1 - r * r);
        c = pxWrap(src, 0.5 + dx * k, 0.5 + dy * k);
        strength = 0.5 + (1 - Math.abs(r - 0.85) * 3) * 0.5;
        break;
      }
      case 'flutedGlass': {
        const f = 0.05 + jitter * 0.25;
        const o = Math.sin(u * f * 40 + p.seed * 0.01) * 0.03 * (0.5 + jitter);
        c = pxWrap(src, u + o, v);
        vertical = true;
        break;
      }
      case 'crossReeded': {
        const o = 0.022 * (0.5 + jitter);
        c = pxWrap(src, u + Math.sin(v * 26) * o, v + Math.cos(u * 26) * o);
        break;
      }
      case 'hammered': {
        const n1 = hash3(Math.floor(u * 60), Math.floor(v * 60), p.seed);
        const n2 = hash3(Math.floor(u * 60) + 7, Math.floor(v * 60) + 3, p.seed);
        c = pxWrap(src, u + (n1 - 0.5) * 0.05, v + (n2 - 0.5) * 0.05);
        strength = 0.9;
        break;
      }
      case 'shatter': {
        const { at } = facetSeed(u, v, p, 4 + Math.round(jitter * 6));
        c = px(src, at[0] * (src.width - 1), at[1] * (src.height - 1));
        break;
      }
      case 'rippleGlass': {
        const r = Math.hypot(u - 0.5, v - 0.5);
        const o = Math.sin(r * 60 + p.seed * 0.01) * 0.012 * (0.5 + jitter * 2);
        const len = Math.max(0.001, r);
        c = pxWrap(src, u + ((u - 0.5) / len) * o, v + ((v - 0.5) / len) * o);
        break;
      }
      case 'chevronPrism': {
        const o = (Math.abs(((v * 8 + u * 0.5) % 1) - 0.5) - 0.25) * 0.09;
        c = pxWrap(src, u + o, v);
        break;
      }
      case 'glassPixel': {
        const n = hash3(i, j, p.seed);
        c = pxWrap(src, u + (n - 0.5) * 0.012, v + (n - 0.5) * 0.012);
        strength = 0.8;
        break;
      }
      case 'jello': {
        const o = 0.02 * (0.5 + jitter * 2);
        c = pxWrap(src, u + Math.sin(v * 9 + p.seed * 0.02) * o, v + Math.cos(u * 9 + p.seed * 0.02) * o);
        break;
      }
      case 'vitrine': {
        c = areaAvg(src, cx, cy, cs * (0.3 + jitter * 0.5));
        strength = 0.75;
        break;
      }
      case 'tintedGlass': {
        c = mix(cellAvg(src, x, y, w, h), glass, 0.34);
        strength = 0.5;
        break;
      }
      default: {
        // frosted glass: the picture is still there, just softly diffused
        c = areaAvg(src, cx, cy, Math.max(1, cs * (0.4 + jitter * 0.9)));
        strength = 0.35;
      }
    }
    const col = tone(p, c);
    fill(ctx, x, y, w, h, col);
    gloss(ctx, x, y, w, h, col, strength, vertical);
  });
}

/* ── Glitch & Signal ──────────────────────────────────────────────────── */

function drawSignal(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  const style = p.style;
  const jitter = p.jitter ?? 0.3;

  if (style === 'pixelSort') {
    const cols = Math.max(1, Math.round(W / cs));
    const rows = Math.max(1, Math.round(H / cs));
    const bw = W / cols;
    const bh = H / rows;
    const run = Math.max(3, Math.round(3 + jitter * 22));
    for (let j = 0; j < rows; j++) {
      const line = [];
      for (let i = 0; i < cols; i++) {
        const c = cellAvg(src, i * bw, j * bh, bw, bh);
        line.push({ c, l: luma(c[0], c[1], c[2]) });
      }
      const y0 = Math.floor((j * H) / rows);
      const y1 = Math.floor(((j + 1) * H) / rows);
      for (let i = 0; i < cols; i += run) {
        const slice = line.slice(i, i + run);
        const lit = slice.filter((s) => s.l > 60).sort((a, b) => a.l - b.l);
        let k = 0;
        for (let n = 0; n < slice.length; n++) if (slice[n].l > 60) slice[n] = lit[k++];
        for (let n = 0; n < slice.length; n++) {
          const x0 = Math.floor(((i + n) * W) / cols);
          const x1 = Math.floor(((i + n + 1) * W) / cols);
          fill(ctx, x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0), tone(p, slice[n].c));
        }
      }
    }
    return;
  }

  if (style === 'forensics' || style === 'edgeGlow') {
    // Sobel over the cell grid: only edges survive, so the picture reads as a
    // technical read-out of itself.
    const cols = Math.max(1, Math.round(W / cs));
    const rows = Math.max(1, Math.round(H / cs));
    const bw = W / cols;
    const bh = H / rows;
    const g = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const c = cellAvg(src, i * bw, j * bh, bw, bh);
        g[j * cols + i] = luma(c[0], c[1], c[2]);
      }
    }
    const [dark, light] = duoColors(p);
    ctx.fillStyle = rgbCss(style === 'edgeGlow' ? darken(dark, 0.6) : dark);
    ctx.fillRect(0, 0, W, H);
    const at = (x, y) => g[Math.max(0, Math.min(rows - 1, y)) * cols + Math.max(0, Math.min(cols - 1, x))];
    const boost = 1 + jitter * 2;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const gx = at(i - 1, j - 1) + 2 * at(i - 1, j) + at(i - 1, j + 1) - (at(i + 1, j - 1) + 2 * at(i + 1, j) + at(i + 1, j + 1));
        const gy = at(i - 1, j - 1) + 2 * at(i, j - 1) + at(i + 1, j - 1) - (at(i - 1, j + 1) + 2 * at(i, j + 1) + at(i + 1, j + 1));
        const m = Math.min(1, (Math.hypot(gx, gy) / 300) * boost);
        if (m < 0.06) continue;
        const x0 = Math.floor((i * W) / cols);
        const x1 = Math.floor(((i + 1) * W) / cols);
        const y0 = Math.floor((j * H) / rows);
        const y1 = Math.floor(((j + 1) * H) / rows);
        const col = style === 'edgeGlow' ? mix(light, lighten(light, 20), m) : mix(dark, light, m);
        ctx.fillStyle = css(col, style === 'edgeGlow' ? Math.min(1, 0.2 + m) : Math.min(1, 0.3 + m));
        ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
      }
    }
    return;
  }

  if (style === 'thermal') {
    // A heat ramp, from the cell's own luminance — the picture read as a sensor.
    const ramp = [[10, 12, 40], [40, 60, 180], [200, 60, 90], [255, 160, 40], [255, 250, 200]];
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const l = luma(c[0], c[1], c[2]);
      const t = Math.max(0, Math.min(1, (l - 40) / 190));
      const f = t * (ramp.length - 1);
      const a = ramp[Math.floor(f)];
      const b = ramp[Math.min(ramp.length - 1, Math.floor(f) + 1)];
      fill(ctx, x, y, w, h, mix(a, b, f - Math.floor(f)));
    });
    return;
  }

  if (style === 'scanline' || style === 'crtScreen') {
    const ground = groundFor(p, src);
    ctx.fillStyle = rgbCss(ground);
    ctx.fillRect(0, 0, W, H);
    const period = Math.max(2, Math.round(cs * (style === 'crtScreen' ? 0.5 : 0.45)));
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const col = tone(p, c);
      const row = Math.round((y + h / 2) / period);
      const dark = row % 2 === 0 ? 0.72 : 1;
      fill(ctx, x, y, w, h, darken(col, 1 - dark));
      if (style === 'crtScreen') {
        // phosphor triads, one stripe per third of the cell
        const stripe = w / 3;
        const tint = [[255, 60, 60], [60, 255, 90], [70, 90, 255]];
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = css(tint[k], 0.1);
          ctx.fillRect(x + k * stripe, y, Math.max(1, stripe), h);
        }
      }
    });
    return;
  }

  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    let c;
    switch (style) {
      case 'rgbSplit': {
        const off = (1 + jitter * 5) * cs * 0.35;
        const r = px(src, cx + off, cy);
        const g = px(src, cx, cy);
        const b = px(src, cx - off, cy);
        c = [r[0], g[1], b[2]];
        break;
      }
      case 'aberration': {
        const d = Math.hypot(cx / W - 0.5, cy / H - 0.5) * 2;
        const off = (0.4 + d) * (1 + jitter * 4) * cs * 0.3;
        const r = px(src, cx + off, cy);
        const g = areaAvg(src, cx, cy, off * 0.4);
        const b = px(src, cx - off, cy);
        c = [r[0], g[1], b[2]];
        break;
      }
      case 'datamosh': {
        const row = j;
        const shift = (hash3(row, 0, p.seed) - 0.5) * W * 0.12 * (0.4 + jitter);
        c = px(src, cx + shift, cy);
        break;
      }
      case 'digitalDistortion': {
        const block = 2 + Math.round(jitter * 4);
        const bx = Math.floor(i / block);
        const by = Math.floor(j / block);
        const dx = (hash3(bx, by, p.seed) - 0.5) * cs * 6 * (0.4 + jitter);
        const dy = (hash3(bx + 5, by + 9, p.seed) - 0.5) * cs * 4 * (0.4 + jitter);
        c = px(src, cx + dx, cy + dy);
        break;
      }
      case 'lofi': {
        const c0 = cellAvg(src, x, y, w, h);
        const lv = 4;
        const q = (v) => Math.round((v / 255) * lv) * (255 / lv);
        const n = (hash3(i, j, p.seed) - 0.5) * 22 * (0.4 + jitter * 2);
        c = [q(c0[0]) + n, q(c0[1]) + n, q(c0[2]) + n];
        break;
      }
      case 'beacon': {
        const c0 = cellAvg(src, x, y, w, h);
        const l = luma(c0[0], c0[1], c0[2]);
        const hot = l > 210 - jitter * 90;
        c = hot ? lighten(c0, 70) : c0;
        break;
      }
      default:
        c = cellAvg(src, x, y, w, h);
    }
    const col = tone(p, c);
    fill(ctx, x, y, w, h, col);
    if (style === 'beacon' && luma(c[0], c[1], c[2]) > 225) {
      ctx.fillStyle = css(lighten(col, 40), 0.3);
      ctx.fillRect(x - w * 0.4, y - h * 0.4, w * 1.8, h * 1.8);
      fill(ctx, x, y, w, h, col);
    }
  });
}

/* ── Light & Color ────────────────────────────────────────────────────── */

function drawColorway(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  const style = p.style;
  const jitter = p.jitter ?? 0.3;

  if (style === 'duotone' || style === 'gradientMap' || style === 'chrome' || style === 'thinFilm') {
    const [dark, light] = duoColors(p);
    const ramp = lumaRamp(p);
    const chrome = [[12, 14, 20], [90, 100, 120], [245, 250, 255], [120, 130, 150], [40, 46, 60]];
    const film = [[60, 20, 120], [40, 120, 190], [90, 220, 190], [250, 220, 120], [240, 120, 190]];
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const l = luma(c[0], c[1], c[2]);
      let col;
      if (style === 'duotone') col = mix(dark, light, l / 255);
      else if (style === 'gradientMap') col = ramp[rampIndex(ramp, l)];
      else {
        const table = style === 'chrome' ? chrome : film;
        const f = (l / 255) * (table.length - 1);
        const a = table[Math.floor(f)];
        const b = table[Math.min(table.length - 1, Math.floor(f) + 1)];
        col = mix(a, b, f - Math.floor(f));
      }
      fill(ctx, x, y, w, h, col);
    });
    return;
  }

  if (style === 'prism') {
    // Channels fan out around the cell, so colour separates at the edges.
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const off = (1 + jitter * 4) * cs * 0.4;
      const r = px(src, cx + off, cy + off);
      const g = px(src, cx - off, cy + off * 0.4);
      const b = px(src, cx, cy - off);
      fill(ctx, x, y, w, h, [r[0], g[1], b[2]]);
    });
    return;
  }

  if (style === 'anaglyph3d') {
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const off = (0.6 + jitter * 3) * cs * 0.5;
      const l = px(src, cx - off, cy);
      const r = px(src, cx + off, cy);
      fill(ctx, x, y, w, h, [r[0], l[1], l[2]]);
    });
    return;
  }

  if (style === 'lightWind') {
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = dirAvg(src, x + w / 2, y + h / 2, cs * (1 + jitter * 4), 1, 0.12);
      const l = luma(c[0], c[1], c[2]);
      fill(ctx, x, y, w, h, lighten(c, l > 140 ? 26 : 6));
    });
    return;
  }

  if (style === 'dreamdust' || style === 'warpbloom') {
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const soft = areaAvg(src, cx, cy, Math.max(1, cs * (style === 'dreamdust' ? 0.9 : 0.6)));
      const sharp = cellAvg(src, x, y, w, h);
      const l = luma(sharp[0], sharp[1], sharp[2]);
      const bloom = Math.max(0, (l - 175) / 80) * (0.5 + jitter);
      fill(ctx, x, y, w, h, lighten(soft, bloom * 90));
      if (bloom > 0.1 && hash3(i, j, p.seed) < 0.06 + bloom * 0.1) {
        ctx.fillStyle = css([255, 255, 255], 0.5);
        ctx.fillRect(x + w * 0.35, y + h * 0.35, Math.max(1, w * 0.3), Math.max(1, h * 0.3));
      }
    });
    return;
  }

  // neonGrid — the picture in cells, with the grid itself lit over the top.
  const accent = p.paletteObj && p.paletteObj.colors ? lighten(p.paletteObj.colors[p.paletteObj.colors.length - 1], 30) : [120, 240, 255];
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    fill(ctx, x, y, w, h, darken(tone(p, cellAvg(src, x, y, w, h)), 0.35));
  });
  const line = Math.max(1, Math.round(cs * 0.09));
  ctx.fillStyle = css(accent, 0.5);
  for (let x = 0; x < W; x += cs) ctx.fillRect(x, 0, line, H);
  for (let y = 0; y < H; y += cs) ctx.fillRect(0, y, W, line);
}

/* ── Material & Texture ───────────────────────────────────────────────── */

function drawMaterial(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  const style = p.style;
  const jitter = p.jitter ?? 0.3;

  if (style === 'waves') {
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const u = (x + w / 2) / W;
      const v = (y + h / 2) / H;
      const o = Math.sin(v * 18 + p.seed * 0.01) * 0.03 * (0.5 + jitter * 2);
      const c = pxWrap(src, u + o, v + Math.cos(u * 14) * 0.012);
      const col = tone(p, c);
      fill(ctx, x, y, w, h, col);
      gloss(ctx, x, y, w, h, col, 0.5);
    });
    return;
  }

  if (style === 'marble') {
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const u = (x + w / 2) / W;
      const v = (y + h / 2) / H;
      // turbulent veins: two octaves of hashed noise displace the read
      const n1 = hash3(Math.floor(u * 26), Math.floor(v * 26), p.seed) - 0.5;
      const n2 = hash3(Math.floor(u * 90), Math.floor(v * 90), p.seed + 3) - 0.5;
      const c = pxWrap(src, u + (n1 + n2 * 0.4) * 0.09 * (0.6 + jitter * 2), v);
      const l = luma(c[0], c[1], c[2]);
      fill(ctx, x, y, w, h, mix(tone(p, c), [250, 248, 244], Math.max(0, (l - 150) / 300)));
    });
    return;
  }

  if (style === 'emboss') {
    const cols = Math.max(1, Math.round(W / cs));
    const rows = Math.max(1, Math.round(H / cs));
    const bw = W / cols;
    const bh = H / rows;
    const g = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const c = cellAvg(src, i * bw, j * bh, bw, bh);
        g[j * cols + i] = luma(c[0], c[1], c[2]);
      }
    }
    const at = (x, y) => g[Math.max(0, Math.min(rows - 1, y)) * cols + Math.max(0, Math.min(cols - 1, x))];
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const d = (at(i - 1, j - 1) + at(i - 1, j) + at(i, j - 1)) / 3 - (at(i + 1, j + 1) + at(i + 1, j) + at(i, j + 1)) / 3;
      const v = 128 + d * (1.4 + jitter * 3);
      fill(ctx, x, y, w, h, [v, v, v]);
    });
    return;
  }

  if (style === 'oilPaint' || style === 'watercolor') {
    const spread = style === 'oilPaint' ? 0.6 + jitter * 1.4 : 1 + jitter * 2.2;
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const n = hash3(i, j, p.seed);
      const c = areaAvg(src, cx + (n - 0.5) * cs * spread, cy + (hash3(j, i, p.seed) - 0.5) * cs * spread, Math.max(1, cs * spread));
      let col = tone(p, c);
      if (style === 'oilPaint') col = mix(col, lighten(col, 45), n * 0.35);
      else col = mix(col, [252, 250, 245], 0.18 + (1 - luma(c[0], c[1], c[2]) / 255) * 0.2);
      fill(ctx, x, y, w, h, col);
    });
    return;
  }

  if (style === 'moltenMetal') {
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const l = luma(c[0], c[1], c[2]);
      const t = Math.max(0, Math.min(1, (l - 90) / 150));
      const col = mix([40, 22, 14], [255, 210, 110], t);
      fill(ctx, x, y, w, h, col);
      if (t > 0.55) gloss(ctx, x, y, w, h, lighten(col, 30), t * 0.8);
    });
    return;
  }

  // waves fallback is never reached; keep a plain reconstruction for safety
  eachCell(W, H, cs, (i, j, x, y, w, h) => fill(ctx, x, y, w, h, tone(p, cellAvg(src, x, y, w, h))));
}

/* ── dispatch ─────────────────────────────────────────────────────────── */

const WARP = new Set(['smudge', 'pinch', 'spherize', 'twirl', 'zigzag', 'ripple', 'polar', 'shear', 'kaleidoscope', 'droste']);
const FOCUS = new Set(['motionBlur', 'tiltShift', 'gaussianBlur', 'radialBlur']);
const GLASS = new Set([
  'frostedGlass', 'tintedGlass', 'shatter', 'vitrine', 'glassOrb', 'flutedGlass', 'crossReeded',
  'hammered', 'diamondGlass', 'hexagon', 'rippleGlass', 'iceCrackle', 'chevronPrism', 'seedyBubbles',
  'glassPixel', 'jello', 'crystallize',
]);
const SIGNAL = new Set([
  'crtScreen', 'pixelSort', 'forensics', 'digitalDistortion', 'datamosh', 'lofi', 'rgbSplit',
  'scanline', 'thermal', 'beacon',
]);
const COLORWAY = new Set([
  'anaglyph3d', 'gradientMap', 'prism', 'dreamdust', 'lightWind', 'warpbloom', 'duotone',
  'edgeGlow', 'aberration', 'neonGrid', 'chrome', 'thinFilm',
]);
const MATERIAL = new Set(['waves', 'oilPaint', 'watercolor', 'marble', 'moltenMetal', 'emboss']);

export const FILTER_STYLES = new Set([...WARP, ...FOCUS, ...GLASS, ...SIGNAL, ...COLORWAY, ...MATERIAL]);

export function drawFilter(ctx, src, W, H, p, t) {
  const s = p.style;
  if (WARP.has(s)) return drawWarp(ctx, src, W, H, p);
  if (FOCUS.has(s)) return drawFocus(ctx, src, W, H, p);
  if (GLASS.has(s)) return drawGlass(ctx, src, W, H, p);
  if (SIGNAL.has(s)) return drawSignal(ctx, src, W, H, p);
  if (COLORWAY.has(s)) return drawColorway(ctx, src, W, H, p);
  return drawMaterial(ctx, src, W, H, p);
}