// The transition planner: turns two scenes into one structured transition plan.
//
// This is the piece the whole feature hangs off, and it is deliberately plain
// data in / plain data out — scenes in, a plan with explicit keyframes out. It
// never touches the DOM, React or the canvas, so it can be exercised on its own.

import { TRANSITION_PROPS } from './morphEngine';
import { sceneAnchors } from './transitionAnchors';
import { findMatches, scoreMatch } from './transitionMatcher';

const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

export const TRANSITION_TYPES = [
  { id: 'position', label: 'Position match', hint: 'Same spot on screen — A gives way to B.' },
  { id: 'scale', label: 'Scale match', hint: 'A small object grows into a large one.' },
  { id: 'shape', label: 'Shape match', hint: 'The silhouette itself morphs.' },
  { id: 'color', label: 'Color match', hint: 'A dominant colour carries into the next scene.' },
  { id: 'rotation', label: 'Rotation match', hint: 'An object rotates into the next orientation.' },
  { id: 'mask', label: 'Mask reveal', hint: 'A becomes a window onto Scene B.' },
  { id: 'camera', label: 'Camera match', hint: 'The camera moves through A and arrives in B.' },
  { id: 'compound', label: 'Compound match', hint: 'Position, scale, rotation and shape together.' },
];

// Motion-design presets. Timing and curve first, gimmicks never.
export const MATCH_CUT_PRESETS = [
  { id: 'clean', label: 'Clean Match', type: 'position', duration: 1.0, easing: 'easeInOut', camera: false, mask: false },
  { id: 'fast', label: 'Fast Match', type: 'position', duration: 0.45, easing: 'easeOut', camera: false, mask: false },
  { id: 'smooth', label: 'Smooth Morph', type: 'shape', duration: 1.3, easing: 'easeInOut', camera: false, mask: false },
  { id: 'zoom', label: 'Zoom Through', type: 'camera', duration: 1.4, easing: 'easeInOut', camera: true, mask: false, scaleTo: 2.4 },
  { id: 'shape', label: 'Shape Morph', type: 'shape', duration: 1.1, easing: 'easeInOut', camera: false, mask: false },
  { id: 'logo', label: 'Logo Reveal', type: 'mask', duration: 1.2, easing: 'easeOut', camera: false, mask: true },
  { id: 'ui', label: 'UI Transformation', type: 'compound', duration: 1.2, easing: 'easeInOut', camera: true, mask: true, scaleTo: 1.5 },
  { id: 'card', label: 'Card Expansion', type: 'scale', duration: 1.0, easing: 'easeOut', camera: false, mask: false },
  { id: 'icon-ui', label: 'Icon → Interface', type: 'compound', duration: 1.1, easing: 'easeInOut', camera: true, mask: true, scaleTo: 1.8 },
  { id: 'image-ui', label: 'Image → UI', type: 'mask', duration: 1.3, easing: 'easeInOut', camera: true, mask: true, scaleTo: 1.3 },
  { id: 'text-object', label: 'Text → Object', type: 'shape', duration: 0.9, easing: 'easeInOut', camera: false, mask: false },
  { id: 'object-scene', label: 'Object → Scene', type: 'camera', duration: 1.5, easing: 'easeInOut', camera: true, mask: true, scaleTo: 2.8 },
];

const asBlock = (scene, fallbackId) => {
  if (Array.isArray(scene)) return { id: fallbackId, layers: scene };
  if (!scene) return { id: fallbackId, layers: [] };
  return { id: scene.id || fallbackId, layers: scene.layers || [] };
};

// Geometry decides the mode when the user has not chosen one: a big size change
// is a scale match, a silhouette change is a shape match, and so on.
function inferType(match) {
  const b = match.breakdown;
  if (b.shape < 0.7 && b.scale < 0.75) return 'shape';
  if (b.scale < 0.55) return 'scale';
  if (b.color < 0.5 && b.shape >= 0.7) return 'color';
  if (b.position >= 0.9 && b.shape >= 0.8 && b.scale >= 0.7) return 'position';
  return 'compound';
}

function cameraFor(type, preset, options) {
  const enabled = options.camera ?? preset?.camera ?? (type === 'camera' || type === 'mask');
  return {
    enabled: !!enabled,
    scaleTo: options.scaleTo ?? preset?.scaleTo ?? (type === 'camera' ? 2.2 : 1.5),
    rotationTo: options.rotationTo ?? 0,
    blurTo: options.blurTo ?? 2.5,
    center: 1,
  };
}

function maskFor(type, preset, options) {
  const enabled = options.mask ?? preset?.mask ?? (type === 'mask');
  return { enabled: !!enabled, feather: 0.12 };
}

/**
 * The keyframe generator. Values are read from the two scenes and written out
 * as explicit two-key tracks, so the plan says exactly what will happen.
 */
export function buildKeyframes(plan, anchors) {
  const A = anchors?.[plan.meta?.source?.scene]?.find((a) => a.id === plan.from);
  const B = anchors?.[plan.meta?.target?.scene]?.find((a) => a.id === plan.to);
  if (!A || !B) return null;
  const t0 = plan.start;
  const t1 = plan.start + plan.duration;
  const track = (from, to) => [
    { t: t0, v: from, ease: plan.easing },
    { t: t1, v: to, ease: plan.easing },
  ];
  const props = TRANSITION_PROPS[plan.type] || TRANSITION_PROPS.compound;
  const hero = {};
  props.forEach((prop) => {
    const from = prop === 'x' ? A.normalized.x : prop === 'y' ? A.normalized.y
      : prop === 'w' ? A.normalized.w : prop === 'h' ? A.normalized.h
        : prop === 'radius' ? A.radius : prop === 'rotation' ? A.rotation : 1;
    const to = prop === 'x' ? B.normalized.x : prop === 'y' ? B.normalized.y
      : prop === 'w' ? B.normalized.w : prop === 'h' ? B.normalized.h
        : prop === 'radius' ? B.radius : prop === 'rotation' ? B.rotation : 1;
    hero[prop] = track(from, to);
  });
  hero.color = [
    { t: t0, v: A.color, ease: plan.easing },
    { t: t1, v: B.color, ease: plan.easing },
  ];
  hero.textOpacity = [
    { t: t0, v: 0, ease: plan.easing },
    { t: t0 + plan.duration * 0.4, v: 0, ease: plan.easing },
    { t: t1, v: 1, ease: plan.easing },
  ];
  return {
    hero,
    reveal: [
      { t: t0 + plan.duration * 0.3, v: 0, ease: plan.easing },
      { t: t1, v: 1, ease: plan.easing },
    ],
    conceal: [
      { t: t0, v: 1, ease: plan.easing },
      { t: t0 + plan.duration * 0.75, v: 0, ease: plan.easing },
    ],
    camera: plan.camera.enabled
      ? {
        scale: [
          { t: t0, v: 1, ease: plan.easing },
          { t: t0 + plan.duration * 0.5, v: plan.camera.scaleTo, ease: plan.easing },
          { t: t1, v: 1, ease: plan.easing },
        ],
        blur: [
          { t: t0, v: 0, ease: plan.easing },
          { t: t0 + plan.duration * 0.5, v: plan.camera.blurTo, ease: plan.easing },
          { t: t1, v: 0, ease: plan.easing },
        ],
      }
      : null,
  };
}

/**
 * createMatchCutTransition(sourceScene, targetScene, options)
 *
 * Scenes may be `{ id, layers }` or a plain array of layers. Returns one
 * structured transition — or null when nothing in A plausibly becomes anything
 * in B. Pass `source` / `target` (layer ids) to override the automatic pick.
 */
export function createMatchCutTransition(sourceScene, targetScene, options = {}) {
  const A = asBlock(sourceScene, 'A');
  const B = asBlock(targetScene, 'B');
  if (!A.layers.length || !B.layers.length) return null;

  const W = options.width || 1280;
  const H = options.height || 720;
  const time = options.time ?? 0;

  const anchorsA = sceneAnchors(A.layers, time, W, H, A.id);
  const anchorsB = sceneAnchors(B.layers, time, W, H, B.id);
  if (!anchorsA.length || !anchorsB.length) return null;

  const candidates = findMatches(anchorsA, anchorsB, { limit: 6 });

  // An explicit pair wins over the automatic pick — the user is always allowed
  // to overrule the machine.
  let match = candidates[0] || null;
  let overridden = false;
  if (options.source && options.target) {
    const a = anchorsA.find((x) => x.id === options.source);
    const b = anchorsB.find((x) => x.id === options.target);
    const scored = scoreMatch(a, b);
    if (scored) {
      match = { ...scored, reasons: ['chosen by hand', ...scored.reasons.filter((r) => r !== 'chosen by hand')] };
      overridden = true;
    }
  } else if (options.source) {
    // A chosen source re-picks the best target for it, rather than reusing
    // whatever the automatic pass happened to pair it with.
    const a = anchorsA.find((x) => x.id === options.source);
    const scored = anchorsB.map((b) => scoreMatch(a, b)).filter(Boolean).sort((x, y) => y.score - x.score);
    if (scored.length) match = scored[0];
  } else if (options.target) {
    const b = anchorsB.find((x) => x.id === options.target);
    const scored = anchorsA.map((a) => scoreMatch(a, b)).filter(Boolean).sort((x, y) => y.score - x.score);
    if (scored.length) match = scored[0];
  }
  if (!match) return null;

  const preset = MATCH_CUT_PRESETS.find((p) => p.id === options.preset) || null;
  const type = options.type || preset?.type || inferType(match);

  const plan = {
    id: options.id || uid('MC'),
    kind: 'match-cut',
    preset: preset?.id || null,
    type,
    duration: options.duration ?? preset?.duration ?? 1.2,
    easing: options.easing || preset?.easing || 'easeInOut',
    start: options.start ?? 0.5,
    anchor: options.anchor || 'center',
    from: match.source,
    to: match.target,
    hero: options.hero ?? true,
    // Scene B arrives around the hero; Scene A leaves around it.
    reveal: B.layers.filter((l) => l.id !== match.target).map((l) => l.id),
    conceal: A.layers.filter((l) => l.id !== match.source).map((l) => l.id),
    camera: cameraFor(type, preset, options),
    mask: maskFor(type, preset, options),
    score: match.score,
    reasons: match.reasons,
    overridden,
    meta: {
      source: { layerId: match.source, scene: A.id, name: match.sourceAnchor.name, role: match.sourceAnchor.semanticRole, shape: match.sourceAnchor.shape },
      target: { layerId: match.target, scene: B.id, name: match.targetAnchor.name, role: match.targetAnchor.semanticRole, shape: match.targetAnchor.shape },
      candidates: candidates.map((c) => ({ source: c.source, target: c.target, score: c.score, reasons: c.reasons, sourceName: c.sourceAnchor.name, targetName: c.targetAnchor.name })),
    },
  };

  // The structured reasoning the AI layer reports back (§11).
  plan.reasoning = {
    sourceObject: plan.meta.source.name,
    targetObject: plan.meta.target.name,
    transitionType: type,
    duration: plan.duration,
    easing: plan.easing,
    hero: plan.from,
    score: plan.score,
    why: plan.reasons,
  };

  plan.keyframes = buildKeyframes(plan, { [A.id]: anchorsA, [B.id]: anchorsB });
  return plan;
}

/**
 * Re-plan an existing transition after the user changes the pair or the mode.
 * A key present in `options` wins even when it is null — that is how a preset
 * clears a mode the user had chosen by hand.
 */
export function replanTransition(plan, sourceScene, targetScene, options = {}) {
  const pick = (key, fallback) => (key in options ? options[key] : fallback);
  return createMatchCutTransition(sourceScene, targetScene, {
    ...options,
    id: plan.id,
    start: pick('start', plan.start),
    duration: pick('duration', plan.duration),
    easing: pick('easing', plan.easing),
    type: pick('type', plan.type),
    source: pick('source', plan.from),
    target: pick('target', plan.to),
    preset: pick('preset', plan.preset),
  });
}

export { sceneAnchors, TRANSITION_PROPS };