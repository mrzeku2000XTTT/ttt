// GLYPH — colour library + tiny deterministic RNG.
// Every palette carries two things: a short list of real RGB colours the
// dithered styles quantise into, and a RAMP — the same palette ordered dark →
// light, which every other renderer interpolates through so the picture keeps
// its light and shade instead of collapsing into flat bands.

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb) {
  return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function rgbCss(rgb) {
  return `rgb(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])})`;
}

// mulberry32 — same seed always gives the same picture.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = (id, name, bg, hexes, ramp) => ({
  id,
  name,
  bg,
  colors: hexes ? hexes.map(hexToRgb) : null,
  ramp: ramp ? ramp.map(hexToRgb) : null,
});

export const PALETTES = [
  P('original', 'Original', '#ffffff', null, null),
  // The reference look: deep blue in the shadows running up to warm gold.
  P('dusk', 'Dusk', '#0d0d0d', ['#1a508b', '#d4b483', '#fdf2e9'], ['#0d0d0d', '#123a63', '#1a508b', '#8f8f6e', '#d4b483', '#fdf2e9']),
  P('nova', 'Nova', '#F5F8FB', ['#6BCAFF', '#4A90E2', '#2D3436', '#9DB4C8'], ['#081220', '#1e3a5f', '#4A90E2', '#6BCAFF', '#eaf4ff']),
  P('mono', 'Mono', '#ffffff', ['#0a0a0a', '#3f3f3f', '#7a7a7a', '#b5b5b5', '#ffffff'], ['#000000', '#2b2b2b', '#5c5c5c', '#8f8f8f', '#c4c4c4', '#ffffff']),
  P('cyan', 'Cyan', '#04121f', ['#6BCAFF', '#4A90E2', '#0ea5e9', '#e6f6ff', '#ffffff'], ['#03101c', '#0b3a5c', '#0ea5e9', '#6BCAFF', '#e6f6ff']),
  P('electric', 'Electric', '#050b1a', ['#1e3a8a', '#3b82f6', '#60a5fa', '#a5d8ff', '#ffffff'], ['#03081a', '#1e3a8a', '#3b82f6', '#60a5fa', '#ffffff']),
  P('magenta', 'Magenta', '#170610', ['#e11d48', '#f472b6', '#ff9ecd', '#fff1f5'], ['#14040e', '#7f1d4d', '#e11d48', '#f472b6', '#fff1f5']),
  P('green', 'Green', '#04140b', ['#16a34a', '#22c55e', '#4ade80', '#a7f3d0', '#eafff3'], ['#03120a', '#166534', '#22c55e', '#4ade80', '#eafff3']),
  P('amber', 'Amber', '#1a1204', ['#d97706', '#f59e0b', '#fbbf24', '#fde68a', '#fff8e6'], ['#160f03', '#92400e', '#f59e0b', '#fbbf24', '#fff8e6']),
  P('red', 'Red', '#170606', ['#b91c1c', '#ef4444', '#f87171', '#fca5a5', '#fff1f1'], ['#140404', '#7f1d1d', '#ef4444', '#f87171', '#fff1f1']),
  P('purple', 'Purple', '#0f0618', ['#7e22ce', '#a855f7', '#c084fc', '#e9d5ff', '#f7f0ff'], ['#0d0515', '#581c87', '#a855f7', '#c084fc', '#f7f0ff']),
  P('neon', 'Neon', '#020604', ['#00ff99', '#00e5ff', '#ff00e5', '#ffffff'], ['#010503', '#007a5e', '#00e5ff', '#00ff99', '#ffffff']),
  P('ice', 'Ice', '#061621', ['#2b6f9e', '#6bcaff', '#a5e4ff', '#dff6ff', '#ffffff'], ['#04121b', '#2b6f9e', '#6bcaff', '#a5e4ff', '#ffffff']),
  P('sunset', 'Sunset', '#1b0a06', ['#7c2d12', '#c2410c', '#ff7a59', '#ffb26b', '#ffd8a8'], ['#170804', '#7c2d12', '#c2410c', '#ffb26b', '#ffd8a8']),
  P('fire', 'Fire', '#150503', ['#7f1d1d', '#ef4444', '#fb923c', '#fde047'], ['#120402', '#7f1d1d', '#ef4444', '#fb923c', '#fde047']),
  P('terminal', 'Terminal', '#000600', ['#0a3', '#0f0', '#33ff66', '#8bffb0'], ['#000400', '#006622', '#00ff44', '#8bffb0']),
];

export function paletteById(id) {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}

export function nearestColor(colors, r, g, b) {
  let best = colors[0];
  let bestD = Infinity;
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const d = (c[0] - r) * (c[0] - r) + (c[1] - g) * (c[1] - g) + (c[2] - b) * (c[2] - b);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// A brightness walked through the palette's dark → light ramp.
export function rampColor(l, ramp) {
  const t = Math.max(0, Math.min(1, l / 255)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(t));
  const f = t - i;
  const a = ramp[i];
  const b = ramp[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

// Source colour → palette colour. Through the ramp the cell's own brightness
// picks the colour, so light and shade survive as a gradient instead of
// snapping to five flat steps. "Original" keeps the photograph's own colour.
export function mapColor(r, g, b, palette) {
  if (!palette) return [r, g, b];
  if (palette.ramp) return rampColor(luma(r, g, b), palette.ramp);
  if (palette.colors) return nearestColor(palette.colors, r, g, b);
  return [r, g, b];
}

// The ground the primitives sit on. 'auto' keeps the image's own hue but pushes
// it down to a near-black, so the marks read as light on dark; light/dark are
// manual overrides.
export function plateRgb(p, mean) {
  if (p.plate === 'light') return [255, 255, 255];
  if (p.plate === 'dark') return [8, 11, 14];
  if (mean) return mean.map((v) => Math.max(6, v * 0.16));
  return hexToRgb((p.paletteObj && p.paletteObj.bg) || '#0b0f14');
}

export function plateColor(p, mean) {
  return rgbCss(plateRgb(p, mean));
}