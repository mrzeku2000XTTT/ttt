import React from 'react';

const threeElements = new Set([
  'group', 'mesh', 'lineSegments', 'primitive', 'color', 'fog', 'axesHelper',
  'planeGeometry', 'boxGeometry', 'cylinderGeometry', 'meshBasicMaterial',
  'lineBasicMaterial',
]);

// Visual editor markers describe DOM nodes. R3F instead interprets their
// hyphens as paths (data.source.location) on a Three.js object.
// This factory is scoped to CAM's two scene files; DOM labels stay editable.
export default function camSceneElement(type, props, ...children) {
  if (props && (typeof type !== 'string' || threeElements.has(type))) {
    const clean = {};
    for (const key of Object.keys(props)) {
      if (!key.startsWith('data-')) clean[key] = props[key];
    }
    return React.createElement(type, clean, ...children);
  }
  return React.createElement(type, props, ...children);
}