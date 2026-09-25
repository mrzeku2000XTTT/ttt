// Applying a scene patch — the one place both the inspector and the AI editor
// go through, so nested groups merge instead of being replaced wholesale.

const NESTED = ['glow', 'background', 'matchCut', 'outgoing', 'incoming'];

export const SCENE_FIELD_LABELS = {
  text: 'the words',
  fontSize: 'font size',
  fontFamily: 'font family',
  weight: 'font weight',
  textColors: 'type gradient',
  gradientAnimation: 'gradient animation',
  animation: 'text animation',
  easing: 'easing',
  speed: 'speed',
  slideSpeed: 'slide speed',
  slideStart: 'slide start offset',
  slideEnd: 'slide end offset',
  duration: 'scene length',
  glow: 'glow',
  background: 'background',
  matchCut: 'match cut',
};

export function mergeScenePatch(scene, patch) {
  if (!patch || typeof patch !== 'object') return scene;
  const next = { ...scene };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (!(key in scene)) return;
    if (NESTED.includes(key) && typeof value === 'object' && !Array.isArray(value)) {
      next[key] = { ...(scene[key] || {}), ...value };
    } else {
      next[key] = value;
    }
  });
  return next;
}