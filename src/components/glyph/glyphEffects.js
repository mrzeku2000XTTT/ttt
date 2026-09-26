// GLYPH — stackable post-processing. Every effect really operates on the
// rendered canvas (blur, bloom, CRT, scanlines, grain, vignette, RGB split,
// glitch). Amounts are 0–1; 0 means off.

function scratch(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function applyBlur(canvas, amount) {
  const g = canvas.getContext('2d');
  const t = scratch(canvas.width, canvas.height);
  t.getContext('2d').drawImage(canvas, 0, 0);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.filter = `blur(${(amount * 7).toFixed(2)}px)`;
  g.drawImage(t, 0, 0);
  g.filter = 'none';
}

function applyRgbSplit(canvas, amount) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const src = scratch(w, h);
  src.getContext('2d').drawImage(canvas, 0, 0);
  const channel = (hex) => {
    const c = scratch(w, h);
    const cg = c.getContext('2d');
    cg.drawImage(src, 0, 0);
    cg.globalCompositeOperation = 'multiply';
    cg.fillStyle = hex;
    cg.fillRect(0, 0, w, h);
    return c;
  };
  const d = Math.max(1, amount * 14);
  g.clearRect(0, 0, w, h);
  g.globalCompositeOperation = 'lighter';
  g.drawImage(channel('#ff0000'), -d, 0);
  g.drawImage(channel('#00ff00'), 0, 0);
  g.drawImage(channel('#0000ff'), d, 0);
  g.globalCompositeOperation = 'source-over';
}

function applyGlitch(canvas, amount, rng) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const t = scratch(w, h);
  t.getContext('2d').drawImage(canvas, 0, 0);
  const slices = 5 + Math.round(amount * 16);
  for (let i = 0; i < slices; i++) {
    const y = Math.floor(rng() * h);
    const sh = 3 + Math.floor(rng() * Math.max(4, h * 0.05));
    const dx = (rng() - 0.5) * 70 * amount;
    g.drawImage(t, 0, y, w, sh, dx, y, w, sh);
  }
  for (let i = 0; i < 2; i++) {
    if (rng() > 0.55) continue;
    const y = Math.floor(rng() * h);
    const sh = 2 + Math.floor(rng() * 8);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = rng() > 0.5 ? 'rgba(0,220,255,0.30)' : 'rgba(255,0,180,0.28)';
    g.fillRect(0, y, w, sh);
    g.globalCompositeOperation = 'source-over';
  }
}

function applyBloom(canvas, amount) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const t = scratch(w, h);
  const tg = t.getContext('2d');
  tg.filter = `blur(${Math.round(8 + amount * 20)}px) brightness(1.6) saturate(1.2)`;
  tg.drawImage(canvas, 0, 0);
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = Math.min(0.9, 0.25 + amount * 0.65);
  g.drawImage(t, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

function applyGlow(canvas, amount) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const t = scratch(w, h);
  const tg = t.getContext('2d');
  tg.filter = `blur(${Math.round(2 + amount * 6)}px)`;
  tg.drawImage(canvas, 0, 0);
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = Math.min(0.7, 0.15 + amount * 0.5);
  g.drawImage(t, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

function applyScanlines(canvas, amount) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  g.save();
  g.globalAlpha = Math.min(0.65, amount * 0.6);
  g.fillStyle = '#000000';
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  g.restore();
}

function applyCrt(canvas, amount, rng) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const t = scratch(w, h);
  t.getContext('2d').drawImage(canvas, 0, 0);
  g.clearRect(0, 0, w, h);
  const k = amount * 0.16;
  for (let y = 0; y < h; y++) {
    const ny = (y / h) * 2 - 1;
    const scale = 1 + k * ny * ny;
    const sw = w / scale;
    g.drawImage(t, 0, y, w, 1, (w - sw) / 2, y, sw, 1);
  }
  applyScanlines(canvas, amount * 0.8);
  const id = g.getImageData(0, 0, w, h);
  const d = id.data;
  const noise = amount * 26;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() - 0.5) * noise;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(id, 0, 0);
}

function applyGrain(canvas, amount, rng) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const id = g.getImageData(0, 0, w, h);
  const d = id.data;
  const amt = amount * 70;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() - 0.5) * amt;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(id, 0, 0);
}

function applyVignette(canvas, amount) {
  const { width: w, height: h } = canvas;
  const g = canvas.getContext('2d');
  const grd = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.72);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, `rgba(0,0,0,${(0.12 + amount * 0.62).toFixed(3)})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
}

export function applyEffects(canvas, params, rng) {
  const e = params.effects || {};
  if (e.blur) applyBlur(canvas, e.blur);
  if (e.rgbSplit) applyRgbSplit(canvas, e.rgbSplit);
  if (e.glitch) applyGlitch(canvas, e.glitch, rng);
  if (e.bloom) applyBloom(canvas, e.bloom);
  if (e.glow) applyGlow(canvas, e.glow);
  if (e.crt) applyCrt(canvas, e.crt, rng);
  if (e.scanlines) applyScanlines(canvas, e.scanlines);
  if (e.grain) applyGrain(canvas, e.grain, rng);
  if (e.vignette) applyVignette(canvas, e.vignette);
}

export const ACTIVE_EFFECT_COUNT = (effects) =>
  Object.keys(effects || {}).filter((k) => effects[k] > 0).length;