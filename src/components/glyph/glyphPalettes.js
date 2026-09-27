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
  // The rest of the shelf — one button opens them all.
  P('sepia', 'Sepia', '#171008', ['#3b2a1a', '#8a6a43', '#c9a97a', '#f3e3c8'], ['#0f0a04', '#3b2a1a', '#8a6a43', '#c9a97a', '#f7ecd8']),
  P('duotone', 'Duotone', '#0a0f1e', ['#1b2a5e', '#3f5fb0', '#8fa8e0', '#e8f0ff'], ['#070b16', '#1b2a5e', '#3f5fb0', '#8fa8e0', '#eef4ff']),
  P('ocean', 'Ocean', '#03151c', ['#0b4f6c', '#01baef', '#6fd6e8', '#d8f6ff'], ['#02121a', '#0b4f6c', '#01baef', '#6fd6e8', '#e6fbff']),
  P('forest', 'Forest', '#04140c', ['#14532d', '#3f8f5b', '#8fd0a3', '#e6f6ea'], ['#03100a', '#14532d', '#3f8f5b', '#8fd0a3', '#eefbf1']),
  P('moss', 'Moss', '#101407', ['#3f4a1e', '#6f8a34', '#b4cc74', '#eef7d8'], ['#0c1005', '#3f4a1e', '#6f8a34', '#b4cc74', '#f4fbdc']),
  P('candy', 'Candy', '#1a0a14', ['#ff5fa2', '#ffb3d1', '#8ce0ff', '#fff0f6'], ['#180810', '#c2185b', '#ff5fa2', '#ffb3d1', '#fff5fa']),
  P('bubblegum', 'Bubblegum', '#1b0a18', ['#ff7ac6', '#ffc2e6', '#b98cff', '#fff2fb'], ['#170813', '#d63384', '#ff7ac6', '#ffc2e6', '#fff7fc']),
  P('retro', 'Retro', '#161006', ['#c1440e', '#e8a33d', '#6fb3b8', '#f6e7c1'], ['#120d05', '#8c2f0a', '#c1440e', '#e8a33d', '#f9edd0']),
  P('cyber', 'Cyber', '#0a0512', ['#ff2e97', '#00f0ff', '#7c4dff', '#eae6ff'], ['#080310', '#7c4dff', '#ff2e97', '#00f0ff', '#f2eeff']),
  P('gold', 'Gold', '#171104', ['#8a6a12', '#d4af37', '#f0d98a', '#fff8dd'], ['#130e03', '#8a6a12', '#d4af37', '#f0d98a', '#fffbe8']),
  P('copper', 'Copper', '#160c08', ['#7c3f22', '#b87333', '#e0a878', '#fbe9d8'], ['#120905', '#7c3f22', '#b87333', '#e0a878', '#fdf0e4']),
  P('clay', 'Clay', '#170f0c', ['#8d4a3c', '#c47a5f', '#e5b39c', '#f8e3d6'], ['#130b09', '#8d4a3c', '#c47a5f', '#e5b39c', '#fbeadf']),
  P('sand', 'Sand', '#171208', ['#9c7c4a', '#d6b483', '#eddcb8', '#fdf6e3'], ['#130f06', '#9c7c4a', '#d6b483', '#eddcb8', '#fffaee']),
  P('lavender', 'Lavender', '#0f0a1a', ['#5b4b8a', '#9b8cd6', '#c9bdf0', '#f2eefe'], ['#0c0816', '#5b4b8a', '#9b8cd6', '#c9bdf0', '#f7f4ff']),
  P('mint', 'Mint', '#04170f', ['#0f9b6c', '#4fd6a6', '#a7f0d2', '#eafff6'], ['#03120c', '#0f9b6c', '#4fd6a6', '#a7f0d2', '#f0fff8']),
  P('coral', 'Coral', '#1a0b08', ['#d94f4f', '#ff8a70', '#ffc2b0', '#fff0ea'], ['#160806', '#b03a3a', '#d94f4f', '#ff8a70', '#fff5f0']),
  P('steel', 'Steel', '#0b0f13', ['#2f3e4c', '#5d7488', '#9fb3c2', '#e6eef4'], ['#080b0f', '#2f3e4c', '#5d7488', '#9fb3c2', '#f0f5f9']),
  P('ink', 'Ink', '#05070c', ['#0a1020', '#1e2c4a', '#5a6b8c', '#e8eef8'], ['#04060a', '#0a1020', '#1e2c4a', '#5a6b8c', '#eef2fa']),
  P('wine', 'Wine', '#140609', ['#6b1230', '#a81f4a', '#d9738f', '#f7dbe4'], ['#110507', '#6b1230', '#a81f4a', '#d9738f', '#fce9ef']),
  P('blueprint', 'Blueprint', '#031323', ['#0a3d6b', '#2f80c4', '#8fc4ea', '#e8f4ff'], ['#020e1a', '#0a3d6b', '#2f80c4', '#8fc4ea', '#f0f8ff']),
  P('thermal', 'Thermal', '#120306', ['#7a0d3a', '#e01b4c', '#ff8c1a', '#ffe066'], ['#0f0205', '#7a0d3a', '#e01b4c', '#ff8c1a', '#fff0a3']),
  P('infrared', 'Infrared', '#150505', ['#5c0a0a', '#d32f2f', '#ff7043', '#ffd8c2'], ['#120404', '#5c0a0a', '#d32f2f', '#ff7043', '#ffe4d6']),
  P('aurora', 'Aurora', '#03100f', ['#0f766e', '#2dd4bf', '#a78bfa', '#e8fffb'], ['#020c0c', '#0f766e', '#2dd4bf', '#a78bfa', '#f0fffd']),
  P('twilight', 'Twilight', '#0b0a1c', ['#2a2a6e', '#6a5acd', '#c39bd3', '#f0e9ff'], ['#08071a', '#2a2a6e', '#6a5acd', '#c39bd3', '#f6f1ff']),
  P('slate', 'Slate', '#0c0e11', ['#333a42', '#6b7683', '#a8b3bf', '#e9edf1'], ['#090b0e', '#333a42', '#6b7683', '#a8b3bf', '#f2f5f8']),
  P('newsprint', 'Newsprint', '#efeae0', ['#1a1a1a', '#4d4d4d', '#8c8c8c', '#efeae0'], ['#111111', '#3d3d3d', '#6e6e6e', '#a3a3a3', '#f5f2ea']),
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