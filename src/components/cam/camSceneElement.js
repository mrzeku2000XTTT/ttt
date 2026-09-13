import React from 'react';

const domElements = new Set([
  'div', 'span', 'img', 'button', 'p', 'section', 'label', 'input', 'canvas',
]);

// Visual editor markers describe DOM nodes. R3F instead interprets their
// hyphens as paths (data.source.location) on a Three.js object. Preserve those
// markers only on real HTML tags and strip them from every R3F/custom element.
export default function camSceneElement(type, props, ...children) {
  if (props && (typeof type !== 'string' || !domElements.has(type))) {
    const clean = {};
    for (const key of Object.keys(props)) {
      if (!key.startsWith('data-')) clean[key] = props[key];
    }
    return React.createElement(type, clean, ...children);
  }
  return React.createElement(type, props, ...children);
}