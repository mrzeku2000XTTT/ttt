import { MOTION_PRESETS } from './spriteMotionEngine';

// Motion graphics for the studio. Each movement is a pure function of time that
// returns a small transform for the artwork, so a still picture can actually
// move — the chat picks the one that fits what it can see in the image.
//
// Amplitudes stay within a few percent: the artwork is clipped by its frame, so
// a movement that left the box would simply be cut off.

const TAU = Math.PI * 2;

export const MOTION_FX = {
  // A gentle rise and fall, the way something suspended sits in the air.
  hover: (t) => ({ y: Math.sin(t * 1.5) * 1.6, s: 1 + Math.sin(t * 1.5) * 0.008 }),
  // Drifting, with a slight lean — the loosest of the movements.
  float: (t) => ({ y: Math.sin(t * 1.1) * 2.1, x: Math.cos(t * 0.7) * 1, r: Math.sin(t * 0.9) * 0.7 }),
  // Expansion and return, slow enough to read as breath.
  breathing: (t) => ({ s: 1 + Math.sin(t * 1.25) * 0.022 }),
  // Weight: it leaves the ground, stretches, and settles back.
  bounce: (t) => {
    const h = Math.abs(Math.sin(((t * 1.15) % 1) * Math.PI));
    return { y: -h * 3.2, sy: 1 - h * 0.05, sx: 1 + h * 0.05 };
  },
  // Almost still — the smallest tell that something is alive.
  idle: (t) => ({ x: Math.sin(t * 0.6) * 0.6, y: Math.sin(t * 0.95) * 0.5, r: Math.sin(t * 0.45) * 0.35 }),
  // Symmetric pulse, narrow then wide: the beat of a wing.
  wing_flap: (t) => {
    const p = Math.abs(Math.sin(t * 3));
    return { sx: 1 + p * 0.05, sy: 1 - p * 0.018 };
  },
  // A step rhythm — the body rises on each stride.
  walk: (t) => {
    const p = (t * 1.6) % 1;
    return { x: Math.sin(p * TAU) * 1.2, y: -Math.abs(Math.sin(p * Math.PI * 2)) * 0.7, r: Math.sin(p * TAU) * 0.5 };
  },
  // The same stride, driven harder.
  run: (t) => {
    const p = (t * 3) % 1;
    return { x: Math.sin(p * TAU) * 2, y: -Math.abs(Math.sin(p * Math.PI * 2)) * 1.2, r: Math.sin(p * TAU) * 0.8 };
  },
  // Up and away, turning into the climb.
  fly: (t) => ({ y: Math.sin(t * 1.2) * 3, x: Math.cos(t * 0.8) * 1.2, r: Math.sin(t * 1.2) * 1.1 }),
  // A real arc: up, hang, down — with the stretch of a take-off and a landing.
  jump: (t) => {
    const h = Math.abs(Math.sin(((t * 0.9) % 1) * Math.PI));
    return { y: -h * 4.4, sy: 1 + h * 0.06, sx: 1 - h * 0.06 };
  },
  // A lunge that holds, then eases back.
  attack: (t) => {
    const p = (t * 1.2) % 1;
    const lunge = p < 0.3 ? p / 0.3 : Math.max(0, 1 - (p - 0.3) / 0.7);
    return { x: lunge * 3.4, s: 1 + lunge * 0.04 };
  },
  // A quick shake — the recoil after an impact.
  hit: (t) => ({ x: Math.sin(t * 30) * 0.9, r: Math.sin(t * 26) * 1.1 }),
  // A full turn, held back so the corners stay inside the frame.
  spin: (t) => ({ r: (t * 72) % 360, s: 0.78 }),
  // Turning on the spot: it goes edge-on and comes back around.
  turn: (t) => ({ sx: 0.25 + 0.75 * Math.abs(Math.cos(t * 1.2)) }),
};

// 'custom' and anything unrecognised drift, which is the safest way to move.
const FALLBACK = MOTION_FX.float;

export function motionTransform(id, t) {
  const fx = MOTION_FX[id] || FALLBACK;
  let f = {};
  try {
    f = fx(t) || {};
  } catch (e) {
    f = {};
  }
  const parts = [];
  if (f.x || f.y) parts.push(`translate(${(f.x || 0).toFixed(3)}%, ${(f.y || 0).toFixed(3)}%)`);
  if (f.r) parts.push(`rotate(${f.r.toFixed(3)}deg)`);
  if (f.s || f.sx || f.sy) {
    parts.push(`scale(${(f.sx || f.s || 1).toFixed(4)}, ${(f.sy || f.s || 1).toFixed(4)})`);
  }
  return parts.length ? parts.join(' ') : 'none';
}

export function motionLabel(id) {
  const found = MOTION_PRESETS.find((m) => m.id === id);
  return found ? found.label : '';
}