// GLYPH — the mark families: Print & Paper, Geometric, the character sets and
// the block/tile renderers.
//
// Same rule as every other family: one primitive per source cell, drawn at that
// cell's own rect, toned and coloured from the region of the picture it stands
// for. Nothing here invents a pattern or covers the reconstruction.

import { mapColor, rgbCss } from './glyphPalettes';
import { CHAR_SETS } from './glyphStyles';
import {
  eachCell,
  cellAvg,
  hash3,
  groundFor,
  lighten,
  darken,
  mix,
  css,
  luma,
  duoColors,
  lumaRamp,
  rampIndex,
  toneBase,
  MONO_FONT,
  LATIN_FONT,
  WIDE_ASPECT,
} from './glyphSample';

const fill = (ctx, x, y, w, h, col) => {
  ctx.fillStyle = rgbCss(col);
  ctx.fillRect(x, y, w, h);
};

const tone = (p, c) => mapColor(c[0], c[1], c[2], p.paletteObj);

/* ── characters ───────────────────────────────────────────────────────── */

// Bright source → dense mark, dark source → sparse one, drawn in the cell's own
// colour at the cell's own position.
function drawText(ctx, src, W, H, p, chars, aspect) {
  const cs = Math.max(2, p.cellSize);
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;
  const fs = Math.max(4, cs * LATIN_FONT * (p.fontScale || 1));
  ctx.font = `${fs}px ${MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  eachCell(
    W,
    H,
    cs,
    (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const l = luma(c[0], c[1], c[2]);
      const col = tone(p, c);
      const idx = rampIndex(chars, ink ? 255 - l : l);
      toneBase(ctx, x, y, w, h, col, 0.22);
      const ch = chars[idx];
      if (!ch || ch === ' ') return;
      ctx.fillStyle = rgbCss(col);
      ctx.fillText(ch, x + w / 2, y + h / 2);
    },
    aspect,
  );
}

/* ── Print & Paper ────────────────────────────────────────────────────── */

// The local luminance grid the paper and geometric families read from.
function lumaGrid(src, cols, rows, W, H) {
  const bw = W / cols;
  const bh = H / rows;
  const g = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const c = cellAvg(src, i * bw, j * bh, bw, bh);
      g[j * cols + i] = luma(c[0], c[1], c[2]);
    }
  }
  return g;
}

function drawPrint(ctx, src, W, H, p) {
  const cs = Math.max(2, p.cellSize);
  const style = p.style;
  const jitter = p.jitter ?? 0.3;
  const [dark, light] = duoColors(p);
  const ramp = lumaRamp(p);

  if (style === 'posterize' || style === 'warhol') {
    const levels = style === 'warhol' ? 4 : 5 + Math.round(jitter * 3);
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const l = luma(c[0], c[1], c[2]);
      const q = Math.round((l / 255) * (levels - 1)) / (levels - 1);
      const col = style === 'warhol' ? ramp[rampIndex(ramp, q * 255)] : mix(dark, light, q);
      fill(ctx, x, y, w, h, style === 'warhol' ? lighten(col, q * 40) : col);
    });
    return;
  }

  if (style === 'cyanotype') {
    const blue = [22, 60, 120];
    const paper = [228, 238, 248];
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const l = luma(c[0], c[1], c[2]);
      const t = 1 - l / 255;
      const grain = (hash3(i, j, p.seed) - 0.5) * 0.12 * (0.4 + jitter);
      fill(ctx, x, y, w, h, mix(paper, blue, Math.max(0, Math.min(1, t + grain))));
    });
    return;
  }

  if (style === 'risograph') {
    // Two ink passes with a slight misregistration, multiplied together.
    const inkA = ramp[0];
    const inkB = ramp[ramp.length - 1];
    const off = Math.max(1, cs * 0.18 * (0.5 + jitter));
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const a = cellAvg(src, x, y, w, h);
      const b = cellAvg(src, x + off, y + off, w, h);
      const la = luma(a[0], a[1], a[2]);
      const lb = luma(b[0], b[1], b[2]);
      const dither = ((i + j) % 2 === 0 ? 1 : 0) * 24;
      fill(ctx, x, y, w, h, [250, 248, 244]);
      if (la < 170 + dither) {
        ctx.fillStyle = css(inkA, 0.72);
        ctx.fillRect(x, y, w, h);
      }
      if (lb < 150 + dither) {
        ctx.fillStyle = css(inkB, 0.55);
        ctx.fillRect(x, y, w, h);
      }
    });
    return;
  }

  if (style === 'cmykDrops') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    const screens = [[0, '#00ffff'], [15, '#ff00ff'], [30, '#ffff00']];
    screens.forEach(([ang, ink]) => {
      const a = (ang * Math.PI) / 180;
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
          const ch = ink === '#00ffff' ? 0 : ink === '#ff00ff' ? 1 : 2;
          const r = ((1 - c[ch] / 255) * cs * 0.8) / 2;
          if (r < 0.4) continue;
          ctx.fillStyle = ink;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  const ground = groundFor(p, src);
  const paper = [246, 243, 236];
  ctx.fillStyle = style === 'sketch' || style === 'engraving' || style === 'stippling' ? rgbCss(paper) : rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const inkDark = style === 'sketch' || style === 'engraving' || style === 'stippling';

  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const l = luma(c[0], c[1], c[2]);
    const col = inkDark ? mix([40, 38, 44], [230, 228, 224], 0.15) : tone(p, c);
    const d = inkDark ? 1 - l / 255 : Math.abs(l - 128) / 128;

    if (style === 'stippling' || style === 'mezzotint' || style === 'pointillize') {
      const dense = style === 'pointillize' ? 12 : style === 'mezzotint' ? 9 : 6;
      const count = Math.max(0, Math.round((1 - l / 255) * dense));
      for (let k = 0; k < count; k++) {
        const nx = hash3(i * 13 + k, j * 7, p.seed);
        const ny = hash3(j * 11 + k, i * 5, p.seed + 2);
        const r = style === 'pointillize' ? Math.max(0.6, cs * 0.09) : Math.max(0.5, cs * 0.055 * (0.6 + jitter));
        ctx.fillStyle = rgbCss(style === 'pointillize' ? tone(p, c) : col);
        ctx.beginPath();
        ctx.arc(x + nx * w, y + ny * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (style === 'engraving') {
      // Parallel curved rules, thicker where the picture is dark.
      const lines = 3 + Math.round((1 - l / 255) * 4);
      const step = h / (lines + 1);
      ctx.strokeStyle = rgbCss(col);
      ctx.lineWidth = Math.max(0.7, cs * 0.05 * (0.5 + (1 - l / 255)));
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      for (let k = 1; k <= lines; k++) {
        const yy = y + k * step;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + w / 2, yy + Math.sin(i * 0.7 + k) * h * 0.09, x + w, yy);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (style === 'woodblock') {
      // One carved block per cell, its ink weight set by the cell's tone.
      const inset = Math.max(1, cs * 0.08 * (0.5 + jitter));
      ctx.fillStyle = rgbCss(col);
      ctx.beginPath();
      const r = Math.min(w, h) * 0.16;
      const bx = x + inset;
      const by = y + inset;
      const bw = Math.max(1, w - inset * 2);
      const bh = Math.max(1, h - inset * 2);
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
      ctx.arcTo(bx, by + bh, bx, by, r);
      ctx.arcTo(bx, by, bx + bw, by, r);
      ctx.fill();
      ctx.fillStyle = css(darken(col, 0.45), 0.35);
      ctx.fillRect(bx, by + bh - Math.max(1, bh * 0.18), bw, Math.max(1, bh * 0.18));
      return;
    }

    if (style === 'comic') {
      // Flat plate, a sized dot, and a hard edge where the picture turns.
      fill(ctx, x, y, w, h, mix(paper, tone(p, c), 0.35));
      const r = ((1 - l / 255) * Math.min(w, h) * 0.8) / 2;
      if (r > 0.4) {
        ctx.fillStyle = rgbCss(darken(tone(p, c), 0.3));
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const right = luma(...cellAvg(src, x + w, y, w, h));
      if (Math.abs(l - right) > 26) {
        ctx.fillStyle = css([24, 22, 26], 0.75);
        ctx.fillRect(x + w - Math.max(1, cs * 0.08), y, Math.max(1, cs * 0.08), h);
      }
      return;
    }

    // sketch — jittered hatch clipped inside its own cell
    toneBase(ctx, x, y, w, h, tone(p, c), 0.16);
    if (d < 0.05) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = rgbCss(col);
    ctx.lineWidth = Math.max(0.6, cs * 0.06);
    ctx.lineCap = 'round';
    const count = 1 + Math.round(d * 3);
    const len = Math.hypot(w, h);
    for (let k = 0; k < count; k++) {
      const a = ((35 + k * 42) * Math.PI) / 180 + (hash3(i, j + k, p.seed) - 0.5) * 0.5;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - (Math.cos(a) * len) / 2, y + h / 2 - (Math.sin(a) * len) / 2);
      ctx.lineTo(x + w / 2 + (Math.cos(a) * len) / 2, y + h / 2 + (Math.sin(a) * len) / 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

/* ── Geometric ────────────────────────────────────────────────────────── */

function drawGeometry(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const style = p.style;
  const jitter = p.jitter ?? 0.3;
  const ground = groundFor(p, src);
  ctx.fillStyle = rgbCss(ground);
  ctx.fillRect(0, 0, W, H);
  const ink = luma(ground[0], ground[1], ground[2]) < 128;

  if (style === 'flowField') {
    const cols = Math.max(1, Math.round(W / cs));
    const rows = Math.max(1, Math.round(H / cs));
    const g = lumaGrid(src, cols, rows, W, H);
    const at = (x, y) => g[Math.max(0, Math.min(rows - 1, y)) * cols + Math.max(0, Math.min(cols - 1, x))];
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const gx = at(i + 1, j) - at(i - 1, j);
      const gy = at(i, j + 1) - at(i, j - 1);
      const a = Math.atan2(gy, gx) + Math.PI / 2;
      const len = Math.hypot(w, h) * (0.4 + (1 - at(i, j) / 255) * 0.6);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.strokeStyle = rgbCss(tone(p, c));
      ctx.lineWidth = Math.max(0.8, cs * 0.09 * (0.6 + jitter));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - (Math.cos(a) * len) / 2, y + h / 2 - (Math.sin(a) * len) / 2);
      ctx.lineTo(x + w / 2 + (Math.cos(a) * len) / 2, y + h / 2 + (Math.sin(a) * len) / 2);
      ctx.stroke();
      ctx.restore();
    });
    return;
  }

  if (style === 'topography') {
    const cols = Math.max(1, Math.round(W / cs));
    const rows = Math.max(1, Math.round(H / cs));
    const g = lumaGrid(src, cols, rows, W, H);
    const at = (x, y) => g[Math.max(0, Math.min(rows - 1, y)) * cols + Math.max(0, Math.min(cols - 1, x))];
    const bands = 7;
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      fill(ctx, x, y, w, h, mix(ground, tone(p, c), 0.35));
      const l = at(i, j) / 255;
      const f = (l * bands) % 1;
      const near = Math.min(f, 1 - f);
      if (near > 0.14) return;
      ctx.fillStyle = css(darken(tone(p, c), ink ? 0.1 : 0.4), 1 - near / 0.14);
      ctx.fillRect(x, y + h / 2 - Math.max(0.7, cs * 0.05), w, Math.max(1, cs * 0.1));
    });
    return;
  }

  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = tone(p, c);
    const l = luma(c[0], c[1], c[2]);
    const cover = ink ? l / 255 : 1 - l / 255;
    const cx = x + w / 2;
    const cy = y + h / 2;

    switch (style) {
      case 'lowPoly': {
        // Two facets per cell, split on a hashed diagonal — a triangulated plate.
        const flip = hash3(i, j, p.seed) > 0.5;
        const a = [x, y];
        const b = [x + w, y];
        const c1 = [x + w, y + h];
        const d = [x, y + h];
        const tri = flip ? [a, b, c1] : [a, c1, d];
        const tri2 = flip ? [a, c1, d] : [a, b, c1];
        ctx.fillStyle = rgbCss(col);
        ctx.beginPath();
        ctx.moveTo(tri[0][0], tri[0][1]);
        ctx.lineTo(tri[1][0], tri[1][1]);
        ctx.lineTo(tri[2][0], tri[2][1]);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgbCss(darken(col, 0.28));
        ctx.beginPath();
        ctx.moveTo(tri2[0][0], tri2[0][1]);
        ctx.lineTo(tri2[1][0], tri2[1][1]);
        ctx.lineTo(tri2[2][0], tri2[2][1]);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'truchet': {
        // Quarter arcs, orientation from the cell's own hash — a real tiling.
        const q = Math.floor(hash3(i, j, p.seed) * 4);
        ctx.strokeStyle = rgbCss(col);
        ctx.lineWidth = Math.max(1, cs * 0.16 * (0.6 + jitter));
        ctx.beginPath();
        if (q === 0) {
          ctx.arc(x, y, w, 0, Math.PI / 2);
          ctx.moveTo(x + w, y);
          ctx.arc(x + w, y + h, w, -Math.PI / 2, 0);
        } else if (q === 1) {
          ctx.arc(x + w, y, w, Math.PI / 2, Math.PI);
          ctx.moveTo(x + w, y + h);
          ctx.arc(x, y + h, w, 0, Math.PI / 2);
        } else if (q === 2) {
          ctx.arc(x, y, w, 0, Math.PI / 2);
          ctx.moveTo(x + w, y + h);
          ctx.arc(x, y + h, w, 0, Math.PI / 2);
        } else {
          ctx.arc(x + w, y, w, Math.PI / 2, Math.PI);
          ctx.moveTo(x + w, y);
          ctx.arc(x + w, y + h, w, -Math.PI / 2, 0);
        }
        ctx.stroke();
        break;
      }
      case 'isoExtrude': {
        // A cube per cell: the top face carries the picture, the sides shade it.
        const depth = cover * h * 0.8;
        ctx.fillStyle = rgbCss(lighten(col, 34));
        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2 - depth * 0.5);
        ctx.lineTo(cx + w / 2, cy - depth * 0.5);
        ctx.lineTo(cx, cy + h / 2 - depth * 0.5);
        ctx.lineTo(cx - w / 2, cy - depth * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgbCss(col);
        ctx.fillRect(cx - w / 2, cy - depth * 0.5, w, h * 0.5 + depth * 0.5);
        ctx.fillStyle = rgbCss(darken(col, 0.35));
        ctx.beginPath();
        ctx.moveTo(cx + w / 2, cy - depth * 0.5);
        ctx.lineTo(cx, cy + h / 2 - depth * 0.5);
        ctx.lineTo(cx, cy + h / 2 + depth * 0.5);
        ctx.lineTo(cx + w / 2, cy + depth * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'lattice': {
        ctx.strokeStyle = rgbCss(col);
        ctx.lineWidth = Math.max(1, cs * 0.1);
        const r = (0.25 + cover * 0.5) * Math.min(w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = rgbCss(col);
        ctx.fillRect(cx - w * 0.06, cy - h * 0.06, w * 0.12, h * 0.12);
        break;
      }
      case 'forms': {
        const r = (0.2 + cover * 0.6) * Math.min(w, h);
        ctx.fillStyle = css(col, 0.9);
        ctx.beginPath();
        ctx.arc(cx + (hash3(i, j, p.seed) - 0.5) * w * 0.2, cy, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'schematic': {
        toneBase(ctx, x, y, w, h, col, 0.12);
        ctx.strokeStyle = rgbCss(darken(col, 0.2));
        ctx.lineWidth = Math.max(0.6, cs * 0.05);
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        if (cover > 0.4) {
          ctx.fillStyle = rgbCss(col);
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, cs * 0.12), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      default: {
        // specimen — a mounted tile with its own little tick, like a slide
        const gap = Math.max(0, p.spacing);
        const rot = (p.rotation * Math.PI) / 180;
        ctx.save();
        ctx.translate(cx, cy);
        if (rot) ctx.rotate(rot);
        ctx.fillStyle = rgbCss(col);
        ctx.fillRect(-(w - gap) / 2, -(h - gap) / 2, Math.max(1, w - gap), Math.max(1, h - gap));
        ctx.fillStyle = css(lighten(col, 60), 0.5);
        ctx.fillRect(-(w - gap) / 2, -(h - gap) / 2, Math.max(1, (w - gap) * 0.22), Math.max(1, h - gap));
        ctx.restore();
      }
    }
  });
}

/* ── Blocks & tiles ───────────────────────────────────────────────────── */

function drawBlocks(ctx, src, W, H, p) {
  const cs = Math.max(3, p.cellSize);
  const style = p.style;
  const ground = groundFor(p, src);

  if (style === 'hexMosaic') {
    ctx.fillStyle = rgbCss(ground);
    ctx.fillRect(0, 0, W, H);
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const r = Math.min(w, h) * 0.62;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 6;
        const hx = x + w / 2 + Math.cos(a) * r;
        const hy = y + h / 2 + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fillStyle = rgbCss(tone(p, c));
      ctx.fill();
    });
    return;
  }

  if (style === 'ledMatrix') {
    const ground = groundFor(p, src);
    ctx.fillStyle = rgbCss(darken(ground, 0.55));
    ctx.fillRect(0, 0, W, H);
    eachCell(W, H, cs, (i, j, x, y, w, h) => {
      const c = cellAvg(src, x, y, w, h);
      const col = tone(p, c);
      const gap = Math.max(1, cs * 0.12);
      const r = Math.max(1, Math.min(w, h) * 0.16);
      ctx.fillStyle = css(lighten(col, 40), 0.28);
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgbCss(col);
      ctx.beginPath();
      const bx = x + gap;
      const by = y + gap;
      const bw = Math.max(1, w - gap * 2);
      const bh = Math.max(1, h - gap * 2);
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
      ctx.arcTo(bx, by + bh, bx, by, r);
      ctx.arcTo(bx, by, bx + bw, by, r);
      ctx.fill();
    });
    return;
  }

  // voxel — a chunky cube per cell, the picture carried on its top face
  ctx.fillStyle = rgbCss(darken(ground, 0.4));
  ctx.fillRect(0, 0, W, H);
  eachCell(W, H, cs, (i, j, x, y, w, h) => {
    const c = cellAvg(src, x, y, w, h);
    const col = tone(p, c);
    const d = Math.max(1, Math.min(w, h) * 0.28);
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillStyle = rgbCss(col);
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - d - 2), Math.max(1, h - d - 2));
    ctx.fillStyle = rgbCss(lighten(col, 30));
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + 1 + d, y + 1 - d * 0.5);
    ctx.lineTo(x + w - 1, y + 1 - d * 0.5);
    ctx.lineTo(x + w - d - 1, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgbCss(darken(col, 0.3));
    ctx.beginPath();
    ctx.moveTo(x + w - d - 1, y + 1);
    ctx.lineTo(x + w - 1, y + 1 - d * 0.5);
    ctx.lineTo(x + w - 1, y + h - d - 1);
    ctx.lineTo(x + w - d - 1, y + h - 1);
    ctx.closePath();
    ctx.fill();
  });
}

/* ── dispatch ─────────────────────────────────────────────────────────── */

const PRINT = new Set(['stippling', 'risograph', 'comic', 'sketch', 'engraving', 'warhol', 'cyanotype', 'woodblock', 'posterize', 'mezzotint', 'pointillize', 'cmykDrops']);
const GEOMETRY = new Set(['specimen', 'lowPoly', 'truchet', 'isoExtrude', 'flowField', 'lattice', 'topography', 'forms', 'schematic']);
const BLOCKS = new Set(['voxel', 'hexMosaic', 'ledMatrix']);
const TEXT = new Set(['braille', 'block', 'asciiStudio']);

export const MARK_STYLES = new Set([...PRINT, ...GEOMETRY, ...BLOCKS, ...TEXT]);

export function drawMark(ctx, src, W, H, p) {
  const s = p.style;
  if (s === 'braille') return drawText(ctx, src, W, H, p, CHAR_SETS.braille.chars, WIDE_ASPECT);
  if (s === 'block') return drawText(ctx, src, W, H, p, CHAR_SETS.blocks.chars, WIDE_ASPECT);
  if (s === 'asciiStudio') return drawText(ctx, src, W, H, p, (CHAR_SETS[p.charSet] || CHAR_SETS.classic).chars, 1.2);
  if (BLOCKS.has(s)) return drawBlocks(ctx, src, W, H, p);
  if (GEOMETRY.has(s)) return drawGeometry(ctx, src, W, H, p);
  return drawPrint(ctx, src, W, H, p);
}