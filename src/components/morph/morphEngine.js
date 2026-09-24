// Morph Motion Studio — deterministic animation engine.
//
// The AI director only ever writes scene JSON; THIS is what actually animates it.
// Everything here is pure and time-based: given a scene and a time in seconds it
// produces exact values, so the FINAL pane, the VIEWPORT pane and any future
// export all render identical frames.

export const FPS = 30;
export const DEFAULT_DURATION = 6;

// Every animatable property. `w/h/radius` are a UI card's box, `textSize` and
// `textOpacity` the label inside it, `draw` a path being drawn on (0→1).
export const DEFAULTS = {
  x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1, morph: 0, glow: 0,
  w: 0.34, h: 0.12, radius: 0.05, textSize: 0, textOpacity: 1, draw: 1,
};
export const PROPS = Object.keys(DEFAULTS);

// A real damped spring, as an interpolation curve. Overshoot becomes a property
// of the physics instead of a hand-drawn number — this is the bridge between an
// "animation behaviour" (see morphDynamics) and the keyframes the renderer plays.
export function springCurve(stiffness = 180, damping = 12, mass = 1) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = w0 * Math.sqrt(Math.max(0.0001, 1 - zeta * zeta));
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  };
}

const bounceOut = (t) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

const elasticOut = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

// A real cubic-bezier, solved by bisection — the curve a designer would type.
export function cubicBezier(x1, y1, x2, y2) {
  const bx = (t) => 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3;
  const by = (t) => 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = p;
    for (let i = 0; i < 22; i++) {
      t = (lo + hi) / 2;
      if (bx(t) < p) lo = t;
      else hi = t;
    }
    return by(t);
  };
}

export const EASES = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  backOut: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
  backIn: (t) => 2.7 * t ** 3 - 1.7 * t ** 2,
  anticipate: (t) => 2.7 * t ** 3 - 1.7 * t ** 2,
  cubicBezier: cubicBezier(0.42, 0, 0.2, 1),
  spring: springCurve(180, 12),
  bounce: bounceOut,
  elastic: elasticOut,
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
  spark: star(4, 0.18),
  kite: [[0, -1], [0.34, 0], [0, 1], [-0.34, 0]],
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
    subtext: '',
    textColor: '#0a0a0a',
    src: '',
    size: 0.2,
    visible: true,
    group: '',
    ...DEFAULTS,
    ...partial,
    tracks: { ...(partial.tracks || {}) },
  };
}

export function starterScene() {
  return diamondLogoScene();
}

// The scene the studio shipped with — kept as a preset so nothing is lost.
export function shapeDemoScene() {
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

/* -------------------------------------------------------------- test logo */
// The MVP logo: four kite-shaped points (one per corner of the mark) plus a
// centre spark. Five separate vector layers, so each point animates on its own
// AND morphs — 3s reveal, exactly to spec:
//   0.0s tiny, invisible, slightly rotated · 0.5s flying in · 1.0s formed
//   1.4s overshoot to 1.15 · 1.7s settle 0.97 · 1.9s rest
//   2.0s spin once 0→360° · 2.7s glow 0→1 · 3.0s clean static logo
const FRAME_W = 1280;
const FRAME_H = 720;

export function diamondLogoScene() {
  const CX = 0.5;
  const CY = 0.5;
  const ARM = 100; // arm length in pixels (identical on both axes)
  const R_X = ARM / FRAME_W;
  const R_Y = ARM / FRAME_H;
  const DEG = Math.PI / 180;

  const home = (deg) => ({ x: CX + R_X * Math.cos(deg * DEG), y: CY + R_Y * Math.sin(deg * DEG) });

  // Assemble from a corner → form → overshoot → settle.
  const entry = (deg, startX, startY) => {
    const h = home(deg);
    return {
      opacity: [{ t: 0, v: 0, ease: 'easeOut' }, { t: 0.5, v: 1, ease: 'easeOut' }],
      scale: [
        { t: 0, v: 0.08, ease: 'easeInOut' },
        { t: 1, v: 1, ease: 'easeOut' },
        { t: 1.4, v: 1.15, ease: 'easeOut' },
        { t: 1.7, v: 0.97, ease: 'easeInOut' },
        { t: 1.9, v: 1, ease: 'easeOut' },
      ],
      x: [
        { t: 0, v: startX, ease: 'easeInOut' },
        { t: 1, v: h.x, ease: 'easeOut' },
        { t: 1.4, v: CX + (h.x - CX) * 1.25, ease: 'easeOut' },
        { t: 1.7, v: CX + (h.x - CX) * 0.97, ease: 'easeInOut' },
        { t: 1.9, v: h.x, ease: 'easeOut' },
      ],
      y: [
        { t: 0, v: startY, ease: 'easeInOut' },
        { t: 1, v: h.y, ease: 'easeOut' },
        { t: 1.4, v: CY + (h.y - CY) * 1.25, ease: 'easeOut' },
        { t: 1.7, v: CY + (h.y - CY) * 0.97, ease: 'easeInOut' },
        { t: 1.9, v: h.y, ease: 'easeOut' },
      ],
      rotation: [{ t: 0, v: deg - 45, ease: 'easeOut' }, { t: 1, v: deg, ease: 'easeOut' }],
    };
  };

  // One full turn about the mark's centre: the arm orbits while it spins.
  const spin = (deg) => {
    const x = [];
    const y = [];
    for (let j = 0; j <= 4; j++) {
      const a = (deg + j * 90) * DEG;
      x.push({ t: 2 + j * 0.25, v: CX + R_X * Math.cos(a), ease: 'linear' });
      y.push({ t: 2 + j * 0.25, v: CY + R_Y * Math.sin(a), ease: 'linear' });
    }
    return {
      x,
      y,
      rotation: [{ t: 2, v: deg, ease: 'linear' }, { t: 3, v: deg + 360, ease: 'linear' }],
    };
  };

  const glow = [
    { t: 2.2, v: 0, ease: 'easeOut' },
    { t: 2.7, v: 1, ease: 'easeOut' },
    { t: 3, v: 0.2, ease: 'easeInOut' },
  ];

  const arm = (name, deg, startX, startY) => makeLayer({
    name,
    shape: 'kite',
    morphTo: 'spark',
    color: '#ffffff',
    size: 0.139,
    rotation: deg,
    tracks: { ...entry(deg, startX, startY), ...spin(deg), glow },
  });

  return {
    name: 'Diamond logo reveal',
    duration: 3,
    layers: [
      arm('Point · top', -90, 0.2, -0.03),
      arm('Point · right', 0, 0.8, -0.03),
      arm('Point · bottom', 90, 0.8, 1.03),
      arm('Point · left', 180, 0.2, 1.03),
      makeLayer({
        name: 'Core',
        shape: 'spark',
        morphTo: 'diamond',
        color: '#ffffff',
        size: 0.045,
        tracks: {
          opacity: [{ t: 0.9, v: 0, ease: 'easeOut' }, { t: 1.2, v: 1, ease: 'easeOut' }],
          scale: [
            { t: 0.9, v: 0.4, ease: 'backOut' },
            { t: 1.4, v: 1.15, ease: 'easeOut' },
            { t: 1.9, v: 1, ease: 'easeOut' },
          ],
          glow,
        },
      }),
    ],
  };
}

/* ------------------------------------------------------------------ images */
const IMG_CACHE = {};

// Image layers decode asynchronously, so the renderer asks for the bitmap and
// pings the surface once it is ready — the canvas then repaints with pixels.
export function imageFor(src, onReady) {
  if (!src) return null;
  let img = IMG_CACHE[src];
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    IMG_CACHE[src] = img;
    img.src = src;
  }
  if (img.complete && img.naturalWidth) return img;
  if (onReady) {
    img.addEventListener('load', onReady, { once: true });
    img.addEventListener('error', onReady, { once: true });
  }
  return null;
}

/* ---------------------------------------------------------------- renderer */
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";
const AXIS = { x: '#ff4d4d', y: '#3ddc84', z: '#4d8dff' };

export function drawScene(ctx, {
  scene, time, W, H, mode = 'final', selectedId = null, grid = false,
  onAssetReady, selectedMorphId = null, selectedTransitionId = null,
}) {
  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, W, H);
  if (grid && mode === 'edit') drawGrid(ctx, W, H);

  // Morphs resolve the layers before anything is drawn: a morph target is not a
  // separate object fading in, it is the source re-shaped — so the arrow and the
  // layers always agree about where things are.
  const resolved = resolveMorphs(scene, time);
  // A match cut sits above that: whole scenes handing over through one object.
  const cut = resolveTransitions(resolved, time, W, H);

  ctx.save();
  if (cut) applyCamera(ctx, cut.camera, W, H);

  (resolved.morphs || []).forEach((rel) => {
    drawMorphArrow(ctx, resolved, rel, time, W, H, mode === 'edit' && selectedMorphId === rel.id);
  });

  const drawOne = (layer) => drawLayer(ctx, layer, time, W, H, onAssetReady);

  resolved.layers.forEach((layer) => {
    if (layer.visible === false) return;
    if (cut) {
      // The target is never drawn on its own: the hero becomes it.
      if (cut.hidden.has(layer.id) || cut.heroId === layer.id) return;
      const a = cut.alpha.get(layer.id);
      if (a != null && a <= 0.001) return;
      const l = a != null && a < 0.999 ? withLayerAlpha(layer, time, a) : layer;
      // Scene B arrives *through* the hero while the cut is running.
      if (cut.clip && cut.reveal.has(layer.id)) {
        ctx.save();
        roundRect(ctx, cut.maskBox.left, cut.maskBox.top, cut.maskBox.w, cut.maskBox.h, cut.maskBox.radius);
        ctx.clip();
        drawOne(l);
        ctx.restore();
        return;
      }
      drawOne(l);
      return;
    }
    drawOne(layer);
  });

  if (cut) {
    // One object, continuously, becoming another.
    drawOne(cut.hero);
    if (cut.maskEdge > 0.01) drawMaskEdge(ctx, cut.maskBox, cut.maskEdge);
  }

  if (mode === 'edit') {
    if (selectedTransitionId) {
      const rel = (scene.transitions || []).find((t) => t.id === selectedTransitionId);
      if (rel) drawTransitionHighlight(ctx, resolved, rel, time, W, H);
    }
    if (selectedMorphId) {
      const rel = (scene.morphs || []).find((r) => r.id === selectedMorphId);
      if (rel) drawMorphHighlight(ctx, resolved, rel, time, W, H);
    }
    if (selectedId) {
      const layer = resolved.layers.find((l) => l.id === selectedId);
      if (layer && layer.visible !== false) drawGizmo(ctx, layer, time, W, H);
    }
  }
  ctx.restore();
}

// A layer at a fraction of its own opacity, used for scenes arriving and leaving.
function withLayerAlpha(layer, time, a) {
  const p = sampleLayer(layer, time);
  return { ...layer, tracks: {}, ...p, opacity: p.opacity * a };
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
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

function drawLayer(ctx, layer, time, W, H, onAssetReady) {
  const p = sampleLayer(layer, time);
  const base = Math.min(W, H) * layer.size;
  ctx.save();
  ctx.globalAlpha = clamp(p.opacity, 0, 1);
  ctx.translate(p.x * W, p.y * H);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(p.scale, p.scale);
  if (p.glow > 0.001) {
    ctx.shadowColor = layer.color || '#ffffff';
    ctx.shadowBlur = p.glow * 70;
  }

  if (layer.type === 'card') {
    // A UI element: a rounded box with a label and an optional line under it.
    // With artwork it becomes a media card — the image fills the rounded shape
    // and a scrim keeps the label readable on top of it.
    const w = Math.max(8, p.w * W);
    const h = Math.max(8, p.h * H);
    const r = p.radius * Math.min(W, H);
    const art = layer.src ? imageFor(layer.src, onAssetReady) : null;
    if (art) {
      ctx.save();
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.clip();
      const ar = (art.naturalWidth / art.naturalHeight) || 1;
      const scaleToFill = Math.max(w / art.naturalWidth, h / art.naturalHeight);
      const dw = art.naturalWidth * scaleToFill;
      const dh = art.naturalHeight * scaleToFill;
      ctx.drawImage(art, -dw / 2, -dh / 2, dw, dh);
      const scrim = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      scrim.addColorStop(0, 'rgba(0,0,0,0.08)');
      scrim.addColorStop(0.45, 'rgba(0,0,0,0.5)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = scrim;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.fillStyle = layer.color || '#ffffff';
      ctx.fill();
    }
    const label = clamp(p.textOpacity, 0, 1);
    if (layer.text && label > 0.001) {
      const fs = p.textSize > 0 ? p.textSize * H : h * (layer.subtext ? 0.3 : 0.34);
      const lines = String(layer.text).split('\n');
      const lh = fs * 1.12;
      const top = layer.subtext ? -(lines.length * lh) / 2 : -lh / 2;
      ctx.save();
      ctx.globalAlpha = clamp(p.opacity, 0, 1) * label;
      ctx.fillStyle = layer.textColor || '#0a0a0a';
      ctx.font = `700 ${fs}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((ln, i) => ctx.fillText(ln, 0, top + lh * (i + 0.5)));
      if (layer.subtext) {
        const sf = fs * 0.6;
        ctx.font = `500 ${sf}px ${FONT}`;
        ctx.fillStyle = layer.subtextColor || 'rgba(10,10,10,0.55)';
        ctx.fillText(layer.subtext, 0, top + lines.length * lh + sf * 0.85);
      }
      ctx.restore();
    }
  } else if (layer.type === 'text') {
    const fs = base * 0.62;
    ctx.fillStyle = layer.color;
    ctx.font = `700 ${fs}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(layer.text || 'TEXT', 0, 0);
  } else if (layer.type === 'image') {
    const img = imageFor(layer.src, onAssetReady);
    if (img) {
      const box = base * 2;
      const ar = img.naturalWidth / img.naturalHeight || 1;
      const dw = ar >= 1 ? box : box * ar;
      const dh = ar >= 1 ? box / ar : box;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.strokeRect(-base, -base, base * 2, base * 2);
      ctx.restore();
    }
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
  if (layer.type === 'card') {
    const box = layerBox(layer, time, W, H);
    ctx.strokeRect(box.left, box.top, box.w, box.h);
  } else {
    ctx.strokeRect(move.x - r, move.y - r, r * 2, r * 2);
  }
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
  const resolved = resolveMorphs(scene, time);
  for (let i = resolved.layers.length - 1; i >= 0; i--) {
    const l = resolved.layers[i];
    if (l.visible === false) continue;
    const p = sampleLayer(l, time);
    if (p.opacity < 0.05) continue;
    if (l.type === 'card') {
      const box = layerBox(l, time, W, H);
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return l.id;
      continue;
    }
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

// Auto-ease: rewrite every keyframe's interpolation in one pass. Applied to
// director output, to freshly written keys, and to the whole scene when the
// user switches auto-ease on.
export function autoEaseScene(scene, ease = 'easeInOut') {
  const name = EASES[ease] ? ease : 'easeInOut';
  return {
    ...scene,
    layers: scene.layers.map((l) => ({
      ...l,
      tracks: Object.fromEntries(
        Object.entries(l.tracks || {}).map(([prop, list]) => [prop, (list || []).map((k) => ({ ...k, ease: name }))])
      ),
    })),
  };
}

/* ------------------------------------------------------------------- morphs */
// A morph is a first-class relation between two layers, not a copy of an
// effect: the source is what it looks like now, the target is where it has to
// end up, and everything between is interpolated — box, position, radius,
// scale, rotation, label size, fill colour and the label handover itself.
// Nothing blinks out and reappears.

export function morphProgress(rel, time) {
  const d = Math.max(0.001, rel.duration || 1);
  const raw = (time - (rel.start || 0)) / d;
  const p = clamp(raw, 0, 1);
  return { raw, p, eased: (EASES[rel.easing] || EASES.easeInOut)(p) };
}

// Geometry, radius and label size travel from source to target. Colour is mixed
// separately because it is not a number.
const MORPH_PROPS = ['x', 'y', 'w', 'h', 'radius', 'scale', 'rotation', 'textSize'];

function rgbOf(hex) {
  const h = String(hex || '#ffffff').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 255, 255];
}

export function mixColor(a, b, t) {
  if (!t) return a;
  if (t >= 1) return b;
  const A = rgbOf(a);
  const B = rgbOf(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function withAlpha(hex, a) {
  const c = rgbOf(hex);
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${clamp(a, 0, 1)})`;
}

// The box a layer occupies at a moment in time, whatever kind of layer it is.
export function layerBox(layer, time, W, H) {
  const p = sampleLayer(layer, time);
  const card = layer.type === 'card';
  const unit = Math.min(W, H);
  const w = card ? Math.max(8, p.w * W) * p.scale : unit * (layer.size || 0.2) * p.scale * 2;
  const h = card ? Math.max(8, p.h * H) * p.scale : unit * (layer.size || 0.2) * p.scale * 2;
  const cx = p.x * W;
  const cy = p.y * H;
  // The corner radius travels with the box so a match cut can use the hero's
  // own silhouette as its mask.
  const radius = card ? p.radius * unit * p.scale : 0;
  return { cx, cy, w, h, radius, left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, p };
}

// One layer, seen through every morph that touches it.
export function resolveLayer(scene, layer, time) {
  const asTarget = (scene.morphs || []).find((r) => r.to === layer.id);
  if (asTarget) {
    const src = scene.layers.find((l) => l.id === asTarget.from);
    if (src) {
      const { raw, eased } = morphProgress(asTarget, time);
      if (raw >= 1) return layer;
      const a = sampleLayer(src, time);
      const b = sampleLayer(layer, time);
      const mix = raw <= 0 ? 0 : eased;
      const out = { ...layer, tracks: {} };
      MORPH_PROPS.forEach((prop) => { out[prop] = a[prop] + (b[prop] - a[prop]) * mix; });
      out.color = mixColor(src.color, layer.color, mix);
      out.opacity = b.opacity * mix;
      // The box lands first, the words arrive after it — that ordering is what
      // makes the pair read as one object changing rather than two swapping.
      out.textOpacity = mix <= 0.4 ? 0 : clamp((mix - 0.4) / 0.6, 0, 1);
      return out;
    }
  }

  const asSource = (scene.morphs || []).find((r) => r.from === layer.id);
  if (asSource) {
    const { raw, eased } = morphProgress(asSource, time);
    const own = sampleLayer(layer, time);
    const out = { ...layer, tracks: {}, ...own };
    if (raw >= 1) return { ...out, opacity: 0 };
    if (raw > 0) {
      // Hold solid while the target takes over, then hand over completely.
      const handoff = clamp((eased - 0.6) / 0.4, 0, 1);
      out.opacity = own.opacity * (1 - handoff);
      out.textOpacity = 1 - handoff;
    }
    return out;
  }

  return layer;
}

export function resolveMorphs(scene, time) {
  if (!scene.morphs?.length) return scene;
  return { ...scene, layers: scene.layers.map((l) => resolveLayer(scene, l, time)) };
}

/* ---------------------------------------------------------------- the arrow */
// A curved connector between the two boxes, calculated fresh every frame so it
// follows them. It draws itself on over the morph, and the head rides the end of
// whatever has been drawn so far.

export function morphArrow(scene, rel, time, W, H) {
  const from = scene.layers.find((l) => l.id === rel.from);
  const to = scene.layers.find((l) => l.id === rel.to);
  if (!from || !to) return null;
  const A = layerBox(from, time, W, H);
  const B = layerBox(to, time, W, H);
  const rightward = B.cx >= A.cx;
  const gap = 16;
  const sx = (rightward ? A.right : A.left) + (rightward ? gap : -gap);
  const ex = (rightward ? B.left : B.right) + (rightward ? -gap : gap);
  const sy = A.cy;
  const ey = B.cy;
  const span = Math.hypot(ex - sx, ey - sy);
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2 - span * (rel.curve ?? 0.35);
  const { eased } = morphProgress(rel, time);
  return { sx, sy, mx, my, ex, ey, draw: clamp((eased - 0.15) / 0.85, 0, 1) };
}

function pointOn(a, c, b, t) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

function drawMorphArrow(ctx, scene, rel, time, W, H, selected) {
  if (rel.arrow === false) return;
  const g = morphArrow(scene, rel, time, W, H);
  if (!g || g.draw <= 0.001) return;
  const a = { x: g.sx, y: g.sy };
  const c = { x: g.mx, y: g.my };
  const b = { x: g.ex, y: g.ey };
  const steps = 64;
  const upto = Math.max(2, Math.round(steps * g.draw));
  const pts = [];
  for (let i = 0; i <= upto; i++) pts.push(pointOn(a, c, b, (i / steps) * g.draw));
  const color = rel.glowColor || '#7DDCFF';
  const glow = rel.glow ?? 0.8;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  };
  if (glow > 0.001) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow * 30;
  }
  // A soft wide pass under a thin bright core: light, not neon.
  ctx.strokeStyle = withAlpha(color, 0.14 + glow * 0.22);
  ctx.lineWidth = selected ? 8 : 7;
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 2.6 : 2;
  path();
  ctx.shadowBlur = 0;

  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2] || pts[0];
  const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
  const size = selected ? 15 : 13;
  ctx.translate(last.x, last.y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.58);
  ctx.lineTo(-size * 0.72, 0);
  ctx.lineTo(-size, size * 0.58);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------- match-cut transitions */
// A match cut works one level above a morph. Instead of two layers blending,
// a whole scene hands over to another through a single object that stays
// continuous: the hero interpolates, Scene A leaves around it, Scene B arrives
// through it, and an optional camera pushes through the crossing.

export const TRANSITION_PROPS = {
  position: ['x', 'y'],
  scale: ['x', 'y', 'w', 'h', 'scale'],
  shape: ['x', 'y', 'w', 'h', 'radius', 'scale', 'rotation'],
  color: ['x', 'y'],
  rotation: ['x', 'y', 'rotation'],
  mask: ['x', 'y', 'w', 'h', 'radius'],
  camera: ['x', 'y', 'w', 'h', 'radius'],
  compound: ['x', 'y', 'w', 'h', 'radius', 'scale', 'rotation', 'textSize'],
};

// The camera pushes in as the object takes over and settles back as the new
// scene arrives — peak at the crossing, never a lingering zoom.
function cameraAt(tr, mix, box, W, H) {
  const c = tr.camera || {};
  if (!c.enabled) return { x: 0, y: 0, scale: 1, rotation: 0, blur: 0 };
  const peak = Math.sin(clamp(mix, 0, 1) * Math.PI);
  return {
    x: (W / 2 - box.cx) * peak * (c.center ?? 1),
    y: (H / 2 - box.cy) * peak * (c.center ?? 1),
    scale: 1 + ((c.scaleTo ?? 1.5) - 1) * peak,
    rotation: (c.rotationTo ?? 0) * peak,
    blur: (c.blurTo ?? 2.5) * peak,
  };
}

function applyCamera(ctx, cam, W, H) {
  if (!cam) return;
  ctx.translate(W / 2 + cam.x, H / 2 + cam.y);
  if (cam.rotation) ctx.rotate((cam.rotation * Math.PI) / 180);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-W / 2, -H / 2);
  if (cam.blur > 0.01 && 'filter' in ctx) ctx.filter = `blur(${cam.blur.toFixed(2)}px)`;
}

/**
 * Resolve every match cut on the scene for a moment in time. Before a cut has
 * started its target scene stays hidden and its source scene stays whole, so the
 * same resolver covers the before, during and after states.
 */
export function resolveTransitions(scene, time, W, H) {
  const list = scene.transitions || [];
  if (!list.length) return null;
  const hidden = new Set();
  const reveal = new Set();
  const alpha = new Map();
  let hero = null;
  let heroId = null;
  let camera = null;
  let clip = false;
  let maskBox = null;
  let maskEdge = 0;
  let active = null;

  list.forEach((tr) => {
    const from = scene.layers.find((l) => l.id === tr.from);
    const to = scene.layers.find((l) => l.id === tr.to);
    if (!from || !to) return;
    const { raw, eased } = morphProgress(tr, time);
    const mix = clamp(eased, 0, 1);

    hidden.add(to.id);
    (tr.reveal || []).forEach((id) => reveal.add(id));
    (tr.conceal || []).forEach((id) => {
      alpha.set(id, Math.min(alpha.get(id) ?? 1, 1 - clamp((mix - 0.15) / 0.6, 0, 1)));
    });
    (tr.reveal || []).forEach((id) => {
      alpha.set(id, Math.min(alpha.get(id) ?? 1, clamp((mix - 0.3) / 0.6, 0, 1)));
    });

    if (raw <= 0) return;

    const props = TRANSITION_PROPS[tr.type] || TRANSITION_PROPS.compound;
    const a = sampleLayer(from, time);
    const b = sampleLayer(to, time);
    const h = { ...from, tracks: {} };
    props.forEach((prop) => { h[prop] = a[prop] + (b[prop] - a[prop]) * mix; });
    h.color = mixColor(from.color, to.color, mix);
    h.text = to.text;
    h.subtext = to.subtext;
    h.textColor = to.textColor;
    h.opacity = a.opacity + (b.opacity - a.opacity) * mix;
    h.textOpacity = raw >= 1 ? 1 : mix <= 0.4 ? 0 : clamp((mix - 0.4) / 0.6, 0, 1);

    hero = h;
    heroId = from.id;
    maskBox = layerBox(h, time, W, H);
    camera = cameraAt(tr, mix, maskBox, W, H);
    clip = tr.mask?.enabled !== false && raw < 1;
    maskEdge = clip ? clamp(1 - mix * 1.5, 0, 1) : 0;
    active = tr;
  });

  if (!hero) return null;
  return { hero, heroId, hidden, reveal, alpha, camera, clip, maskBox, maskEdge, tr: active };
}

function drawMaskEdge(ctx, box, edge) {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${(0.28 * edge).toFixed(3)})`;
  ctx.lineWidth = 2;
  roundRect(ctx, box.left, box.top, box.w, box.h, box.radius);
  ctx.stroke();
  ctx.restore();
}

// Edit mode: show the source and the target of the selected match cut.
export function drawTransitionHighlight(ctx, scene, tr, time, W, H) {
  const from = scene.layers.find((l) => l.id === tr.from);
  const to = scene.layers.find((l) => l.id === tr.to);
  if (!from || !to) return;
  const A = layerBox(from, time, W, H);
  const B = layerBox(to, time, W, H);
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(125,220,255,0.75)';
  [A, B].forEach((b) => ctx.strokeRect(b.left - 8, b.top - 8, b.w + 16, b.h + 16));
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(125,220,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(A.cx, A.cy);
  ctx.lineTo(B.cx, B.cy);
  ctx.stroke();
  ctx.restore();
}

// Edit mode: show which two layers a selected morph is joining.
function drawMorphHighlight(ctx, scene, rel, time, W, H) {
  const from = scene.layers.find((l) => l.id === rel.from);
  const to = scene.layers.find((l) => l.id === rel.to);
  if (!from || !to) return;
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.5;
  [from, to].forEach((l) => {
    const box = layerBox(l, time, W, H);
    ctx.strokeStyle = withAlpha(rel.glowColor || '#7DDCFF', 0.75);
    ctx.strokeRect(box.left - 6, box.top - 6, box.w + 12, box.h + 12);
  });
  ctx.restore();
}