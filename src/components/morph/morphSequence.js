// Morph sequences: one object becoming another, then another.
//
// A sequence is a chain of nodes and the morphs between them, so
// SHAPE → TEXT → LOGO is a single plan the engine plays end to end rather than
// three effects stacked. The engine resolves each morph; this module only says
// which objects exist, when each step runs, and how the last one lands.
//
// The shape deform, the letterforms emerging one at a time and the spring settle
// are all properties of that plan — there is no second animation engine here.

import { makeLayer } from './morphEngine';

const clampNum = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const round = (n) => Math.round(n * 1000) / 1000;

// How hard the landing hits. The overshoot is meant to be felt, not seen —
// cartoon bounce is exactly what a premium reveal must avoid.
export const BOUNCE_PROFILES = {
  off: { label: 'Off', overshoot: 0, rotation: 0 },
  subtle: { label: 'Subtle', overshoot: 0.04, rotation: 0 },
  medium: { label: 'Medium', overshoot: 0.065, rotation: 1.5 },
  strong: { label: 'Strong', overshoot: 0.09, rotation: 2.5 },
};

// The spring the morph itself rides: fast arrival, small overshoot, short
// rebound, clean settle.
export const SPRING_PRESETS = [
  { id: 'soft', label: 'Soft', stiffness: 120, damping: 14 },
  { id: 'satisfying', label: 'Satisfying', stiffness: 180, damping: 16 },
  { id: 'snappy', label: 'Snappy', stiffness: 240, damping: 20 },
];

export const SEQUENCE_DEFAULTS = {
  shape: 'circle',
  easing: 'spring',
  bounce: 'subtle',
  glyphStagger: 60,
  morphDuration: 0.9,
  settleDuration: 0.34,
  overshoot: 0,
  stiffness: 180,
  damping: 16,
};

export const SEQUENCE_WORD = 'TTT';

export const SHAPE_SEQUENCES = [
  { id: 'shape-text-logo', label: 'Shape → Text → Logo', steps: ['shape', 'text', 'logo'] },
  { id: 'shape-text', label: 'Shape → Text', steps: ['shape', 'text'] },
  { id: 'shape-logo', label: 'Shape → Logo', steps: ['shape', 'logo'] },
];

export const isMorphSequence = (id) => SHAPE_SEQUENCES.some((s) => s.id === id);

// The landing, as keyframes on the object that just arrived. Position rides the
// scale beat: -4px at 4% of overshoot on a 720-high frame — enough to feel,
// never enough to see.
function bounceTracks(start, settle, overshoot, rotation) {
  const beats = [
    { f: 0, k: 1 },
    { f: 0.28, k: 1 + overshoot },
    { f: 0.52, k: 1 - overshoot * 0.42 },
    { f: 0.74, k: 1 + overshoot * 0.18 },
    { f: 1, k: 1 },
  ];
  const at = (f) => round(start + f * settle);
  const tracks = {
    scale: beats.map((b) => ({ t: at(b.f), v: round(b.k), ease: 'easeOut' })),
    y: beats.map((b) => ({ t: at(b.f), v: round(0.5 - (b.k - 1) * 0.14), ease: 'easeOut' })),
  };
  if (rotation > 0) {
    tracks.rotation = [
      { t: at(0), v: 0, ease: 'easeOut' },
      { t: at(0.28), v: -rotation, ease: 'easeOut' },
      { t: at(0.62), v: round(rotation * 0.35), ease: 'easeOut' },
      { t: at(1), v: 0, ease: 'easeOut' },
    ];
  }
  return tracks;
}

/**
 * Build a sequence into the scene. `options` carries the shape it starts as, the
 * word to reveal, the bounce profile and the spring — everything the AI director
 * and the panel controls can steer.
 */
export function applyMorphSequence(scene, sequenceId, options = {}) {
  const plan = SHAPE_SEQUENCES.find((s) => s.id === sequenceId);
  if (!plan) return scene;

  const o = { ...SEQUENCE_DEFAULTS, ...options };
  const word = String(options.word || options.text || SEQUENCE_WORD)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12) || SEQUENCE_WORD;
  const profile = BOUNCE_PROFILES[o.bounce] || BOUNCE_PROFILES.subtle;
  const asked = clampNum(o.overshoot, 0, 20, 0);
  const overshoot = asked > 0 ? asked / 100 : profile.overshoot;
  const morphDuration = clampNum(o.morphDuration, 0.3, 3, 0.9);
  const settle = clampNum(o.settleDuration, 0.12, 1.2, 0.34);
  const stagger = clampNum(o.glyphStagger, 0, 240, 60) / 1000;
  const spring = {
    stiffness: clampNum(o.stiffness, 20, 600, 180),
    damping: clampNum(o.damping, 4, 60, 16),
  };

  const hasText = plan.steps.includes('text');
  const hasLogo = plan.steps.includes('logo');
  const centre = { x: 0.5, y: 0.5 };

  const nodes = {};
  if (plan.steps.includes('shape')) {
    nodes.shape = makeLayer({
      type: 'shape',
      name: 'Shape',
      shape: o.shape,
      // The shape deforms into a different silhouette as it stretches — a shape
      // that only scales reads as a shape, not as something becoming type.
      morphTo: o.shape === 'hexagon' ? 'diamond' : 'hexagon',
      color: '#ffffff',
      // Larger than the letters, so they visibly condense out of it as it deforms.
      size: 0.3,
      ...centre,
    });
  }
  if (hasText) {
    nodes.text = makeLayer({
      type: 'text',
      name: 'Wordmark',
      text: word,
      color: '#ffffff',
      size: 0.26,
      glyphStagger: stagger,
      glyphWindow: morphDuration,
      ...centre,
    });
  }
  if (hasLogo) {
    // The end frame is the logotype itself. A card is a panel that happens to
    // contain the word — light plate, dark label — which reads as UI, not as a
    // logo. So the word condenses out of the wordmark into a tight white
    // lockup on the stage, in the same palette the reveal has been using.
    nodes.logo = makeLayer({
      type: 'text',
      name: 'Logo',
      text: word.toUpperCase(),
      color: '#ffffff',
      size: 0.17,
      ...centre,
    });
  }

  // The chain. Each step starts a beat after the one before has landed, so the
  // word is readable before it resolves into the logo.
  const morphs = [];
  const steps = [];
  // Long enough that the word is actually read before it resolves into the logo.
  const gap = Math.max(0.24, morphDuration * 0.35);
  let cursor = 0.35; // the shape is established first
  for (let i = 1; i < plan.steps.length; i += 1) {
    const from = nodes[plan.steps[i - 1]];
    const to = nodes[plan.steps[i]];
    const duration = round(i === 1 ? morphDuration : Math.max(0.3, morphDuration * 0.6));
    const step = { start: round(cursor), duration };
    morphs.push({
      id: `MR${Math.random().toString(36).slice(2, 8)}`,
      from: from.id,
      to: to.id,
      start: step.start,
      duration,
      easing: o.easing || 'spring',
      curve: 0.35,
      // A connector arrow is a UI-morph idea; on a centred logo reveal it is
      // noise.
      arrow: false,
      glow: 0,
      glowColor: '#7DDCFF',
      spring: { ...spring },
    });
    steps.push(step);
    cursor = round(cursor + duration + gap);
  }

  const first = steps[0];
  const last = steps[steps.length - 1];
  const lastEnd = round(last.start + last.duration);

  // The shape deforms while the first step runs.
  if (nodes.shape) {
    nodes.shape.tracks = {
      ...nodes.shape.tracks,
      morph: [
        { t: first.start, v: 0, ease: 'easeInOut' },
        { t: round(first.start + first.duration * 0.65), v: 1, ease: 'easeInOut' },
      ],
    };
  }

  const arrival = nodes[plan.steps[plan.steps.length - 1]];
  if (overshoot > 0 || profile.rotation > 0) {
    arrival.tracks = { ...arrival.tracks, ...bounceTracks(lastEnd, settle, overshoot, profile.rotation) };
  }

  // The phases, as markers, so the timeline shows the transformation as beats.
  const marks = [];
  const mark = (t, label) => { if (!marks.some((m) => m.label === label)) marks.push({ t: round(t), label }); };
  mark(0, 'Shape');
  if (hasText) mark(first.start, 'Morph');
  if (hasText) mark(first.start + first.duration, 'Text');
  if (hasLogo) mark(last.start, 'Logo');
  if (overshoot > 0) mark(lastEnd, 'Bounce');

  const layers = plan.steps.map((k) => nodes[k]);
  const taken = new Set((scene.markers || []).map((m) => m.label));
  return {
    ...scene,
    duration: Math.max(scene.duration || 0, round(lastEnd + settle + 0.35)),
    layers: [...scene.layers, ...layers],
    morphs: [...(scene.morphs || []), ...morphs],
    markers: [
      ...(scene.markers || []),
      ...marks
        .filter((m) => !taken.has(m.label))
        .map((m) => ({ id: `M${Math.random().toString(36).slice(2, 7)}`, ...m })),
    ],
  };
}