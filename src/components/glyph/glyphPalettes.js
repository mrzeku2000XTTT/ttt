// GLYPH — colour library + tiny deterministic RNG.
// Every palette is a real list of RGB colours the renderers quantise into.

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

const P = (id, name, bg, hexes) => ({
  id,
  name,
  bg,
  colors: hexes ? hexes.map(hexToRgb) : null,
});

export const PALETTES = [
  P('original', 'Original', '#ffffff', null),
  P('nova', 'Nova', '#F5F8FB', ['#6BCAFF', '#4A90E2', '#2D3436', '#9DB4C8']),
  P('mono', 'Mono', '#ffffff', ['#0a0a0a', '#3f3f3f', '#7a7a7a', '#b5b5b5', '#ffffff']),
  P('cyan', 'Cyan', '#04121f', ['#6BCAFF', '#4A90E2', '#0ea5e9', '#e6f6ff', '#ffffff']),
  P('electric', 'Electric', '#050b1a', ['#1e3a8a', '#3b82f6', '#60a5fa', '#a5d8ff', '#ffffff']),
  P('magenta', 'Magenta', '#170610', ['#e11d48', '#f472b6', '#ff9ecd', '#fff1f5']),
  P('green', 'Green', '#04140b', ['#16a34a', '#22c55e', '#4ade80', '#a7f3d0', '#eafff3']),
  P('amber', 'Amber', '#1a1204', ['#d97706', '#f59e0b', '#fbbf24', '#fde68a', '#fff8e6']),
  P('red', 'Red', '#170606', ['#b91c1c', '#ef4444', '#f87171', '#fca5a5', '#fff1f1']),
  P('purple', 'Purple', '#0f0618', ['#7e22ce', '#a855f7', '#c084fc', '#e9d5ff', '#f7f0ff']),
  P('neon', 'Neon', '#020604', ['#00ff99', '#00e5ff', '#ff00e5', '#ffffff']),
  P('ice', 'Ice', '#061621', ['#2b6f9e', '#6bcaff', '#a5e4ff', '#dff6ff', '#ffffff']),
  P('sunset', 'Sunset', '#1b0a06', ['#7c2d12', '#c2410c', '#ff7a59', '#ffb26b', '#ffd8a8']),
  P('fire', 'Fire', '#150503', ['#7f1d1d', '#ef4444', '#fb923c', '#fde047']),
  P('terminal', 'Terminal', '#000600', ['#0a3', '#0f0', '#33ff66', '#8bffb0']),
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

// Source colour → palette colour. "Original" keeps the photograph's own colour.
export function mapColor(r, g, b, palette) {
  if (!palette || !palette.colors) return [r, g, b];
  return nearestColor(palette.colors, r, g, b);
}

// The ground the primitives sit on. 'auto' uses the image's own mean colour so
// the render keeps the picture's overall tone; light/dark are manual overrides.
export function plateColor(p, mean) {
  if (p.plate === 'light') return '#ffffff';
  if (p.plate === 'dark') return '#080b0e';
  if (mean) return rgbCss(mean.map((v) => (v < 26 ? 26 : v)));
  return (p.paletteObj && p.paletteObj.bg) || '#111111';
}

export function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}