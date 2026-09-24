// Morph Motion Studio — animated gradient backgrounds.
//
// Same contract as the rest of the engine: a pure function of (background, time),
// so the editor, the compositor and any export draw identical frames. Nothing is
// random — every drift is a sine of the clock, which is what keeps a background
// seamless on a loop and the two panes in step with each other.
//
// Four types, the ones an After Effects ramp gives you: a linear ramp, a radial
// ramp, an angle (conic) ramp that wraps seamlessly, and a mesh of soft light
// blobs composited on top of each other.

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

// The studio's own backdrop, used whenever a scene carries no background.
export const STUDIO_BG = '#070707';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const rgbOf = (hex) => {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 255, 255];
};

const withAlpha = (hex, a) => {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(a, 0, 1)})`;
};

export const GRADIENT_TYPES = [
  { id: 'linear', label: 'Linear' },
  { id: 'radial', label: 'Radial' },
  { id: 'conic', label: 'Conic' },
  { id: 'mesh', label: 'Mesh' },
];

const isType = (id) => GRADIENT_TYPES.some((t) => t.id === id);

/**
 * Ready-made ramps. Each one is a look, not just a pair of colours: the type,
 * the ramp direction, how fast it drifts and how deep the vignette sits are all
 * part of the preset. Deliberately dark and low-saturation so titles stay the
 * brightest thing on screen.
 */
export const GRADIENT_PRESETS = [
  { id: 'violet-dusk', label: 'Violet Dusk', type: 'linear', colors: ['#0a0a12', '#1b1046', '#3b1470'], angle: 135, speed: 0.5, vignette: 0.3 },
  { id: 'deep-space', label: 'Deep Space', type: 'radial', colors: ['#05060f', '#1b1046', '#3b1470'], angle: 0, speed: 0.4, vignette: 0.42 },
  { id: 'aurora', label: 'Aurora', type: 'mesh', colors: ['#04121a', '#0d4f5c', '#1b1046', '#7DDCFF'], angle: 0, speed: 0.45, vignette: 0.34 },
  { id: 'prism-sweep', label: 'Prism Sweep', type: 'conic', colors: ['#0a0a12', '#1b1046', '#3b1470', '#7DDCFF'], angle: 210, speed: 0.35, vignette: 0.4 },
  { id: 'ice', label: 'Ice', type: 'linear', colors: ['#060b14', '#12314f', '#7DDCFF'], angle: 200, speed: 0.35, vignette: 0.36 },
  { id: 'ember', label: 'Ember', type: 'radial', colors: ['#0b0603', '#3a1408', '#c2701f'], angle: 0, speed: 0.5, vignette: 0.45 },
  { id: 'teal-drift', label: 'Teal Drift', type: 'mesh', colors: ['#04100e', '#0f5e5a', '#123a4f', '#7DDCFF'], angle: 0, speed: 0.4, vignette: 0.34 },
  { id: 'gold-hour', label: 'Gold Hour', type: 'radial', colors: ['#0b0904', '#3b2c0a', '#b58a2b'], angle: 0, speed: 0.4, vignette: 0.44 },
  { id: 'graphite', label: 'Graphite', type: 'linear', colors: ['#070707', '#1c1c1c', '#2e2e2e'], angle: 160, speed: 0.3, vignette: 0.28 },
  { id: 'signal', label: 'Signal', type: 'conic', colors: ['#05070c', '#12203a', '#2a4a7a', '#7DDCFF'], angle: 30, speed: 0.3, vignette: 0.42 },
];

export const backgroundPreset = (id) => GRADIENT_PRESETS.find((p) => p.id === id) || null;

/** Normalise anything into a background the renderer can trust. */
export function makeBackground(partial = {}) {
  const colors = (Array.isArray(partial.colors) ? partial.colors : [])
    .map((c) => String(c || '').trim())
    .filter((c) => HEX.test(c))
    .slice(0, 4);
  return {
    type: isType(partial.type) ? partial.type : 'linear',
    colors: colors.length >= 2 ? colors : ['#0a0a12', '#1b1046', '#3b1470'],
    angle: Number.isFinite(Number(partial.angle)) ? Number(partial.angle) : 135,
    speed: Number.isFinite(Number(partial.speed)) ? clamp(Number(partial.speed), 0, 3) : 0.5,
    vignette: Number.isFinite(Number(partial.vignette)) ? clamp(Number(partial.vignette), 0, 1) : 0.35,
    // Which preset this came from, so the picker can show it as the active one.
    preset: typeof partial.preset === 'string' ? partial.preset : '',
  };
}

/* ------------------------------------------------------------------ fills */

// A linear ramp whose interior stops breathe, so the ramp itself moves rather
// than the whole background sliding around.
function linearFill(ctx, b, t, W, H) {
  const a = ((b.angle + Math.sin(t * 0.4) * 10) * Math.PI) / 180;
  const half = (Math.abs(Math.cos(a)) * W + Math.abs(Math.sin(a)) * H) / 2;
  const cx = W / 2;
  const cy = H / 2;
  const g = ctx.createLinearGradient(
    cx - Math.cos(a) * half, cy - Math.sin(a) * half,
    cx + Math.cos(a) * half, cy + Math.sin(a) * half,
  );
  const n = b.colors.length;
  const shift = Math.sin(t * 0.6) * 0.08;
  b.colors.forEach((c, i) => {
    const interior = i > 0 && i < n - 1;
    g.addColorStop(clamp(i / (n - 1) + (interior ? shift : 0), 0, 1), c);
  });
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// A radial ramp whose centre wanders and whose radius breathes.
function radialFill(ctx, b, t, W, H) {
  const cx = W * (0.5 + Math.cos(t * 0.5) * 0.16);
  const cy = H * (0.46 + Math.sin(t * 0.37) * 0.12);
  const r = Math.hypot(W, H) * (0.62 + Math.sin(t * 0.3) * 0.08);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  const n = b.colors.length;
  b.colors.forEach((c, i) => g.addColorStop(i / (n - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// An angle ramp. The first colour is repeated at 1 so the seam where the sweep
// closes is invisible, and the whole sweep turns slowly.
function conicFill(ctx, b, t, W, H) {
  if (typeof ctx.createConicGradient !== 'function') return linearFill(ctx, b, t, W, H);
  const g = ctx.createConicGradient((b.angle * Math.PI) / 180 + t * 0.35, W / 2, H / 2);
  const n = b.colors.length;
  b.colors.forEach((c, i) => g.addColorStop(i / n, c));
  g.addColorStop(1, b.colors[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Soft light blobs added over a dark base — the mesh-gradient look. Each blob
// drifts on its own phase, so the field never repeats visibly.
const BLOBS = [
  { x: 0.28, y: 0.32, r: 0.62, phase: 0.0, ax: 0.10, ay: 0.08 },
  { x: 0.74, y: 0.28, r: 0.58, phase: 2.1, ax: 0.09, ay: 0.10 },
  { x: 0.34, y: 0.76, r: 0.60, phase: 4.2, ax: 0.11, ay: 0.07 },
  { x: 0.80, y: 0.78, r: 0.50, phase: 5.6, ax: 0.08, ay: 0.09 },
];

function meshFill(ctx, b, t, W, H) {
  ctx.fillStyle = b.colors[0];
  ctx.fillRect(0, 0, W, H);
  const tints = b.colors.slice(1);
  if (!tints.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  BLOBS.forEach((blob, i) => {
    const c = tints[i % tints.length];
    const cx = W * (blob.x + Math.cos(t * 0.4 + blob.phase) * blob.ax);
    const cy = H * (blob.y + Math.sin(t * 0.33 + blob.phase) * blob.ay);
    const r = Math.min(W, H) * blob.r * (1 + Math.sin(t * 0.5 + blob.phase) * 0.12);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, withAlpha(c, 0.8));
    g.addColorStop(0.55, withAlpha(c, 0.28));
    g.addColorStop(1, withAlpha(c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  ctx.restore();
}

/**
 * Paint the frame's backdrop. With no background on the scene this is exactly
 * what the studio always drew — a flat near-black — so every existing scene is
 * untouched.
 */
export function drawBackground(ctx, background, time = 0, W, H) {
  const b = background && isType(background.type) ? makeBackground(background) : null;
  if (!b) {
    ctx.fillStyle = STUDIO_BG;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const t = time * b.speed;

  if (b.type === 'radial') radialFill(ctx, b, t, W, H);
  else if (b.type === 'conic') conicFill(ctx, b, t, W, H);
  else if (b.type === 'mesh') meshFill(ctx, b, t, W, H);
  else linearFill(ctx, b, t, W, H);

  // A vignette, so the brightest part of the ramp sits behind the subject and the
  // corners fall away instead of fighting the titles.
  if (b.vignette > 0.001) {
    const g = ctx.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.12, W / 2, H * 0.5, Math.hypot(W, H) * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${(0.75 * b.vignette).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

/** The same ramp as a CSS background, for the picker's swatches. */
export function backgroundStyle(bg) {
  const b = makeBackground(bg || {});
  const [c0, c1, c2, c3] = [b.colors[0], b.colors[1] || b.colors[0], b.colors[2] || b.colors[1] || b.colors[0], b.colors[3]];
  if (b.type === 'radial') return `radial-gradient(circle at 50% 46%, ${c0} 0%, ${c1} 45%, ${c2} 100%)`;
  if (b.type === 'conic') return `conic-gradient(from ${b.angle}deg, ${c0}, ${c1}, ${c2}, ${c0})`;
  if (b.type === 'mesh') {
    const t = [c1, c2, c3 || c1];
    return [
      `radial-gradient(circle at 28% 32%, ${t[0]} 0%, transparent 62%)`,
      `radial-gradient(circle at 74% 28%, ${t[1]} 0%, transparent 60%)`,
      `radial-gradient(circle at 38% 76%, ${t[2]} 0%, transparent 62%)`,
      c0,
    ].join(', ');
  }
  return `linear-gradient(${b.angle}deg, ${c0} 0%, ${c1} 50%, ${c2} 100%)`;
}