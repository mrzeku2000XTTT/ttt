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
};

export const CHAR_SET_IDS = Object.keys(CHAR_SETS);

export const STYLES = [
  { id: 'characters', name: 'Characters' },
  { id: 'dither', name: 'Dither' },
  { id: 'mixed', name: 'Mixed' },
  { id: 'pixel', name: 'Pixel Art' },
  { id: 'mosaic', name: 'Mosaic' },
  { id: 'dots', name: 'Dots' },
  { id: 'halftone', name: 'Halftone' },
  { id: 'crosshatch', name: 'Cross' },
  { id: 'lego', name: 'LEGO' },
  { id: 'disco', name: 'Disco' },
  { id: 'matrix', name: 'Matrix', animated: true },
  { id: 'animatedAscii', name: 'Animated ASCII', animated: true },
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
  characters: [6, 20],
  animatedAscii: [6, 18],
  matrix: [7, 16],
  dither: [2, 8],
  pixel: [6, 26],
  mosaic: [8, 30],
  dots: [6, 22],
  halftone: [8, 24],
  crosshatch: [8, 22],
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
  const pool = ['characters', 'dither', 'dots', 'pixel', 'mosaic', 'halftone', 'crosshatch', 'lego', 'disco'];
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
    const pool = STYLES.map((s) => s.id).filter((id) => id !== prev?.style);
    styleId = pick(rng, pool);
  }

  const palette = opts.palette ? paletteById(opts.palette) : pick(rng, PALETTES);
  const [cMin, cMax] = CELL_RANGE[styleId] || [6, 20];

  const glyphStyle = styleId === 'characters' || styleId === 'animatedAscii' || styleId === 'matrix' || styleId === 'mixed';
  const charSet = pick(rng, CHAR_SET_IDS);

  return {
    style: styleId,
    seed,
    palette: palette.id,
    paletteObj: palette,
    charSet: styleId === 'matrix' ? 'matrix' : glyphStyle ? charSet : 'classic',
    cellSize: Math.round(between(rng, cMin, cMax)),
    fontScale: round(between(rng, 0.9, 1.35), 0.05),
    spacing: styleId === 'mosaic' || styleId === 'dots' ? Math.round(between(rng, 0, 5)) : 0,
    rotation: styleId === 'mosaic' || styleId === 'halftone' || styleId === 'crosshatch' ? Math.round(between(rng, -25, 25)) : 0,
    threshold: 128,
    brightness: Math.round(between(rng, -12, 12)),
    contrast: round(between(rng, 0.9, 1.35), 0.05),
    saturation: round(between(rng, 0.7, 1.4), 0.05),
    jitter: round(between(rng, 0.2, 0.8), 0.05),
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