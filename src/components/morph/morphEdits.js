// Scene-level editing operations for Morph Motion Studio.
//
// The engine renders; these edit. Every one is pure — hand it a scene, get a new
// one back — so the studio calls them straight from setState and nothing is
// mutated behind the renderer's back.

import { DEFAULTS, clamp } from './morphEngine';

const round = (n) => Math.round(n * 1000) / 1000;

// Where a layer comes to rest: the last key of its track, else its static value.
const restVal = (layer, prop) => {
  const list = layer.tracks?.[prop];
  if (list && list.length) return list[list.length - 1].v;
  return layer[prop] ?? DEFAULTS[prop];
};

const lastKeyTime = (scene) =>
  scene.layers.reduce(
    (m, l) => Math.max(m, ...Object.values(l.tracks || {}).flat().map((k) => k.t), 0),
    0
  );

/* ---------------------------------------------------------------- duration */
export function setDuration(scene, seconds) {
  return { ...scene, duration: clamp(round(seconds), 0.5, 120) };
}

export function addTime(scene, seconds) {
  return setDuration(scene, (scene.duration || 3) + seconds);
}

/* ------------------------------------------------------------------ groups */
export function groupsOf(scene) {
  const out = [];
  scene.layers.forEach((l) => {
    if (l.group && !out.includes(l.group)) out.push(l.group);
  });
  return out;
}

export function groupMembers(scene, group) {
  return scene.layers.filter((l) => l.group === group);
}

export function setGroup(scene, layerIds, group) {
  const ids = new Set(layerIds);
  return { ...scene, layers: scene.layers.map((l) => (ids.has(l.id) ? { ...l, group: group || '' } : l)) };
}

export function uniqueGroupName(scene, base = 'Group') {
  const names = groupsOf(scene);
  let n = 1;
  while (names.includes(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

/* --------------------------------------------------------------- parenting */
// Move or scale a whole group while every member keeps its own animation: the
// delta is baked into each member's keys, so the renderer stays a flat,
// deterministic list of tracks (and the AI can keep animating one point).
export function transformGroup(scene, group, { dx = 0, dy = 0, scale = 1 }) {
  const members = groupMembers(scene, group);
  if (!members.length) return scene;
  const ids = new Set(members.map((l) => l.id));

  const cx = members.reduce((s, l) => s + restVal(l, 'x'), 0) / members.length;
  const cy = members.reduce((s, l) => s + restVal(l, 'y'), 0) / members.length;

  return {
    ...scene,
    layers: scene.layers.map((l) => {
      if (!ids.has(l.id)) return l;
      const tracks = { ...(l.tracks || {}) };
      const shift = (prop, fn) => {
        const list = tracks[prop];
        if (list?.length) tracks[prop] = list.map((k) => ({ ...k, v: round(fn(k.v)) }));
      };
      shift('x', (v) => cx + (v - cx) * scale + dx);
      shift('y', (v) => cy + (v - cy) * scale + dy);
      shift('scale', (v) => v * scale);
      return {
        ...l,
        x: round(cx + ((l.x ?? DEFAULTS.x) - cx) * scale + dx),
        y: round(cy + ((l.y ?? DEFAULTS.y) - cy) * scale + dy),
        scale: round((l.scale ?? 1) * scale),
        tracks,
      };
    }),
  };
}

/* ----------------------------------------------------------------- stagger */
// Offsets each targeted layer's keyframes by i × delay — the logo-assembly move.
export function stagger(scene, layerIds, delay = 0.1) {
  const ids = layerIds?.length ? new Set(layerIds) : null;
  let i = 0;
  const layers = scene.layers.map((l) => {
    if (ids && !ids.has(l.id)) return l;
    const offset = round(i * delay);
    i += 1;
    if (!offset) return l;
    const tracks = Object.fromEntries(
      Object.entries(l.tracks || {}).map(([prop, list]) => [
        prop,
        (list || []).map((k) => ({ ...k, t: round(k.t + offset) })),
      ])
    );
    return { ...l, tracks };
  });
  const next = { ...scene, layers };
  return setDuration(next, Math.max(next.duration || 3, lastKeyTime(next)));
}

/* ------------------------------------------------------------ keyframe ops */
export function setKeyEase(scene, layerId, prop, t, ease) {
  return {
    ...scene,
    layers: scene.layers.map((l) => {
      if (l.id !== layerId) return l;
      const list = (l.tracks?.[prop] || []).map((k) => (Math.abs(k.t - t) < 0.004 ? { ...k, ease } : k));
      return { ...l, tracks: { ...(l.tracks || {}), [prop]: list } };
    }),
  };
}

export function moveKey(scene, layerId, prop, t, nextT) {
  const at = clamp(round(nextT), 0, 120);
  return {
    ...scene,
    layers: scene.layers.map((l) => {
      if (l.id !== layerId) return l;
      const list = (l.tracks?.[prop] || [])
        .map((k) => (Math.abs(k.t - t) < 0.004 ? { ...k, t: at } : k))
        .sort((a, b) => a.t - b.t);
      return { ...l, tracks: { ...(l.tracks || {}), [prop]: list } };
    }),
  };
}

export function deleteKey(scene, layerId, prop, t) {
  return {
    ...scene,
    layers: scene.layers.map((l) => {
      if (l.id !== layerId) return l;
      const list = (l.tracks?.[prop] || []).filter((k) => Math.abs(k.t - t) > 0.004);
      const tracks = { ...(l.tracks || {}) };
      if (list.length) tracks[prop] = list;
      else delete tracks[prop];
      return { ...l, tracks };
    }),
  };
}

/* ------------------------------------------------------------------ markers */
export function addMarker(scene, t, label = 'Marker') {
  const markers = [
    ...(scene.markers || []),
    { id: `M${Math.random().toString(36).slice(2, 7)}`, t: round(Math.max(0, t)), label: String(label).slice(0, 18) },
  ];
  return { ...scene, markers: markers.sort((a, b) => a.t - b.t) };
}

export function removeMarker(scene, id) {
  return { ...scene, markers: (scene.markers || []).filter((m) => m.id !== id) };
}