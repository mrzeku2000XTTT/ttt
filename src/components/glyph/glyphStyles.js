// GLYPH — the rendering styles, their character sets, and the randomiser.
// Randomness is controlled: every style has its own ranges, so results stay
// readable instead of chaotic. Nothing here picks a post-processing effect —
// the pipeline is source → sampling → reconstruction, and nothing else.

import { PALETTES, makeRng, paletteById } from './glyphPalettes';

export const CHAR_SETS = {
  classic: { label: 'Classic', chars: '@#S08Xx+=-;:,. ' },
  blocks: { label: 'Blocks', chars: '\u2588\u2593\u2592\u2591 ' },
  minimal: { label: 'Minimal', chars: '\u25cf\u2022\u00b7 ' },
  tech: { label: 'Tech', chars: '01' },
  matrix: { label: 'Matrix', chars: '01\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd' },
  symbols: { label: 'Symbols', chars: '+\u00d7*/<>[]{}#' },
  braille: { label: 'Braille', chars: '\u2801\u2803\u2807\u280f\u281f\u283f\u287f\u28ff' },
};

export const CHAR_SET_IDS = Object.keys(CHAR_SETS);

// The whole library. Every entry is free and renders from the source pixels:
//   category — which shelf it sits on in the style browser
//   icon     — the mark shown on its tile
//   tags     — the two-word feel shown under the name
//   cell     — the cell-size band that style stays readable in
//   core     — one of the fifteen a plain "Randomize" can land on
//   filter   — a deliberate look (blur, warp, glass) rather than a strict
//              reconstruction, so the fidelity fallback leaves it alone
export const STYLES = [
  /* ── ASCII & Text ── */
  { id: 'characters', name: 'Characters', icon: '\u259b', category: 'ascii', tags: 'dense \u00b7 mono', cell: [5, 16], core: true },
  { id: 'asciiStudio', name: 'ASCII Studio', icon: '\u25c9', category: 'ascii', tags: 'color \u00b7 geometric', cell: [5, 16] },
  { id: 'block', name: 'Block', icon: '\u259b', category: 'ascii', tags: 'minimal \u00b7 mono', cell: [6, 18] },
  { id: 'dots', name: 'Dots', icon: '\u2022', category: 'ascii', tags: 'minimal \u00b7 organic', cell: [6, 22], core: true },
  { id: 'mixed', name: 'Mixed', icon: '\u2591', category: 'ascii', tags: 'dense \u00b7 mono', cell: [8, 20], core: true },
  { id: 'braille', name: 'Braille', icon: '\u28ff', category: 'ascii', tags: 'dense \u00b7 mono', cell: [6, 16] },
  { id: 'animatedAscii', name: 'Animated ASCII', icon: '\u25a4', category: 'ascii', tags: 'live \u00b7 mono', cell: [5, 14], core: true, animated: true },
  { id: 'matrix', name: 'Matrix', icon: '\u30a2', category: 'ascii', tags: 'live \u00b7 mono', cell: [6, 14], core: true, animated: true },

  /* ── Pixel & Blocks ── */
  { id: 'pixel', name: 'Pixel Art', icon: '\u25e7', category: 'pixel', tags: 'retro \u00b7 color', cell: [6, 26], core: true },
  { id: 'mosaic', name: 'Mosaic', icon: '\u25a3', category: 'pixel', tags: 'color \u00b7 geometric', cell: [8, 30], core: true, featured: true },
  { id: 'lego', name: 'LEGO', icon: '\u25a6', category: 'pixel', tags: 'color \u00b7 geometric', cell: [10, 26], core: true },
  { id: 'voxel', name: 'Voxel', icon: '\u2b22', category: 'pixel', tags: 'geometric \u00b7 dense', cell: [10, 26] },
  { id: 'hexMosaic', name: 'Hex Mosaic', icon: '\u2b21', category: 'pixel', tags: 'geometric \u00b7 color', cell: [8, 24] },
  { id: 'ledMatrix', name: 'LED Matrix', icon: '\u28ff', category: 'pixel', tags: 'retro \u00b7 geometric', cell: [6, 20] },

  /* ── Print & Paper ── */
  { id: 'dither', name: 'Dither', icon: '\u259a', category: 'print', tags: 'retro \u00b7 dense', cell: [2, 8], core: true },
  { id: 'halftone', name: 'Halftone', icon: '\u25c9', category: 'print', tags: 'retro \u00b7 mono', cell: [8, 24], core: true },
  { id: 'stippling', name: 'Stippling', icon: '\u2820\u281f', category: 'print', tags: 'organic \u00b7 mono', cell: [4, 12] },
  { id: 'risograph', name: 'Risograph', icon: '\u259a', category: 'print', tags: 'retro \u00b7 color', cell: [4, 12] },
  { id: 'comic', name: 'Comic', icon: '\u25d7', category: 'print', tags: 'retro \u00b7 color', cell: [6, 16] },
  { id: 'sketch', name: 'Sketch', icon: '\u270e', category: 'print', tags: 'mono \u00b7 minimal', cell: [6, 18] },
  { id: 'engraving', name: 'Engraving', icon: '\u2263', category: 'print', tags: 'mono \u00b7 retro', cell: [5, 14] },
  { id: 'warhol', name: 'Warhol', icon: '\u229e', category: 'print', tags: 'color \u00b7 retro', cell: [8, 22] },
  { id: 'cyanotype', name: 'Cyanotype', icon: '\u25eb', category: 'print', tags: 'retro \u00b7 color', cell: [6, 20] },
  { id: 'woodblock', name: 'Woodblock', icon: '\u2740', category: 'print', tags: 'retro \u00b7 color', cell: [8, 22] },
  { id: 'posterize', name: 'Posterize', icon: '\u25b1', category: 'print', tags: 'color \u00b7 retro', cell: [8, 24] },
  { id: 'mezzotint', name: 'Mezzotint', icon: '\u259a', category: 'print', tags: 'retro \u00b7 mono', cell: [3, 9] },
  { id: 'pointillize', name: 'Pointillize', icon: '\u28ff', category: 'print', tags: 'color \u00b7 retro', cell: [6, 16] },
  { id: 'cmykDrops', name: 'CMYK Drops', icon: '\u25c9', category: 'print', tags: 'color \u00b7 retro', cell: [6, 18], featured: true },

  /* ── Geometric ── */
  { id: 'crosshatch', name: 'Cross', icon: '\u2715', category: 'geometric', tags: 'geometric \u00b7 mono', cell: [8, 22], core: true },
  { id: 'diamond', name: 'Diamond', icon: '\u25c7', category: 'geometric', tags: 'geometric \u00b7 mono', cell: [5, 20], core: true },
  { id: 'lines', name: 'Lines', icon: '\u2630', category: 'geometric', tags: 'minimal \u00b7 geometric', cell: [4, 16], core: true },
  { id: 'diagonal', name: 'Diagonal', icon: '\u2571', category: 'geometric', tags: 'geometric \u00b7 minimal', cell: [6, 18], core: true },
  { id: 'specimen', name: 'Specimen', icon: '\u229e', category: 'geometric', tags: 'geometric \u00b7 color', cell: [8, 24], featured: true },
  { id: 'lowPoly', name: 'Low Poly', icon: '\u25fa', category: 'geometric', tags: 'geometric \u00b7 minimal', cell: [8, 26] },
  { id: 'droste', name: 'Droste', icon: '\u27f3', category: 'geometric', tags: 'geometric \u00b7 glitch', cell: [3, 12] },
  { id: 'truchet', name: 'Truchet', icon: '\u259a', category: 'geometric', tags: 'geometric \u00b7 mono', cell: [8, 26] },
  { id: 'isoExtrude', name: 'Iso Extrude', icon: '\u2b22', category: 'geometric', tags: 'geometric \u00b7 retro', cell: [8, 24] },
  { id: 'flowField', name: 'Flow Field', icon: '\u224b', category: 'geometric', tags: 'organic \u00b7 mono', cell: [4, 14] },
  { id: 'lattice', name: 'Lattice', icon: '\u25a6', category: 'geometric', tags: 'organic \u00b7 color', cell: [6, 20] },
  { id: 'topography', name: 'Topography', icon: '\u223f', category: 'geometric', tags: 'organic \u00b7 geometric', cell: [5, 18] },
  { id: 'forms', name: 'Forms', icon: '\u273d', category: 'geometric', tags: 'color \u00b7 organic', cell: [6, 20] },
  { id: 'schematic', name: 'Schematic', icon: '\u271b', category: 'geometric', tags: 'geometric \u00b7 minimal', cell: [6, 20], featured: true },
  { id: 'neonGrid', name: 'Neon Grid', icon: '\u25a6', category: 'geometric', tags: 'color \u00b7 geometric', cell: [4, 16] },

  /* ── Distort ── */
  { id: 'smudge', name: 'Smudge', icon: '\u3030', category: 'distort', tags: 'organic \u00b7 color', cell: [3, 14], filter: true },
  { id: 'pinch', name: 'Pinch', icon: '\u2299', category: 'distort', tags: 'geometric \u00b7 minimal', cell: [3, 14], filter: true },
  { id: 'spherize', name: 'Spherize', icon: '\u25cd', category: 'distort', tags: 'geometric \u00b7 minimal', cell: [3, 14], filter: true },
  { id: 'twirl', name: 'Twirl', icon: '\u25c9', category: 'distort', tags: 'geometric \u00b7 organic', cell: [3, 14], filter: true },
  { id: 'zigzag', name: 'ZigZag', icon: '\u2307', category: 'distort', tags: 'geometric \u00b7 organic', cell: [3, 14], filter: true },
  { id: 'ripple', name: 'Ripple', icon: '\u2248', category: 'distort', tags: 'geometric \u00b7 organic', cell: [3, 14], filter: true },
  { id: 'polar', name: 'Polar', icon: '\u25ce', category: 'distort', tags: 'geometric \u00b7 minimal', cell: [3, 12], filter: true },
  { id: 'shear', name: 'Shear', icon: '\u21d4', category: 'distort', tags: 'geometric \u00b7 minimal', cell: [3, 14], filter: true },

  /* ── Blur & Focus ── */
  { id: 'motionBlur', name: 'Motion Blur', icon: '\u21c9', category: 'focus', tags: 'minimal \u00b7 organic', cell: [2, 8], filter: true },
  { id: 'tiltShift', name: 'Tilt-Shift', icon: '\u2299', category: 'focus', tags: 'minimal \u00b7 color', cell: [2, 8], filter: true },
  { id: 'gaussianBlur', name: 'Gaussian Blur', icon: '\u25cd', category: 'focus', tags: 'minimal \u00b7 organic', cell: [2, 8], filter: true },
  { id: 'radialBlur', name: 'Radial Blur', icon: '\u25ce', category: 'focus', tags: 'minimal \u00b7 organic', cell: [2, 8], filter: true },

  /* ── Glitch & Signal ── */
  { id: 'crtScreen', name: 'CRT Screen', icon: '\u2593', category: 'glitch', tags: 'retro \u00b7 color', cell: [2, 9], filter: true },
  { id: 'pixelSort', name: 'Pixel Sort', icon: '\u25a7', category: 'glitch', tags: 'glitch \u00b7 color', cell: [2, 9], filter: true },
  { id: 'forensics', name: 'Forensics', icon: '\u229a', category: 'glitch', tags: 'mono \u00b7 color', cell: [2, 8], filter: true },
  { id: 'digitalDistortion', name: 'Digital Distortion', icon: '\u2592', category: 'glitch', tags: 'glitch \u00b7 color', cell: [2, 9], filter: true },
  { id: 'datamosh', name: 'Datamosh', icon: '\u259e', category: 'glitch', tags: 'glitch \u00b7 color', cell: [2, 9], filter: true },
  { id: 'lofi', name: 'Lofi', icon: '\u2592', category: 'glitch', tags: 'retro \u00b7 color', cell: [3, 12], filter: true },
  { id: 'rgbSplit', name: 'RGB Split', icon: '\u25d0', category: 'glitch', tags: 'glitch \u00b7 color', cell: [2, 9], filter: true },
  { id: 'scanline', name: 'Scanline', icon: '\u2630', category: 'glitch', tags: 'retro \u00b7 glitch', cell: [2, 8], filter: true },
  { id: 'thermal', name: 'Thermal', icon: '\u25c9', category: 'glitch', tags: 'color \u00b7 glitch', cell: [4, 14], filter: true },
  { id: 'beacon', name: 'Beacon', icon: '\u2726', category: 'glitch', tags: 'color \u00b7 dense', cell: [3, 12], filter: true },

  /* ── Light & Color ── */
  { id: 'disco', name: 'Disco', icon: '\u25c8\u25c9\u25c7', category: 'light', tags: 'glitch \u00b7 color', cell: [8, 26], core: true },
  { id: 'anaglyph3d', name: 'Anaglyph 3D', icon: '\u25d1', category: 'light', tags: 'retro \u00b7 color', cell: [3, 12], filter: true },
  { id: 'gradientMap', name: 'Gradient Map', icon: '\u2b12', category: 'light', tags: 'color \u00b7 retro', cell: [3, 14], filter: true },
  { id: 'prism', name: 'Prism', icon: '\u2727', category: 'light', tags: 'geometric \u00b7 color', cell: [2, 10], filter: true },
  { id: 'dreamdust', name: 'Dreamdust', icon: '\u2725', category: 'light', tags: 'organic \u00b7 color', cell: [3, 12], filter: true },
  { id: 'lightWind', name: 'Light Wind', icon: '\u0f04', category: 'light', tags: 'color \u00b7 organic', cell: [3, 12], filter: true },
  { id: 'kaleidoscope', name: 'Kaleidoscope', icon: '\u273a', category: 'light', tags: 'color \u00b7 organic', cell: [3, 12], filter: true },
  { id: 'warpbloom', name: 'Warpbloom', icon: '\u2743', category: 'light', tags: 'organic \u00b7 color', cell: [3, 12], filter: true },
  { id: 'duotone', name: 'Duotone', icon: '\u25d1', category: 'light', tags: 'color \u00b7 minimal', cell: [3, 14], filter: true },
  { id: 'edgeGlow', name: 'Edge Glow', icon: '\u25c7', category: 'light', tags: 'glitch \u00b7 color', cell: [2, 8], filter: true },
  { id: 'aberration', name: 'Aberration', icon: '\u25c9', category: 'light', tags: 'color \u00b7 organic', cell: [2, 10], filter: true, featured: true },

  /* ── Glass ── */
  { id: 'frostedGlass', name: 'Frosted Glass', icon: '\u25a9', category: 'glass', tags: 'minimal \u00b7 organic', cell: [3, 12], filter: true },
  { id: 'tintedGlass', name: 'Tinted Glass', icon: '\u25c8', category: 'glass', tags: 'color \u00b7 geometric', cell: [4, 16], filter: true },
  { id: 'shatter', name: 'Shatter', icon: '\u2756', category: 'glass', tags: 'geometric \u00b7 glitch', cell: [4, 16], filter: true },
  { id: 'vitrine', name: 'Vitrine', icon: '\u25a6', category: 'glass', tags: 'organic \u00b7 color', cell: [4, 16], filter: true },
  { id: 'glassOrb', name: 'Glass Orb', icon: '\u2b24', category: 'glass', tags: 'color \u00b7 organic', cell: [4, 16], filter: true, featured: true },
  { id: 'flutedGlass', name: 'Fluted Glass', icon: '\u2a40', category: 'glass', tags: 'color \u00b7 organic', cell: [4, 16], filter: true, featured: true },
  { id: 'crossReeded', name: 'Cross Reeded', icon: '\u25a6', category: 'glass', tags: 'geometric \u00b7 dense', cell: [4, 16], filter: true },
  { id: 'hammered', name: 'Hammered', icon: '\u25a8', category: 'glass', tags: 'organic \u00b7 dense', cell: [4, 16], filter: true },
  { id: 'diamondGlass', name: 'Diamond Glass', icon: '\u25c6', category: 'glass', tags: 'geometric \u00b7 color', cell: [6, 20], filter: true },
  { id: 'hexagon', name: 'Hexagon', icon: '\u2b21', category: 'glass', tags: 'geometric \u00b7 minimal', cell: [6, 20], filter: true },
  { id: 'rippleGlass', name: 'Ripple', icon: '\u25ce', category: 'glass', tags: 'organic \u00b7 minimal', cell: [4, 16], filter: true },
  { id: 'iceCrackle', name: 'Ice Crackle', icon: '\u2744', category: 'glass', tags: 'organic \u00b7 dense', cell: [4, 16], filter: true },
  { id: 'chevronPrism', name: 'Chevron Prism', icon: '\u2227', category: 'glass', tags: 'geometric \u00b7 color', cell: [4, 16], filter: true },
  { id: 'seedyBubbles', name: 'Seedy Bubbles', icon: '\u2059', category: 'glass', tags: 'organic \u00b7 minimal', cell: [4, 16], filter: true },
  { id: 'glassPixel', name: 'Glass Pixel', icon: '\u25a9', category: 'glass', tags: 'geometric \u00b7 retro', cell: [5, 18], filter: true },
  { id: 'jello', name: 'Jello', icon: '\u25cd', category: 'glass', tags: 'organic \u00b7 color', cell: [4, 16], filter: true },

  /* ── Material & Texture ── */
  { id: 'waves', name: 'Waves', icon: '\u2248', category: 'material', tags: 'organic \u00b7 color', cell: [4, 16], filter: true },
  { id: 'oilPaint', name: 'Oil Paint', icon: '\u274b', category: 'material', tags: 'organic \u00b7 color', cell: [5, 18], filter: true },
  { id: 'watercolor', name: 'Watercolor', icon: '\u274d', category: 'material', tags: 'organic \u00b7 color', cell: [5, 18], filter: true },
  { id: 'chrome', name: 'Chrome', icon: '\u25d0', category: 'material', tags: 'color \u00b7 geometric', cell: [4, 16], filter: true },
  { id: 'thinFilm', name: 'Thin-Film', icon: '\u25cd', category: 'material', tags: 'color \u00b7 organic', cell: [4, 16], filter: true },
  { id: 'marble', name: 'Marble', icon: '\u2756', category: 'material', tags: 'organic \u00b7 color', cell: [5, 18], filter: true },
  { id: 'moltenMetal', name: 'Molten Metal', icon: '\u25c8', category: 'material', tags: 'organic \u00b7 color', cell: [5, 18], filter: true },
  { id: 'crystallize', name: 'Crystallize', icon: '\u25c8', category: 'material', tags: 'geometric \u00b7 color', cell: [4, 16], filter: true },
  { id: 'emboss', name: 'Emboss', icon: '\u25ea', category: 'material', tags: 'mono \u00b7 geometric', cell: [3, 12], filter: true },
];

export function styleById(id) {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}

export const DITHER_ALGOS = ['floyd', 'atkinson', 'sierra', 'stucki', 'burkes', 'bayer2', 'bayer4', 'bayer8'];

// Slider definitions — every one of these really changes the render.
export const SLIDERS = [
  { key: 'cellSize', label: 'Cell size', min: 2, max: 40, step: 1, group: 'Shape' },
  { key: 'fontScale', label: 'Glyph scale', min: 0.5, max: 2, step: 0.05, group: 'Shape' },
  { key: 'spacing', label: 'Spacing', min: 0, max: 8, step: 1, group: 'Shape' },
  { key: 'rotation', label: 'Angle', min: -45, max: 45, step: 1, group: 'Shape' },
  { key: 'threshold', label: 'Threshold', min: 0, max: 255, step: 1, group: 'Tone' },
  { key: 'brightness', label: 'Brightness', min: -70, max: 70, step: 1, group: 'Tone' },
  { key: 'contrast', label: 'Contrast', min: 0.4, max: 2.2, step: 0.05, group: 'Tone' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.05, group: 'Tone' },
  { key: 'jitter', label: 'Motion', min: 0, max: 1, step: 0.05, group: 'Tone' },
];

// Cell-size ranges per style — keeps each renderer in its readable band.
const CELL_RANGE = {
  characters: [5, 16],
  animatedAscii: [5, 14],
  matrix: [6, 14],
  dither: [2, 8],
  pixel: [6, 26],
  mosaic: [8, 30],
  dots: [6, 22],
  halftone: [8, 24],
  crosshatch: [8, 22],
  diagonal: [6, 18],
  diamond: [5, 20],
  lines: [4, 16],
  lego: [10, 26],
  disco: [8, 26],
  mixed: [8, 20],
};

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const between = (rng, a, b) => a + rng() * (b - a);
const round = (v, step) => Math.round(v / step) * step;

// A mixed renderer stacks two or three different renderers in horizontal bands.
function randomBands(rng, styleId) {
  if (styleId !== 'mixed') return null;
  const pool = ['characters', 'dither', 'dots', 'pixel', 'mosaic', 'halftone', 'crosshatch', 'lego', 'disco', 'diagonal', 'diamond', 'lines'];
  const shuffled = pool.sort(() => rng() - 0.5);
  const count = 2 + Math.floor(rng() * 2);
  const bands = [];
  for (let i = 0; i < count; i++) {
    bands.push({
      renderer: shuffled[i % shuffled.length],
      from: i / count,
      to: (i + 1) / count,
    });
  }
  return bands;
}

/**
 * Build a full, controlled parameter set.
 * @param {object|null} prev  previous params (used to avoid repeating the same style)
 * @param {object} opts       { style, palette, seed }
 */
export function randomizeParams(prev, opts = {}) {
  const seed = opts.seed != null ? opts.seed : Math.floor(Math.random() * 900000) + 100000;
  const rng = makeRng(seed);

  let styleId = opts.style;
  if (!styleId) {
    // A plain randomize stays inside the core set — the library's other shelves
    // are there to be browsed deliberately, not landed on by accident.
    const pool = STYLES.filter((s) => s.core).map((s) => s.id).filter((id) => id !== prev?.style);
    styleId = pick(rng, pool);
  }

  // The source's own colours stay the default more often than not, so a fresh
  // look still looks like the picture that went in.
  const palette = opts.palette
    ? paletteById(opts.palette)
    : rng() < 0.35
      ? paletteById('original')
      : pick(rng, PALETTES);
  const def = styleById(styleId);
  const [cMin, cMax] = def.cell || CELL_RANGE[styleId] || [6, 20];

  const glyphStyle = styleId === 'characters' || styleId === 'animatedAscii' || styleId === 'matrix' || styleId === 'mixed' || styleId === 'asciiStudio';
  const charSet = pick(rng, CHAR_SET_IDS);
  const forcedCharSet =
    styleId === 'matrix' ? 'matrix' : styleId === 'braille' ? 'braille' : styleId === 'block' ? 'blocks' : glyphStyle ? charSet : 'classic';

  return {
    style: styleId,
    seed,
    palette: palette.id,
    paletteObj: palette,
    charSet: forcedCharSet,
    cellSize: Math.round(between(rng, cMin, cMax)),
    // Marks stay on the light side of full weight — a fresh look should read as
    // the picture, not as a wall of ink over it.
    fontScale: round(between(rng, 0.8, 1), 0.05),
    spacing: styleId === 'mosaic' || styleId === 'dots' ? Math.round(between(rng, 0, 5)) : 0,
    rotation: styleId === 'mosaic' || styleId === 'halftone' || styleId === 'crosshatch' ? Math.round(between(rng, -25, 25)) : 0,
    threshold: 128,
    brightness: Math.round(between(rng, -6, 6)),
    contrast: round(between(rng, 0.92, 1.12), 0.05),
    saturation: round(between(rng, 0.85, 1.15), 0.05),
    jitter: round(between(rng, 0.1, 0.45), 0.05),
    // 'auto' derives the ground from the image's own mean colour, so bright
    // pictures stay bright and dark ones stay dark.
    plate: 'auto',
    ditherAlgo: pick(rng, DITHER_ALGOS),
    dotShape: pick(rng, ['circle', 'square', 'diamond']),
    halftoneMode: pick(rng, ['mono', 'rgb']),
    hatchAngles: pick(rng, [[45], [45, -45], [45, -45, 0], [45, -45, 0, 90]]),
    bands: randomBands(rng, styleId),
  };
}

// SURPRISE ME — deliberately unusual combinations, still faithful renders.
export function surpriseParams(prev) {
  const rng = makeRng(Math.floor(Math.random() * 900000) + 100000);
  const combos = [
    { style: 'characters', palette: 'cyan' },
    { style: 'characters', palette: 'dusk' },
    { style: 'characters', palette: 'terminal' },
    { style: 'mixed', palette: 'neon' },
    { style: 'dither', palette: 'mono' },
    { style: 'dots', palette: 'sunset' },
    { style: 'mosaic', palette: 'nova' },
    { style: 'halftone', palette: 'purple' },
    { style: 'lego', palette: 'amber' },
    { style: 'pixel', palette: 'ice' },
    { style: 'disco', palette: 'magenta' },
    { style: 'crosshatch', palette: 'original' },
    { style: 'matrix', palette: 'green' },
  ];
  const combo = pick(rng, combos.filter((c) => c.style !== prev?.style));
  const params = randomizeParams(prev, {
    style: combo.style,
    palette: combo.palette,
    seed: Math.floor(Math.random() * 900000) + 100000,
  });
  if (params.style === 'mixed' && !params.bands) params.bands = randomBands(makeRng(params.seed), 'mixed');
  return params;
}

export function styleLabel(params) {
  const s = styleById(params.style);
  if (params.style === 'mixed' && params.bands) {
    return 'MIXED · ' + params.bands.map((b) => styleById(b.renderer).name).join(' + ');
  }
  return s.name;
}