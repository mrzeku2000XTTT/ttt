// Scene-level integration for match cuts.
//
// The studio keeps one composition, but layers carry a scene tag (`scene: 'A'`,
// `scene: 'B'`, …). Those tags are the two scenes the planner reasons about, so
// nothing about the existing scene model changes — a match cut is just another
// object on the scene, alongside layers and morphs.

import { makeLayer } from './morphEngine';
import { sceneAnchors } from './transitionAnchors';
import { findMatches } from './transitionMatcher';
import { createMatchCutTransition, MATCH_CUT_PRESETS, replanTransition, TRANSITION_TYPES } from './transitionPlanner';

export { MATCH_CUT_PRESETS, TRANSITION_TYPES };

export const SCENE_IDS = ['A', 'B'];
export const tagOf = (layer) => layer.scene || 'A';

export function sceneIds(scene) {
  const ids = [];
  (scene.layers || []).forEach((l) => {
    const t = tagOf(l);
    if (!ids.includes(t)) ids.push(t);
  });
  return ids.length ? ids : ['A'];
}

export const sceneBlock = (scene, id) => ({
  id,
  layers: (scene.layers || []).filter((l) => tagOf(l) === id),
});

/** Everything the planner and the editor need to reason about a scene pair. */
export function transitionContext(scene, W = 1280, H = 720) {
  const ids = sceneIds(scene);
  const A = sceneBlock(scene, ids[0]);
  const B = sceneBlock(scene, ids[1] || ids[0]);
  const anchorsA = sceneAnchors(A.layers, 0, W, H, A.id);
  const anchorsB = sceneAnchors(B.layers, 0, W, H, B.id);
  return { ids, A, B, anchorsA, anchorsB, candidates: findMatches(anchorsA, anchorsB, { limit: 8 }) };
}

export function planFor(scene, options = {}) {
  const ctx = transitionContext(scene);
  return createMatchCutTransition(ctx.A, ctx.B, options);
}

export function replanInScene(scene, plan, patch = {}) {
  const ctx = transitionContext(scene);
  return replanTransition(plan, ctx.A, ctx.B, patch);
}

export const addTransition = (scene, plan) => ({ ...scene, transitions: [...(scene.transitions || []), plan] });

export const updateTransition = (scene, id, patch) => ({
  ...scene,
  transitions: (scene.transitions || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
});

export const deleteTransition = (scene, id) => ({
  ...scene,
  transitions: (scene.transitions || []).filter((t) => t.id !== id),
});

/**
 * The MVP test as a scene: a Music button on its own, then a Now-playing screen
 * with a Thriller card in it. The planner finds the pair by itself.
 */
export function matchCutDemoScene() {
  const button = makeLayer({
    type: 'card',
    name: 'Music button',
    scene: 'A',
    x: 0.3,
    y: 0.5,
    w: 0.2,
    h: 0.1,
    radius: 0.055,
    color: '#f4f4f5',
    text: 'Music',
    textColor: '#0a0a0a',
    textSize: 0.03,
    size: 0.1,
  });
  const screen = makeLayer({
    type: 'card',
    name: 'Now playing screen',
    scene: 'B',
    x: 0.5,
    y: 0.5,
    w: 0.68,
    h: 0.68,
    radius: 0.05,
    color: '#15151c',
    text: '',
    size: 0.1,
  });
  const card = makeLayer({
    type: 'card',
    name: 'Thriller card',
    scene: 'B',
    x: 0.5,
    y: 0.46,
    w: 0.3,
    h: 0.42,
    radius: 0.045,
    color: '#f7f7f8',
    text: 'THRILLER',
    subtext: 'Michael Jackson',
    textColor: '#0a0a0a',
    textSize: 0.045,
    size: 0.1,
  });
  const caption = makeLayer({
    type: 'text',
    name: 'Caption',
    scene: 'B',
    x: 0.5,
    y: 0.79,
    text: 'Now playing · 1982',
    color: '#9a9aa5',
    size: 0.05,
  });

  const layers = [button, screen, card, caption];
  const plan = createMatchCutTransition(
    { id: 'A', layers: [button] },
    { id: 'B', layers: [screen, card, caption] },
    { preset: 'ui', start: 0.6, width: 1280, height: 720 }
  );

  return {
    name: 'Match cut · Music → Thriller',
    duration: 4,
    markers: [],
    layers,
    transitions: plan ? [plan] : [],
  };
}