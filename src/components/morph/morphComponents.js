// Prebuilt vector components. Each one is just a set of layers with their own
// hand-tuned keys, so dropping one in gives you motion you can immediately
// re-time in Advanced mode — and a starting point for the AI to restage.
//
// This is the "logo construction / deconstruction" system: a mark is built from
// pieces that assemble, rather than one object scaling from zero.

import { makeLayer } from './morphEngine';

/**
 * Fly one piece into place from an offset, staggered by `at` seconds.
 */
const assemble = (layer, { at = 0, dx = 0, dy = 0, dur = 0.7, spin = 0 }) => ({
  ...layer,
  tracks: {
    ...layer.tracks,
    x: [
      { t: at, v: layer.x + dx, ease: 'backOut' },
      { t: at + dur, v: layer.x, ease: 'backOut' },
    ],
    y: [
      { t: at, v: layer.y + dy, ease: 'backOut' },
      { t: at + dur, v: layer.y, ease: 'backOut' },
    ],
    scale: [
      { t: at, v: 0.2, ease: 'backOut' },
      { t: at + dur, v: 1, ease: 'backOut' },
    ],
    opacity: [
      { t: at, v: 0, ease: 'easeOut' },
      { t: at + Math.min(0.3, dur * 0.5), v: 1, ease: 'easeOut' },
    ],
    ...(spin
      ? {
        rotation: [
          { t: at, v: layer.rotation - spin, ease: 'backOut' },
          { t: at + dur, v: layer.rotation, ease: 'backOut' },
        ],
      }
      : {}),
  },
});

const shape = (partial) => makeLayer({ shape: 'triangle', color: '#ffffff', size: 0.12, ...partial });

/* ------------------------------------------------------------- components */

const diamondMark = () => {
  const arms = [
    { name: 'TOP', x: 0.5, y: 0.385, rotation: 0, dx: 0, dy: -0.3 },
    { name: 'RIGHT', x: 0.615, y: 0.5, rotation: 90, dx: 0.3, dy: 0 },
    { name: 'BOTTOM', x: 0.5, y: 0.615, rotation: 180, dx: 0, dy: 0.3 },
    { name: 'LEFT', x: 0.385, y: 0.5, rotation: 270, dx: -0.3, dy: 0 },
  ];
  return arms.map((a, i) =>
    assemble(shape({ name: a.name, group: 'LOGO', size: 0.125, x: a.x, y: a.y, rotation: a.rotation }), {
      at: i * 0.12,
      dx: a.dx,
      dy: a.dy,
      dur: 0.75,
      spin: 60,
    }),
  );
};

const ringBurst = () =>
  Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return assemble(
      shape({
        name: `Spoke ${i + 1}`,
        group: 'BURST',
        size: 0.05,
        x: 0.5 + Math.cos(a) * 0.17,
        y: 0.5 + Math.sin(a) * 0.17,
        rotation: (a * 180) / Math.PI + 90,
      }),
      { at: i * 0.05, dx: Math.cos(a) * 0.35, dy: Math.sin(a) * 0.35, dur: 0.6 },
    );
  });

const triangleStack = () =>
  [
    { size: 0.3, spin: 90 },
    { size: 0.2, spin: -90 },
    { size: 0.1, spin: 180 },
  ].map((s, i) =>
    assemble(shape({ name: `Triangle ${i + 1}`, group: 'STACK', size: s.size, rotation: i * 60 }), {
      at: i * 0.18,
      dy: -0.28,
      dur: 0.8,
      spin: s.spin,
    }),
  );

const wordmark = () =>
  ['K', 'A', 'S', 'P', 'A'].map((ch, i) =>
    assemble(
      makeLayer({
        type: 'text',
        name: `Letter ${ch}`,
        text: ch,
        group: 'KASPA',
        size: 0.17,
        color: '#ffffff',
        x: 0.3 + i * 0.1,
        y: 0.5,
      }),
      { at: i * 0.08, dy: 0.34, dur: 0.7 },
    ),
  );

const bars = () =>
  Array.from({ length: 5 }, (_, i) => {
    const x = 0.32 + i * 0.09;
    const lift = 0.16 + (i % 3) * 0.06;
    return {
      ...makeLayer({ name: `Bar ${i + 1}`, group: 'BARS', shape: 'square', size: 0.055, x, y: 0.5 }),
      tracks: {
        scale: [
          { t: i * 0.1, v: 0.2, ease: 'backOut' },
          { t: i * 0.1 + 0.5, v: 1 + lift, ease: 'backOut' },
          { t: i * 0.1 + 1, v: 1, ease: 'easeInOut' },
        ],
        y: [
          { t: i * 0.1, v: 0.62, ease: 'backOut' },
          { t: i * 0.1 + 0.5, v: 0.5 - lift * 0.3, ease: 'backOut' },
          { t: i * 0.1 + 1, v: 0.5, ease: 'easeInOut' },
        ],
        opacity: [
          { t: i * 0.1, v: 0, ease: 'easeOut' },
          { t: i * 0.1 + 0.2, v: 1, ease: 'easeOut' },
        ],
      },
    };
  });

const particles = () => {
  // A fixed spread, not random — a component should look the same every time.
  const spots = [
    [0.28, 0.3], [0.42, 0.22], [0.58, 0.26], [0.72, 0.36], [0.68, 0.62],
    [0.54, 0.74], [0.38, 0.72], [0.26, 0.56], [0.5, 0.48], [0.62, 0.44],
  ];
  return spots.map(([x, y], i) =>
    assemble(
      makeLayer({
        name: `Dust ${i + 1}`,
        group: 'DUST',
        shape: i % 3 === 0 ? 'spark' : 'circle',
        size: i % 4 === 0 ? 0.05 : 0.028,
        x,
        y,
        rotation: i * 45,
      }),
      { at: i * 0.07, dx: (x - 0.5) * 0.6, dy: (y - 0.5) * 0.6, dur: 0.8, spin: 180 },
    ),
  );
};

const morphPair = () => [
  {
    ...makeLayer({ name: 'Circle → Star', shape: 'circle', morphTo: 'star', size: 0.2, x: 0.33, y: 0.5 }),
    tracks: {
      morph: [{ t: 0.5, v: 0, ease: 'easeInOut' }, { t: 2.6, v: 1, ease: 'easeInOut' }],
      rotation: [{ t: 0, v: 0, ease: 'linear' }, { t: 6, v: 180, ease: 'linear' }],
      opacity: [{ t: 0, v: 0, ease: 'easeOut' }, { t: 0.5, v: 1, ease: 'easeOut' }],
    },
  },
  {
    ...makeLayer({ name: 'Square → Burst', shape: 'square', morphTo: 'burst', size: 0.2, x: 0.67, y: 0.5 }),
    tracks: {
      morph: [{ t: 0.8, v: 0, ease: 'easeInOut' }, { t: 2.9, v: 1, ease: 'easeInOut' }],
      rotation: [{ t: 0, v: 0, ease: 'linear' }, { t: 6, v: -180, ease: 'linear' }],
      opacity: [{ t: 0.3, v: 0, ease: 'easeOut' }, { t: 0.8, v: 1, ease: 'easeOut' }],
    },
  },
];

export const COMPONENTS = [
  { id: 'diamond', name: 'Diamond mark', hint: '4 pieces assemble from outside', make: diamondMark },
  { id: 'ring', name: 'Ring burst', hint: '8 spokes fly out from the centre', make: ringBurst },
  { id: 'stack', name: 'Triangle stack', hint: '3 nested triangles rotate in', make: triangleStack },
  { id: 'wordmark', name: 'Wordmark', hint: '5 letters rise in sequence', make: wordmark },
  { id: 'bars', name: 'Bars', hint: '5 bars pop and settle', make: bars },
  { id: 'dust', name: 'Particle dust', hint: '10 sparks drift into place', make: particles },
  { id: 'morph', name: 'Morph pair', hint: 'circle→star, square→burst', make: morphPair },
];

/** A fresh stage with a single shape, for a brand new project. */
export function blankScene(name) {
  return {
    name: name || 'Untitled project',
    duration: 6,
    layers: [makeLayer({ name: 'Shape 1', shape: 'diamond', morphTo: 'star', size: 0.22 })],
  };
}