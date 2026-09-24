// Visual anchors: what an object *is*, in terms a transition can reason about.
//
// Pure geometry and naming — no React, no canvas. Given a layer and a moment in
// time it returns the same structured anchor every time, so match scoring and
// planning can be tested on their own.

import { layerBox, sampleLayer } from './morphEngine';

const NAME_ROLES = [
  [/logo|brand|mark|wordmark/, 'logo'],
  [/avatar|profile|headshot|portrait/, 'avatar'],
  [/icon|glyph|badge|symbol/, 'icon'],
  [/button|btn|cta|pill|tab/, 'button'],
  [/dashboard|workspace|console|panel|screen|window/, 'device'],
  [/card|tile|album|cover|poster|thumbnail/, 'card'],
  [/cursor|pointer/, 'cursor'],
  [/chart|graph|plot|metric|stat/, 'graph'],
  [/background|backdrop|bg|wall/, 'background'],
];

/** The role an object plays, inferred from its type first, then its name. */
export function semanticRole(layer) {
  const type = layer.type;
  if (type === 'image') return 'image';
  if (type === 'text') return 'text';
  if (type === 'card') {
    const name = String(layer.name || '').toLowerCase();
    const hit = NAME_ROLES.find(([re]) => re.test(name));
    if (hit) return hit[1];
    return 'card';
  }
  if (type === 'shape') {
    if (layer.shape === 'circle') return 'circle';
    if (layer.shape === 'rect' || layer.shape === 'square') return 'rectangle';
    return 'shape';
  }
  return 'object';
}

/** Geometry, not intent: what silhouette does this actually read as? */
export function classifyShape(layer, box, W, H) {
  const ratio = box.w / Math.max(1, box.h);
  const round = Math.abs(ratio - 1) < 0.2;
  if (layer.type === 'shape' && layer.shape === 'circle') return 'circle';
  if (layer.type === 'card') {
    const radiusPx = (layer.radius || 0) * Math.min(W, H);
    if (round && radiusPx > 0.3 * Math.min(box.w, box.h)) return 'circle';
    if (radiusPx > 0.015 * Math.min(W, H)) return 'rounded-rect';
  }
  if (round) return 'square';
  return 'rect';
}

/** One object, described for matching and planning. */
export function layerAnchor(layer, time, W, H, sceneId = 'A') {
  const box = layerBox(layer, time, W, H);
  const p = sampleLayer(layer, time);
  return {
    id: layer.id,
    scene: sceneId,
    name: layer.name || layer.type,
    type: layer.type,
    bounds: { x: box.left, y: box.top, w: box.w, h: box.h },
    center: { x: box.cx, y: box.cy },
    size: { w: box.w, h: box.h },
    normalized: { x: box.cx / W, y: box.cy / H, w: box.w / W, h: box.h / H },
    rotation: p.rotation,
    opacity: p.opacity,
    radius: layer.type === 'card' ? p.radius : 0,
    shape: classifyShape(layer, box, W, H),
    color: layer.color,
    semanticRole: semanticRole(layer),
    prominence: (box.w * box.h) / (W * H),
  };
}

export function sceneAnchors(layers, time, W, H, sceneId = 'A') {
  return (layers || [])
    .filter((l) => l.visible !== false && sampleLayer(l, time).opacity > 0.02)
    .map((l) => layerAnchor(l, time, W, H, sceneId));
}