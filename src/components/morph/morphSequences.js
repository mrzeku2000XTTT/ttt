// Prebuilt animation sequences for Morph Motion Studio.
//
// A sequence is a named, hand-tuned effect that writes keyframes onto the layers
// you point it at. They compose: apply as many as you like, in order, and each
// merges into the tracks the others wrote — so a settle can follow an assemble,
// and a spin can follow both. The AI director picks from this same library,
// which is how any logo gets animated from the prebuilt set.

import { DEFAULTS, clamp, upsertKey } from './morphEngine';

const FRAME_W = 1280;
const FRAME_H = 720;

// Merge keys into a property (never clobbering keys at other times).
const write = (layer, prop, keys) =>
  keys.reduce((l, k) => upsertKey(l, prop, k.t, k.v, k.ease || 'easeInOut'), layer);

const withKeys = (layer, patch) =>
  Object.entries(patch).reduce((l, [prop, keys]) => write(l, prop, keys), layer);

// Where a layer comes to rest: the last key of the track, else its static value.
// Using the rest position (not the value at t=0) is what lets a sequence chain
// onto a scene that has already been animated.
const rest = (layer, prop) => {
  const list = layer.tracks?.[prop];
  if (list && list.length) return list[list.length - 1].v;
  return layer[prop] ?? DEFAULTS[prop];
};

const home = (layer) => ({
  x: rest(layer, 'x'),
  y: rest(layer, 'y'),
  rotation: rest(layer, 'rotation'),
});

const targeted = (layer, { layerIds, layerNames }) => {
  if (layerIds?.length) return layerIds.includes(layer.id);
  if (layerNames?.length) {
    const name = String(layer.name || '').toLowerCase();
    return layerNames.some((w) => name.includes(String(w).toLowerCase()));
  }
  return true;
};

const mapLayers = (scene, opts, fn) => {
  const end = (opts.t0 || 0) + (opts.dur || 1);
  return {
    ...scene,
    duration: Math.max(scene.duration || 3, Math.round(end * 100) / 100),
    layers: scene.layers.map((l) => (targeted(l, opts) ? fn(l) : l)),
  };
};

export const SEQUENCES = [
  {
    name: 'assemble',
    label: 'Assemble from corners',
    description: 'Points fly in from outside the frame and grow into place.',
    apply: (scene, { t0 = 0, dur = 1, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => {
      const { x, y } = home(l);
      const centred = Math.abs(x - 0.5) < 0.02 && Math.abs(y - 0.5) < 0.02;
      const opacity = [
        { t: t0, v: 0, ease: 'easeOut' },
        { t: t0 + dur * 0.5, v: 1, ease: 'easeOut' },
      ];
      if (centred) {
        return withKeys(l, {
          opacity,
          scale: [{ t: t0, v: 0.2, ease: 'backOut' }, { t: t0 + dur, v: 1, ease: 'easeOut' }],
        });
      }
      const sx = x < 0.5 ? -1 : 1;
      const sy = y < 0.5 ? -1 : 1;
      return withKeys(l, {
        opacity,
        scale: [{ t: t0, v: 0.1, ease: 'easeInOut' }, { t: t0 + dur, v: 1, ease: 'easeOut' }],
        x: [
          { t: t0, v: clamp(x + sx * 0.34, -0.4, 1.4), ease: 'easeInOut' },
          { t: t0 + dur, v: x, ease: 'easeOut' },
        ],
        y: [
          { t: t0, v: y + sy * 0.5, ease: 'easeInOut' },
          { t: t0 + dur, v: y, ease: 'easeOut' },
        ],
      });
    }),
  },
  {
    name: 'pop-in',
    label: 'Pop in',
    description: 'Scale 0 → 1.15 → 0.97 → 1 with a fade.',
    apply: (scene, { t0 = 0, dur = 0.7, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => withKeys(l, {
      opacity: [
        { t: t0, v: 0, ease: 'easeOut' },
        { t: t0 + dur * 0.45, v: 1, ease: 'easeOut' },
      ],
      scale: [
        { t: t0, v: 0, ease: 'backOut' },
        { t: t0 + dur * 0.6, v: 1.15, ease: 'easeOut' },
        { t: t0 + dur * 0.85, v: 0.97, ease: 'easeInOut' },
        { t: t0 + dur, v: 1, ease: 'easeOut' },
      ],
    })),
  },
  {
    name: 'settle',
    label: 'Settle / bounce',
    description: 'Easing test: overshoot 1.15, back to 0.97, then 1.',
    apply: (scene, { t0 = 0, dur = 0.5, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => withKeys(l, {
      scale: [
        { t: t0, v: 1.15, ease: 'easeOut' },
        { t: t0 + dur * 0.6, v: 0.97, ease: 'easeInOut' },
        { t: t0 + dur, v: 1, ease: 'easeOut' },
      ],
    })),
  },
  {
    name: 'spin-once',
    label: 'Spin once',
    description: 'One full turn about the mark centre.',
    apply: (scene, { t0 = 0, dur = 1, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => {
      const { x, y, rotation } = home(l);
      const px = (x - 0.5) * FRAME_W;
      const py = (y - 0.5) * FRAME_H;
      const r = Math.hypot(px, py);
      const a0 = Math.atan2(py, px);
      const xs = [];
      const ys = [];
      for (let j = 0; j <= 4; j++) {
        const a = a0 + (j / 4) * Math.PI * 2;
        xs.push({ t: t0 + (j / 4) * dur, v: 0.5 + (r * Math.cos(a)) / FRAME_W, ease: 'linear' });
        ys.push({ t: t0 + (j / 4) * dur, v: 0.5 + (r * Math.sin(a)) / FRAME_H, ease: 'linear' });
      }
      return withKeys(l, {
        x: xs,
        y: ys,
        rotation: [
          { t: t0, v: rotation, ease: 'linear' },
          { t: t0 + dur, v: rotation + 360, ease: 'linear' },
        ],
      });
    }),
  },
  {
    name: 'glow-pulse',
    label: 'Glow pulse',
    description: 'Halo rises 0 → 1 and decays to 0.2.',
    apply: (scene, { t0 = 0, dur = 0.8, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => withKeys(l, {
      glow: [
        { t: t0, v: 0, ease: 'easeOut' },
        { t: t0 + dur * 0.6, v: 1, ease: 'easeOut' },
        { t: t0 + dur, v: 0.2, ease: 'easeInOut' },
      ],
    })),
  },
  {
    name: 'fade-in',
    label: 'Fade in',
    description: 'Fades up while rising slightly.',
    apply: (scene, { t0 = 0, dur = 0.6, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => {
      const { y } = home(l);
      return withKeys(l, {
        opacity: [{ t: t0, v: 0, ease: 'easeOut' }, { t: t0 + dur, v: 1, ease: 'easeOut' }],
        y: [{ t: t0, v: y + 0.04, ease: 'easeOut' }, { t: t0 + dur, v: y, ease: 'easeOut' }],
      });
    }),
  },
  {
    name: 'float',
    label: 'Float loop',
    description: 'Gentle endless hover for a static logo.',
    apply: (scene, { t0 = 0, dur = 3, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => {
      const { y } = home(l);
      return withKeys(l, {
        y: [
          { t: t0, v: y, ease: 'easeInOut' },
          { t: t0 + dur / 2, v: y - 0.025, ease: 'easeInOut' },
          { t: t0 + dur, v: y, ease: 'easeInOut' },
        ],
      });
    }),
  },
  {
    name: 'morph-cycle',
    label: 'Morph cycle',
    description: "Blends the layer's shape into its morph target and back.",
    apply: (scene, { t0 = 0, dur = 2, ...opts } = {}) => mapLayers(scene, { t0, dur, ...opts }, (l) => withKeys(l, {
      morph: [
        { t: t0, v: 0, ease: 'easeInOut' },
        { t: t0 + dur / 2, v: 1, ease: 'easeInOut' },
        { t: t0 + dur, v: 0, ease: 'easeInOut' },
      ],
    })),
  },
  {
    name: 'logo-reveal',
    label: 'Logo reveal (3s)',
    description: 'Assemble → overshoot → settle → spin once → glow.',
    apply: (scene, opts = {}) => {
      const chain = [
        { name: 'assemble', t0: 0, dur: 1 },
        { name: 'settle', t0: 1.4, dur: 0.5 },
        { name: 'spin-once', t0: 2, dur: 1 },
        { name: 'glow-pulse', t0: 2.2, dur: 0.8 },
      ];
      const next = chain.reduce(
        (acc, step) => SEQUENCE_MAP[step.name].apply(acc, { ...opts, t0: step.t0, dur: step.dur }),
        scene
      );
      return { ...next, duration: 3 };
    },
  },
];

export const SEQUENCE_MAP = Object.fromEntries(SEQUENCES.map((s) => [s.name, s]));

/** Apply one prebuilt sequence to a scene. Unknown names are a no-op. */
export function applySequence(scene, name, opts = {}) {
  const seq = SEQUENCE_MAP[name];
  return seq ? seq.apply(scene, opts) : scene;
}

/** The library as plain data — this is what the AI director chooses from. */
export const sequenceCatalog = () =>
  SEQUENCES.map(({ name, label, description }) => ({ name, label, description }));