// Match scoring: which object in Scene A most likely *becomes* which object in
// Scene B. Pure functions over anchors — no scene or renderer knowledge, so the
// scoring can be tested and tuned on its own.

import { clamp } from './morphEngine';

// How close two silhouettes are. A rounded rect and a circle are neighbours;
// a rect and a circle are not.
const SHAPE_NEIGHBOURS = {
  circle: { circle: 1, 'rounded-rect': 0.6, square: 0.45, rect: 0.15 },
  'rounded-rect': { circle: 0.6, 'rounded-rect': 1, square: 0.7, rect: 0.45 },
  square: { circle: 0.45, 'rounded-rect': 0.7, square: 1, rect: 0.6 },
  rect: { circle: 0.15, 'rounded-rect': 0.45, square: 0.6, rect: 1 },
};

// Roles that plausibly become one another even when the silhouette changes.
const ROLE_NEIGHBOURS = {
  icon: { icon: 1, logo: 0.8, avatar: 0.75, button: 0.6, circle: 0.6, card: 0.4 },
  logo: { logo: 1, icon: 0.8, text: 0.5, device: 0.4, card: 0.4 },
  avatar: { avatar: 1, icon: 0.75, circle: 0.7, image: 0.5, card: 0.45 },
  button: { button: 1, card: 0.75, icon: 0.6, tab: 1, device: 0.5 },
  card: { card: 1, device: 0.85, button: 0.75, image: 0.6, thumbnail: 1, graph: 0.6 },
  image: { image: 1, card: 0.6, avatar: 0.5, device: 0.5, background: 0.5 },
  text: { text: 1, logo: 0.5, object: 0.4 },
  circle: { circle: 1, icon: 0.6, avatar: 0.7 },
  rectangle: { rectangle: 1, card: 0.7, device: 0.7 },
  graph: { graph: 1, card: 0.6, device: 0.6 },
  device: { device: 1, card: 0.85, rectangle: 0.7, graph: 0.6, image: 0.5 },
  background: { background: 1, image: 0.5, device: 0.4 },
  cursor: { cursor: 1, icon: 0.5 },
  object: { object: 1 },
  shape: { shape: 1, circle: 0.5, rectangle: 0.6 },
};

function rgb(hex) {
  const h = String(hex || '#ffffff').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 255, 255];
}

export function colorDistance(a, b) {
  const A = rgb(a);
  const B = rgb(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) / 441.67;
}

const pair = (table, a, b) => (table[a] && table[a][b]) ?? (a === b ? 1 : 0.2);

/** Score one candidate correspondence, with the reasons it scored that way. */
export function scoreMatch(a, b) {
  if (!a || !b) return null;
  const reasons = [];
  const breakdown = {};

  const shape = pair(SHAPE_NEIGHBOURS, a.shape, b.shape);
  breakdown.shape = shape;
  if (shape >= 0.7) reasons.push('similar geometry');

  const role = pair(ROLE_NEIGHBOURS, a.semanticRole, b.semanticRole);
  breakdown.role = role;
  if (role >= 0.8) reasons.push('similar semantic role');
  else if (role >= 0.6) reasons.push('related roles');

  const dist = Math.hypot(a.normalized.x - b.normalized.x, a.normalized.y - b.normalized.y);
  const position = clamp(1 - dist / 0.9, 0, 1);
  breakdown.position = position;
  if (position >= 0.75) reasons.push('similar position');
  else if (dist > 0.5) reasons.push('moves across the frame');

  const areaA = a.normalized.w * a.normalized.h;
  const areaB = b.normalized.w * b.normalized.h;
  const ratio = Math.max(areaA, areaB) / Math.max(1e-6, Math.min(areaA, areaB));
  const scale = clamp(1 - Math.log(Math.max(1, ratio)) / Math.log(9), 0, 1);
  breakdown.scale = scale;
  if (ratio > 2.2) reasons.push('grows into the target');
  else if (scale > 0.85) reasons.push('similar size');

  const color = clamp(1 - colorDistance(a.color, b.color), 0, 1);
  breakdown.color = color;
  if (color >= 0.85) reasons.push('similar color');

  const prominence = clamp(0.4 + Math.max(a.prominence, b.prominence) * 1.6, 0, 1);
  breakdown.prominence = prominence;

  const score =
    shape * 0.3 + role * 0.26 + position * 0.18 + color * 0.14 + scale * 0.08 + prominence * 0.04;

  return {
    source: a.id,
    target: b.id,
    score: Math.round(score * 1000) / 1000,
    reasons,
    breakdown,
    sourceAnchor: a,
    targetAnchor: b,
  };
}

/**
 * Rank every plausible correspondence between two sets of anchors. Each anchor
 * is used at most once, best pairs first — so one object cannot claim two.
 */
export function findMatches(anchorsA, anchorsB, { limit = 6 } = {}) {
  const all = [];
  anchorsA.forEach((a) => anchorsB.forEach((b) => {
    const m = scoreMatch(a, b);
    if (m) all.push(m);
  }));
  all.sort((x, y) => y.score - x.score);

  const usedA = new Set();
  const usedB = new Set();
  const picked = [];
  for (const m of all) {
    if (usedA.has(m.source) || usedB.has(m.target)) continue;
    usedA.add(m.source);
    usedB.add(m.target);
    picked.push(m);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function bestMatch(anchorsA, anchorsB) {
  return findMatches(anchorsA, anchorsB, { limit: 1 })[0] || null;
}