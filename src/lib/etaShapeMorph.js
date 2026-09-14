// Shape morphing engine: every shape is sampled into the same polar
// parametrization, so any pair of shapes interpolates smoothly.
const TAU = Math.PI * 2;
const SAMPLES = 96;

export const MORPH_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star', 'heart'];
export const MORPH_EASINGS = ['ease-in-out', 'ease-in', 'ease-out', 'linear'];

const ngon = (n, rot) => (a) => {
  const sec = TAU / n;
  const local = (((a - rot) % sec) + sec) % sec;
  return Math.cos(Math.PI / n) / Math.cos(local - Math.PI / n);
};

const heartPoint = (t) => ({
  x: 16 * Math.pow(Math.sin(t), 3),
  y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
});

const radiusFns = {
  circle: () => 1,
  square: (a) => 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))),
  triangle: ngon(3, -Math.PI / 2),
  diamond: ngon(4, -Math.PI / 2),
  pentagon: ngon(5, -Math.PI / 2),
  hexagon: ngon(6, 0),
  star: (a) => 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.cos(5 * a), 0.6),
};

function heartRadii() {
  const dense = 720;
  let cx = 0; let cy = 0;
  const pts = [];
  for (let i = 0; i < dense; i += 1) { const p = heartPoint((i * TAU) / dense); pts.push(p); cx += p.x; cy += p.y; }
  cx /= dense; cy /= dense;
  const polar = pts.map((p) => {
    const x = p.x - cx; const y = -(p.y - cy);
    return { a: Math.atan2(y, x), r: Math.hypot(x, y) || 1e-6 };
  });
  let maxR = 0;
  polar.forEach((p) => { maxR = Math.max(maxR, p.r); });
  return Array.from({ length: SAMPLES }, (_, i) => {
    const a = (i * TAU) / SAMPLES;
    let best = polar[0]; let diff = Infinity;
    for (const p of polar) {
      const d = Math.abs((((p.a - a + Math.PI) % TAU) + TAU) % TAU - Math.PI);
      if (d < diff) { diff = d; best = p; }
    }
    return best.r / maxR;
  });
}

const radiiCache = {};
export function shapeRadii(shape) {
  const name = MORPH_SHAPES.includes(shape) ? shape : 'circle';
  if (!radiiCache[name]) {
    if (name === 'heart') radiiCache[name] = heartRadii();
    else {
      const fn = radiusFns[name];
      let maxR = 0;
      const raw = Array.from({ length: SAMPLES }, (_, i) => { const r = fn((i * TAU) / SAMPLES); maxR = Math.max(maxR, r); return r; });
      radiiCache[name] = raw.map((r) => r / maxR);
    }
  }
  return radiiCache[name];
}

export const DEFAULT_MORPH_KEYFRAMES = (duration = 3) => [
  { time: 0, shape: 'circle', x: 0, y: 0, rotate: 0, scale: 1, hold: 0.25, easing: 'ease-in-out' },
  { time: duration, shape: 'square', x: 0, y: 0, rotate: 90, scale: 1, hold: 0, easing: 'ease-in-out' },
];

export const getMorphKeyframes = (advanced, duration = 3) => {
  const frames = (advanced?.shapeKeyframes || [])
    .filter((f) => f && MORPH_SHAPES.includes(f.shape))
    .map((f) => ({ ...f, time: Number(f.time) || 0 }))
    .sort((a, b) => a.time - b.time);
  return frames.length > 1 ? frames : DEFAULT_MORPH_KEYFRAMES(duration);
};

export const easeMorph = (mode, t) => {
  const c = Math.max(0, Math.min(1, t));
  if (mode === 'linear') return c;
  if (mode === 'ease-in') return c * c;
  if (mode === 'ease-out') return 1 - (1 - c) * (1 - c);
  return c * c * (3 - 2 * c);
};

const lerp = (a, b, t) => a + (b - a) * t;

function buildState(a, b, t) {
  const from = shapeRadii(a.shape);
  const to = shapeRadii(b.shape);
  const radii = from.map((r, i) => lerp(r, to[i], t));
  return {
    radii,
    morphT: t,
    fromShape: a.shape,
    toShape: b.shape,
    hold: Number(b.hold ?? 0.25),
    easing: b.easing || 'ease-in-out',
    x: lerp(Number(a.x) || 0, Number(b.x) || 0, t),
    y: lerp(Number(a.y) || 0, Number(b.y) || 0, t),
    rotate: lerp(Number(a.rotate) || 0, Number(b.rotate) || 0, t),
    scale: lerp(Number(a.scale) || 1, Number(b.scale) || 1, t),
  };
}

export function sampleShapeMorph(keyframes, time, duration = 3) {
  const frames = (keyframes?.length > 1 ? keyframes : DEFAULT_MORPH_KEYFRAMES(duration)).slice().sort((a, b) => a.time - b.time);
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (time <= first.time) return buildState(first, frames[1] || first, 0);
  if (time >= last.time) return buildState(frames[frames.length - 2] || first, last, 1);
  let i = 0;
  while (i < frames.length - 2 && frames[i + 1].time <= time) i += 1;
  const a = frames[i];
  const b = frames[i + 1];
  const span = Math.max(1e-6, b.time - a.time);
  const raw = (time - a.time) / span;
  const hold = Math.max(0, Math.min(0.8, Number(b.hold ?? 0.25)));
  const morphRaw = raw <= hold ? 0 : (raw - hold) / (1 - hold);
  return buildState(a, b, easeMorph(b.easing || 'ease-in-out', morphRaw));
}

export function buildMorphPath(radii, radius = 90) {
  const pts = radii.map((r, i) => {
    const a = (i * TAU) / radii.length;
    return `${(Math.cos(a) * r * radius).toFixed(2)} ${(Math.sin(a) * r * radius).toFixed(2)}`;
  });
  return `M ${pts.join(' L ')} Z`;
}

// Digest of the user's manual morph iterations, fed back to the ETA director
// so it learns their preferred shapes, pacing, and palette over time.
export function summarizeMorphLearnings(records = []) {
  const usable = records.filter((r) => r && r.shape_sequence);
  if (!usable.length) return '';
  const counts = {};
  const palettes = {};
  let holds = 0; let holdN = 0; let shapes = 0;
  usable.forEach((r) => {
    const seq = String(r.shape_sequence).split('→').filter(Boolean);
    seq.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    shapes += seq.length;
    if (Number.isFinite(Number(r.hold))) { holds += Number(r.hold); holdN += 1; }
    if (r.palette) palettes[r.palette] = (palettes[r.palette] || 0) + 1;
  });
  const topShapes = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s]) => s).join(', ');
  const palette = Object.entries(palettes).sort((a, b) => b[1] - a[1])[0]?.[0];
  const hold = holdN ? (holds / holdN).toFixed(2) : null;
  return [
    `Most-used shapes: ${topShapes}.`,
    hold ? `Typical hold before each morph: ~${hold}s.` : null,
    palette ? `Preferred palette: ${palette}.` : null,
    `Average ${Math.round(shapes / usable.length)} shapes per morph sequence across ${usable.length} captured iteration(s).`,
  ].filter(Boolean).join(' ');
}