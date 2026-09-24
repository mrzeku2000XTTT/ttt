// Morph Motion Studio — deterministic animation engine.
//
// The AI director only ever writes scene JSON; THIS is what actually animates it.
// Everything here is pure and time-based: given a scene and a time in seconds it
// produces exact values, so the FINAL pane, the VIEWPORT pane and any future
// export all render identical frames.

export const FPS = 30;
export const DEFAULT_DURATION = 6;

export const DEFAULTS = { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1, morph: 0 };
export const PROPS = Object.keys(DEFAULTS);

export const EASES = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  backOut: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
  hold: () => 0,
};
export const EASE_NAMES = Object.keys(EASES);

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

/* ------------------------------------------------------------------ shapes */
// Every shape is a unit polygon (radius 1, centred on the origin) so any two of
// them can be interpolated point-for-point — that interpolation IS the morph.

const ring = (n, fn) => Array.from({ length: n }, (_, i) => fn((i / n) * Math.PI * 2));

const polygon = (sides, offset = -Math.PI / 2) => ring(sides, (a) => [Math.cos(a + offset), Math.sin(a + offset)]);

const star = (points = 5, inner = 0.44) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 ? inner : 1;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

export const SHAPES = {
  circle: ring(96, (a) => [Math.cos(a), Math.sin(a)]),
  square: polygon(4, Math.PI / 4),
  triangle: polygon(3),
  diamond: polygon(4),
  hexagon: polygon(6),
  star: star(),
  burst: star(9, 0.62),
};
export const SHAPE_NAMES = Object.keys(SHAPES);

// Re-sample a closed polygon to n points at equal arc length, so a 3-point
// triangle and a 96-point circle become the same data shape and can blend.
export function resample(points, n = 96) {
  const pts = points;
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len });
    total += len;
  }
  const out = [];
  const step = total / n;
  let seg = 0;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const target = i * step;
    while (seg < segs.length - 1 && acc + segs[seg].len < target) {
      acc += segs[seg].len;
      seg++;
    }
    const s = segs[seg];
    const p = s.len ? (target - acc) / s.len : 0;
    out.push([s.a[0] + (s.b[0] - s.a[0]) * p, s.a[1] + (s.b[1] - s.a[1]) * p]);
  }
  return out;
}

// Rotate the target ring so the two outlines are matched at their closest
// alignment — without this, a square morphing to a star twists on itself.
function align(a, b) {
  let best = 0;
  let bestD = Infinity;
  for (let k = 0; k < b.length; k++) {
    let d = 0;
    for (let i = 0; i < a.length; i += 4) {
      const j = (i + k) % b.length;
      d += (a[i][0] - b[j][0]) ** 2 + (a[i][1] - b[j][1]) ** 2;
      if (d > bestD) break;
    }
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return b.slice(best).concat(b.slice(0, best));
}

const RING_CACHE = {};
const cachedRing = (name) => {
  if (!RING_CACHE[name]) RING_CACHE[name] = resample(SHAPES[name] || SHAPES.circle);
  return RING_CACHE[name];
};

// The morph itself: position = start × (1 − t) + end × t, per point.
export function morphPath(fromName, toName, t) {
  const a = cachedRing(fromName);
  const b = cachedRing(toName);
  if (!t) return a;
  if (t >= 1) return b;
  const aligned = ALIGN_CACHE[fromName + '>' + toName] || (ALIGN_CACHE[fromName + '>' + toName] = align(a, b));
  return a.map(([x, y], i) => [x + (aligned[i][0] - x) * t, y + (aligned[i][1] - y) * t]);
}
const ALIGN_CACHE = {};

/* --------------------------------------------------------------- keyframes */
export function sampleTrack(track, t) {
  if (!track || !track.length) return null;
  if (t <= track[0].t) return track[0].v;
  const last = track[track.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const p = (t - a.t) / span;
      const e = (EASES[a.ease] || EASES.easeInOut)(p);
      return a.v + (b.v - a.v) * e;
    }
  }
  return last.v;
}

export function sampleLayer(layer, t) {
  const out = {};
  PROPS.forEach((prop) => {
    const v = sampleTrack(layer.tracks?.[prop], t);
    out[prop] = v == null ? (layer[prop] ?? DEFAULTS[prop]) : v;
  });
  return out;
}

export function layerKeyTimes(layer) {
  const set = new Set();
  Object.values(layer.tracks || {}).forEach((list) => (list || []).forEach((k) => set.add(Math.round(k.t * 1000) / 1000)));
  return [...set].sort((a, b) => a - b);
}

export function upsertKey(layer, prop, t, v, ease = 'easeInOut') {
  const tracks = { ...(layer.tracks || {}) };
  const list = [...(tracks[prop] || [])];
  const at = Math.round(t * 1000) / 1000;
  const i = list.findIndex((k) => Math.abs(k.t - at) < 0.002);
  if (i >= 0) list[i] = { t: at, v, ease: list[i].ease || ease };
  else list.push({ t: at, v, ease });
  list.sort((a, b) => a.t - b.t);
  tracks[prop] = list;
  return { ...layer, tracks };
}

export function removeKey(layer, prop, t) {
  const tracks = { ...(layer.tracks || {}) };
  const list = (tracks[prop] || []).filter((k) => Math.abs(k.t - t) > 0.002);
  if (list.length) tracks[prop] = list;
  else delete tracks[prop];
  return { ...layer, tracks };
}

export function makeLayer(partial = {}) {
  return {
    id: `L${Math.random().toString(36).slice(2, 8)}`,
    type: 'shape',
    name: 'Shape',
    shape: 'circle',
    morphTo: 'star',
    color: '#ffffff',
    text: '',
    size: 0.2,
    visible: true,
    ...DEFAULTS,
    ...partial,
    tracks: { ...(partial.tracks || {}) },
  };
}

export function starterScene() {
  const a = makeLayer({ name: 'Circle → Star', shape: 'circle', morphTo: 'star', color: '#ffffff', size: 0.22, x: 0.34 });
  return {
    name: 'Untitled animation',
    duration: 6,
    layers: [
      {
        ...a,
        tracks: {
          morph: [{ t: 0.6, v: 0, ease: 'easeInOut' }, { t: 3, v: 1, ease: 'easeInOut' }],
          rotation: [{ t: 0, v: 0, ease: 'linear' }, { t: 6, v: 180, ease: 'linear' }],
          x: [{ t: 0, v: 0.34, ease: 'easeInOut' }, { t: 3, v: 0.62, ease: 'easeInOut' }, { t: 6, v: 0.34, ease: 'easeInOut' }],
        },
      },
      makeLayer({
        name: 'Title',
        type: 'text',
        text: 'MORPH',
        color: '#ffffff',
        size: 0.2,
        x: 0.5,
        y: 0.82,
        opacity: 0,
        tracks: {
          opacity: [{ t: 0.2, v: 0, ease: 'easeOut' }, { t: 1.4, v: 1, ease: 'easeOut' }],
          y: [{ t: 0.2, v: 0.88, ease: 'easeOut' }, { t: 1.4, v: 0.82, ease: 'easeOut' }],
        },
      }),
    ],
  };
}

/* ---------------------------------------------------------------- renderer */
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";
const AXIS = { x: '#ff4d4d', y: '#3ddc84', z: '#4d8dff' };

export function drawScene(ctx, { scene, time, W, H, mode = 'final', selectedId = null, grid = false }) {
  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, W, H);
  if (grid && mode === 'edit') drawGrid(ctx, W, H);
  scene.layers.forEach((layer) => {
    if (layer.visible !== false) drawLayer(ctx, layer, time, W, H);
  });
  if (mode === 'edit' && selectedId) {
    const layer = scene.layers.find((l) => l.id === selectedId);
    if (layer && layer.visible !== false) drawGizmo(ctx, layer, time, W, H);
  }
}

function drawGrid(ctx, W, H) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.11)';
  [W / 3, (2 * W) / 3].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  });
  [H / 3, (2 * H) / 3].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawLayer(ctx, layer, time, W, H) {
  const p = sampleLayer(layer, time);
  const base = Math.min(W, H) * layer.size;
  ctx.save();
  ctx.globalAlpha = clamp(p.opacity, 0, 1);
  ctx.translate(p.x * W, p.y * H);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(p.scale, p.scale);

  if (layer.type === 'text') {
    const fs = base * 0.62;
    ctx.fillStyle = layer.color;
    ctx.font = `700 ${fs}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(layer.text || 'TEXT', 0, 0);
  } else {
    const pts = morphPath(layer.shape, layer.morphTo, clamp(p.morph, 0, 1));
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * base, y * base);
      else ctx.lineTo(x * base, y * base);
    });
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }
  ctx.restore();
}

// Handle positions in (un-zoomed) canvas space — used for both drawing and hit tests.
export function gizmoHandles(layer, time, W, H) {
  const p = sampleLayer(layer, time);
  const cx = p.x * W;
  const cy = p.y * H;
  const len = Math.max(80, Math.min(W, H) * 0.17);
  return [
    { id: 'move', x: cx, y: cy },
    { id: 'x', x: cx + len, y: cy },
    { id: 'y', x: cx, y: cy + len },
    { id: 'z', x: cx + len * 0.72, y: cy - len * 0.72 },
  ];
}

function drawGizmo(ctx, layer, time, W, H) {
  const p = sampleLayer(layer, time);
  const [move, hx, hy, hz] = gizmoHandles(layer, time, W, H);
  const r = Math.min(W, H) * layer.size * p.scale * 1.2;
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(move.x - r, move.y - r, r * 2, r * 2);
  ctx.setLineDash([]);
  [[hx, AXIS.x], [hy, AXIS.y], [hz, AXIS.z]].forEach(([h, color]) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(move.x, move.y);
    ctx.lineTo(h.x, h.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0a0a0a';
    ctx.stroke();
  });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(move.x - 7, move.y - 7, 14, 14);
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 3;
  ctx.strokeRect(move.x - 7, move.y - 7, 14, 14);
  ctx.restore();
}

export function hitLayer(scene, time, x, y, W, H) {
  for (let i = scene.layers.length - 1; i >= 0; i--) {
    const l = scene.layers[i];
    if (l.visible === false) continue;
    const p = sampleLayer(l, time);
    const r = Math.min(W, H) * l.size * p.scale * 1.2;
    if (Math.hypot(x - p.x * W, y - p.y * H) <= r) return l.id;
  }
  return null;
}

/* ----------------------------------------------------------------- helpers */
export function timecode(t, fps = FPS) {
  const total = Math.max(0, t);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const f = Math.floor((total % 1) * fps);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

// Turn the AI director's keyframe lists into engine tracks.
export function keysToTracks(keys, ease = 'easeInOut') {
  const tracks = {};
  Object.entries(keys || {}).forEach(([prop, list]) => {
    if (!PROPS.includes(prop) || !Array.isArray(list)) return;
    const cleaned = list
      .filter((k) => k && Number.isFinite(Number(k.t)) && Number.isFinite(Number(k.v)))
      .map((k) => ({ t: Math.max(0, Number(k.t)), v: Number(k.v), ease: EASES[k.ease] ? k.ease : ease }))
      .sort((a, b) => a.t - b.t);
    if (cleaned.length) tracks[prop] = cleaned;
  });
  return tracks;
}