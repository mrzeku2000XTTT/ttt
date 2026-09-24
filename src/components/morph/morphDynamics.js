// Dynamic behaviours — the middle layer of the three-layer model:
//
//   AI intent ("make the logo hit harder")
//        ↓
//   behaviour   { motion, energy, overshoot, stagger, randomness, loop }
//        ↓
//   rendered keyframes   (what the engine actually plays)
//
// Nothing here is special-cased in the renderer. A behaviour is a pure function
// that writes real keyframes, so you can always drop into the timeline and
// hand-tune exactly what it produced.

import { DEFAULTS, clamp, springCurve, upsertKey } from './morphEngine';

export const MOTIONS = [
  { id: 'spring', label: 'Spring', hint: 'Damped spring — overshoots, then settles.' },
  { id: 'smooth', label: 'Smooth', hint: 'Straight eased slide into place.' },
  { id: 'explosive', label: 'Explosive', hint: 'Shoots in fast and slams to a stop.' },
  { id: 'magnetic', label: 'Magnetic', hint: 'Grows out of the centre and snaps outward.' },
];

export const DEFAULT_DYNAMICS = {
  motion: 'spring',
  energy: 60,
  overshoot: 18,
  stagger: 90,
  randomness: 4,
  loop: false,
};

const rest = (layer, prop) => {
  const list = layer.tracks?.[prop];
  if (list && list.length) return list[list.length - 1].v;
  return layer[prop] ?? DEFAULTS[prop];
};

// Deterministic jitter: same layer id, same offset — the scene stays reproducible.
const seeded = (id, salt = 0) => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

const round = (n) => Math.round(n * 1000) / 1000;

// A spring is baked as a sampled curve — a real keyframe sequence, exactly what
// the timeline then shows and lets you re-time by hand.
const SPRING_SAMPLES = 10;

const write = (layer, patch) =>
  Object.entries(patch).reduce(
    (l, [prop, keys]) => keys.reduce((acc, k) => upsertKey(acc, prop, k.t, k.v, k.ease), l),
    layer
  );

const lastTime = (scene) =>
  scene.layers.reduce((m, l) => Math.max(m, ...Object.values(l.tracks || {}).flat().map((k) => k.t), 0), 0);

/**
 * Bake a behaviour into keyframes. Deterministic: the same scene + the same
 * settings always produce the same tracks.
 */
export function bakeDynamics(scene, settings = DEFAULT_DYNAMICS, { layerIds, t0 = 0 } = {}) {
  const cfg = { ...DEFAULT_DYNAMICS, ...settings };
  const ids = layerIds?.length ? new Set(layerIds) : null;

  // Energy drives stiffness and how far the entrance travels; overshoot drives
  // damping. Both are physics, not magic numbers in a table.
  const useSpring = cfg.motion === 'spring';
  const motionEase = cfg.motion === 'explosive' ? 'easeOut' : 'easeInOut';
  const curve = curveFor(cfg.energy, cfg.overshoot);
  const reach = 0.25 + (cfg.energy / 100) * 0.6;
  const dur = Math.max(0.35, 1 - (cfg.energy / 100) * 0.4);
  const step = cfg.stagger / 1000;
  const jitter = (cfg.randomness / 100) * 0.16;

  const mk = (from, to, start, length) => {
    if (!useSpring) {
      return [
        { t: round(start), v: from, ease: motionEase },
        { t: round(start + length), v: to, ease: motionEase },
      ];
    }
    const keys = [];
    for (let n = 0; n <= SPRING_SAMPLES; n += 1) {
      const p = n / SPRING_SAMPLES;
      keys.push({ t: round(start + p * length), v: from + (to - from) * curve(p), ease: 'linear' });
    }
    return keys;
  };

  let i = 0;
  const layers = scene.layers.map((l) => {
    if (ids && !ids.has(l.id)) return l;
    const delay = i * step;
    i += 1;

    const x = rest(l, 'x');
    const y = rest(l, 'y');
    const sx = x < 0.5 ? -1 : 1;
    const sy = y < 0.5 ? -1 : 1;
    const jx = (seeded(l.id, 1) * 2 - 1) * jitter;
    const jy = (seeded(l.id, 2) * 2 - 1) * jitter;

    const startX = cfg.motion === 'magnetic' ? 0.5 + jx * 0.2 : clamp(x + sx * reach + jx, -0.6, 1.6);
    const startY = cfg.motion === 'magnetic' ? 0.5 + jy * 0.2 : clamp(y + sy * reach * 1.2 + jy, -0.9, 1.9);
    const startScale = cfg.motion === 'explosive' ? 1.4 : cfg.motion === 'magnetic' ? 1.6 : 0.35;

    const entrance = {
      opacity: [
        { t: round(t0 + delay), v: 0, ease: 'easeOut' },
        { t: round(t0 + delay + dur * 0.4), v: 1, ease: 'easeOut' },
      ],
      scale: mk(startScale, 1, t0 + delay, dur),
      x: mk(startX, x, t0 + delay, dur),
      y: mk(startY, y, t0 + delay, dur),
    };

    if (cfg.loop) {
      const settle = t0 + delay + dur;
      entrance.y = [
        ...entrance.y,
        { t: settle + 1.5, v: y - 0.02, ease: 'easeInOut' },
        { t: settle + 3, v: y, ease: 'easeInOut' },
      ];
    }

    return write(l, entrance);
  });

  const next = { ...scene, layers };
  return { ...next, duration: Math.max(next.duration || 3, Math.round(lastTime(next) * 100) / 100) };
}

/** A spring's overshoot for a given damping, for the UI readout. */
export const overshootFor = (energy, overshoot) => {
  const stiffness = 90 + (energy / 100) * 260;
  const damping = Math.max(2, 18 - (overshoot / 100) * 13);
  const zeta = damping / (2 * Math.sqrt(stiffness));
  if (zeta >= 1) return 0;
  return Math.round(Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) * 100);
};

/** The same curve the keys were baked with — used for the preview readout. */
export const curveFor = (energy, overshoot) =>
  springCurve(90 + (energy / 100) * 260, Math.max(2, 18 - (overshoot / 100) * 13));

export const describeDynamics = (d) =>
  `${d.motion} · energy ${d.energy} · overshoot ${d.overshoot}% · stagger ${d.stagger}ms · randomness ${d.randomness}${d.loop ? ' · loop' : ''}`;