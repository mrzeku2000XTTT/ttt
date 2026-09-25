// Lumifly — the motion-type studio's shared vocabulary: type, easing, gradient
// and text-animation presets, plus the scene model every panel edits.

export const LUMIFLY_PROJECT_KEY = 'lumifly_project_v1';

export const RESOLUTIONS = ['720P', '1080P', '4K'];
export const RESOLUTION_SCALE = { '720P': 0.75, '1080P': 1, '4K': 2 };

export const FONT_FAMILIES = [
  'SF Pro Display',
  'Helvetica Regular',
  'Inter',
  'Space Grotesk',
  'Syncopate',
  'Fraunces',
  'Georgia',
];

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

export const EASINGS = [
  {
    id: 'easeInOutCubic',
    label: 'easeInOutCubic',
    fn: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  },
  { id: 'easeOutExpo', label: 'easeOutExpo', fn: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)) },
  { id: 'easeOutCubic', label: 'easeOutCubic', fn: (t) => 1 - Math.pow(1 - t, 3) },
  { id: 'easeInOutSine', label: 'easeInOutSine', fn: (t) => -(Math.cos(Math.PI * t) - 1) / 2 },
  {
    id: 'easeOutBack',
    label: 'easeOutBack',
    fn: (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  },
  { id: 'linear', label: 'linear', fn: (t) => t },
];

export const easingFn = (id) => (EASINGS.find((e) => e.id === id) || EASINGS[0]).fn;

/**
 * Text animations return the layer's motion at an eased progress of 0 → 1.
 * Three of them are the Camera Studio text presets, carried over unchanged so
 * both studios move type the same way.
 */
export const TEXT_ANIMATIONS = [
  {
    id: 'motion-text',
    label: 'MotionTextAnimation',
    description: 'Type rises on an eased slide and settles into place',
    build: (p) => ({ x: 0, y: (1 - p) * 0.12, scale: 0.97 + p * 0.03, opacity: Math.min(1, p * 1.5) }),
  },
  {
    id: 'oversize-rise',
    label: 'Oversize Rise',
    description: 'Camera Studio · huge tight-cropped type settles in with an eased rise and slow push',
    build: (p) => ({ x: 0, y: (1 - p) * -0.08, scale: 0.88 + p * 0.12, opacity: 1 }),
  },
  {
    id: 'left-sweep',
    label: 'Left Sweep',
    description: 'Camera Studio · oversize type slides in from the left and drifts to rest',
    build: (p) => ({ x: (1 - p) * -0.72, y: 0, scale: 1, opacity: 1 }),
  },
  {
    id: 'soft-fade',
    label: 'Soft Fade',
    description: 'Camera Studio · type eases up from below into a gentle fade-in',
    build: (p) => ({ x: 0, y: (1 - p) * -0.06, scale: 0.94 + p * 0.06, opacity: p }),
  },
  {
    id: 'fade-up-words',
    label: 'FadeUpWords',
    description: 'Each word rises and fades in behind the one before it',
    stagger: 0.14,
    build: (p) => ({ x: 0, y: (1 - p) * 0.16, scale: 1, opacity: Math.min(1, p * 1.4) }),
  },
];

export const textAnimation = (id) => TEXT_ANIMATIONS.find((a) => a.id === id) || TEXT_ANIMATIONS[0];

export const GRADIENT_ANIMATIONS = [
  { id: 'still', label: 'Still' },
  { id: 'sweep', label: 'Sweep' },
  { id: 'pulse', label: 'Pulse' },
];

export const BACKGROUND_MOTIONS = [
  { id: 'mesh', label: 'Mesh drift' },
  { id: 'sweep', label: 'Aurora sweep' },
  { id: 'still', label: 'Still' },
];

export const BACKGROUND_PRESETS = [
  { id: 'peach', label: 'Peach dusk', colors: ['#f5dcc5', '#d8a47f', '#5a301f'] },
  { id: 'studio', label: 'Studio white', colors: ['#ffffff', '#ececec', '#c9c4bd'] },
  { id: 'midnight', label: 'Midnight', colors: ['#0a0a12', '#1b1046', '#3b1470'] },
  { id: 'kaspa', label: 'Kaspa teal', colors: ['#00c2a8', '#0b6f6a', '#052a2c'] },
];

export const DEFAULT_TEXT_COLORS = ['#ffffff', '#ffe9d6', '#d8a47f'];

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `scene-${Math.random().toString(36).slice(2)}`;

export function createScene(name = 'scene-1', patch = {}) {
  return {
    id: newId(),
    name,
    text: 'Make It Happen.',
    fontSize: 300,
    fontFamily: 'SF Pro Display',
    weight: 700,
    textColors: [...DEFAULT_TEXT_COLORS],
    gradientAnimation: 'sweep',
    background: { colors: [...BACKGROUND_PRESETS[0].colors], motion: 'mesh', speed: 0.6 },
    animation: 'motion-text',
    easing: 'easeInOutCubic',
    speed: 0.7,
    slideSpeed: 0.9,
    slideStart: 0,
    slideEnd: -200,
    glow: { on: false, color: '#ffffff', intensity: 0.5, dissolve: 5 },
    matchCut: { on: true, direction: 'left' },
    outgoing: { duration: 0.5, slideDistance: 0.5, driftAmount: 0.15, driftOver: 2.5, driftCurve: 'easeInOutCubic' },
    incoming: { goldenRatio: true, duration: 1, slideDistance: 0.5, opacityStart: 0, scaleStart: 1, easing: 'easeOutCubic' },
    duration: 6,
    ...patch,
  };
}

/** A scene copy with its own id, so duplicating never shares a record. */
export function cloneScene(scene, name) {
  const copy = JSON.parse(JSON.stringify(scene));
  copy.id = newId();
  if (name) copy.name = name;
  return copy;
}

export function defaultProject() {
  return {
    name: 'Untitled project',
    scenes: [
      createScene('scene-1'),
      createScene('scene-2', {
        text: 'Then It Lands.',
        animation: 'fade-up-words',
        textColors: ['#ffffff', '#cfe9ff', '#8fb8ff'],
      }),
    ],
  };
}