// Morph authoring: the relations themselves, the motion styles that shape them,
// and the UI-morph presets. Pure scene edits — the engine does the animating.
//
// A morph is one object: `from` a layer, `to` a layer, over a window, with an
// easing and an optional connecting arrow. Everything else is the engine's job.

import { makeLayer } from './morphEngine';
import { SHAPE_SEQUENCES, applyMorphSequence, isMorphSequence } from './morphSequence';

const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

// Behaviours, not templates: each style is a duration plus a curve.
export const MOTION_STYLES = [
  { id: 'smooth', label: 'Smooth', easing: 'easeInOut', duration: 1.2 },
  { id: 'snappy', label: 'Snappy', easing: 'easeOut', duration: 0.55 },
  { id: 'elastic', label: 'Elastic', easing: 'elastic', duration: 1.4 },
  { id: 'spring', label: 'Spring', easing: 'spring', duration: 1.1 },
  { id: 'cinematic', label: 'Cinematic', easing: 'easeInOut', duration: 2.2 },
  { id: 'minimal', label: 'Minimal', easing: 'easeOut', duration: 0.9 },
  { id: 'apple', label: 'Apple-style', easing: 'spring', duration: 0.8 },
  { id: 'saas', label: 'SaaS-style', easing: 'cubicBezier', duration: 0.7 },
];

// Generated album artwork the media-card presets morph into, so a button becomes
// a real card with a cover on it rather than an empty box. Replaceable per use.
export const CARD_ARTWORK =
  'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/de3a40f09_generated_image.png';

// The two boxes each preset builds. Real geometry a designer would start from.
export const UI_MORPHS = [
  {
    id: 'button-card',
    label: 'Button → Card',
    style: 'smooth',
    from: { name: 'Button', w: 0.22, h: 0.1, radius: 0.06, text: 'Music', color: '#f4f4f5' },
    to: {
      name: 'Card',
      w: 0.26,
      h: 0.42,
      radius: 0.045,
      text: 'THRILLER',
      subtext: 'Michael Jackson',
      color: '#f7f7f8',
      src: CARD_ARTWORK,
      textColor: '#ffffff',
      subtextColor: 'rgba(255,255,255,0.75)',
    },
  },
  {
    id: 'card-modal',
    label: 'Card → Modal',
    style: 'smooth',
    from: { name: 'Card', w: 0.24, h: 0.3, radius: 0.04, text: 'Track', color: '#f4f4f5' },
    to: { name: 'Modal', w: 0.44, h: 0.4, radius: 0.03, text: 'Now playing', subtext: 'Thriller · Michael Jackson', color: '#ffffff' },
  },
  {
    id: 'card-dashboard',
    label: 'Card → Dashboard',
    style: 'cinematic',
    from: { name: 'Card', w: 0.22, h: 0.26, radius: 0.04, text: 'Report', color: '#f4f4f5' },
    to: { name: 'Dashboard', w: 0.56, h: 0.46, radius: 0.025, text: 'Dashboard', subtext: '12 panels · live', color: '#ffffff' },
  },
  {
    id: 'icon-button',
    label: 'Icon → Button',
    style: 'snappy',
    from: { name: 'Icon', w: 0.09, h: 0.09, radius: 0.045, text: '♪', color: '#e9e9ec' },
    to: { name: 'Button', w: 0.28, h: 0.1, radius: 0.05, text: 'Play album', color: '#f4f4f5' },
  },
  {
    id: 'button-input',
    label: 'Button → Input',
    style: 'saas',
    from: { name: 'Button', w: 0.18, h: 0.09, radius: 0.045, text: 'Search', color: '#f4f4f5' },
    to: { name: 'Input', w: 0.44, h: 0.1, radius: 0.05, text: 'Type to search', color: '#ffffff' },
  },
  {
    id: 'thumbnail-player',
    label: 'Thumbnail → Player',
    style: 'smooth',
    from: { name: 'Thumbnail', w: 0.2, h: 0.13, radius: 0.03, text: '', color: '#e9e9ec' },
    to: { name: 'Player', w: 0.46, h: 0.34, radius: 0.035, text: 'Thriller', subtext: 'Michael Jackson · 5:57', color: '#ffffff' },
  },
  {
    id: 'avatar-profile',
    label: 'Avatar → Profile',
    style: 'spring',
    from: { name: 'Avatar', w: 0.1, h: 0.1, radius: 0.05, text: 'MJ', color: '#e9e9ec' },
    to: { name: 'Profile', w: 0.3, h: 0.44, radius: 0.04, text: 'Michael Jackson', subtext: 'Artist · 42 releases', color: '#ffffff' },
  },
  {
    id: 'list-detail',
    label: 'List item → Detail',
    style: 'smooth',
    from: { name: 'List item', w: 0.4, h: 0.08, radius: 0.03, text: 'Thriller', color: '#f4f4f5' },
    to: { name: 'Detail view', w: 0.46, h: 0.44, radius: 0.035, text: 'THRILLER', subtext: 'Michael Jackson · 1982', color: '#ffffff' },
  },
  {
    id: 'panel-large',
    label: 'Panel → Large panel',
    style: 'minimal',
    from: { name: 'Panel', w: 0.22, h: 0.2, radius: 0.03, text: 'Panel', color: '#f4f4f5' },
    to: { name: 'Large panel', w: 0.5, h: 0.44, radius: 0.03, text: 'Panel', subtext: 'expanded', color: '#ffffff' },
  },
  {
    id: 'text-logo',
    label: 'Text → Logo',
    style: 'elastic',
    // A real wordmark, not a card that happens to contain a word: the source is a
    // text layer, so the letters are what grows into the logo lockup. The plate
    // starts on the word's own box (w is sized to the word) and fades up as the
    // letters hand over, so it reads as one word turning into one logo.
    from: { type: 'text', name: 'Wordmark', text: 'prism', color: '#ffffff', size: 0.2, w: 0.19, h: 0.12 },
    to: {
      name: 'Logo lockup',
      w: 0.4,
      h: 0.26,
      radius: 0.055,
      text: 'PRISM',
      subtext: 'video inspector',
      color: '#f4f4f5',
      textColor: '#0a0a0a',
      subtextColor: 'rgba(10,10,10,0.6)',
      textSize: 0.05,
    },
  },
];

// Everything the AI director may pick from: the UI morphs, and the shape
// sequences, which are chains of transformations rather than a pair of boxes.
export const MORPH_PRESETS = [
  ...UI_MORPHS.map(({ id, label }) => ({ id, label })),
  ...SHAPE_SEQUENCES.map(({ id, label }) => ({ id, label })),
];

export function makeMorph(partial = {}) {
  return {
    id: uid('MR'),
    from: '',
    to: '',
    start: 0.4,
    duration: 1.2,
    easing: 'easeInOut',
    curve: 0.35,
    arrow: true,
    glow: 0.8,
    glowColor: '#7DDCFF',
    ...partial,
  };
}

export const addMorph = (scene, rel) => ({ ...scene, morphs: [...(scene.morphs || []), rel] });

export const updateMorph = (scene, id, patch) => ({
  ...scene,
  morphs: (scene.morphs || []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
});

export const deleteMorph = (scene, id) => ({
  ...scene,
  morphs: (scene.morphs || []).filter((m) => m.id !== id),
});

export function applyMotionStyle(scene, id, styleId) {
  const s = MOTION_STYLES.find((x) => x.id === styleId);
  return s ? updateMorph(scene, id, { duration: s.duration, easing: s.easing }) : scene;
}

// One side of a preset. A text side stays a text layer — that is what makes the
// letters themselves the thing that morphs.
const sideLayer = (spec, x) =>
  makeLayer({
    type: spec.type === 'text' ? 'text' : 'card',
    size: 0.1,
    textColor: '#0a0a0a',
    x,
    y: 0.5,
    ...spec,
  });

// Roughly how wide a word renders at a given text size, as a fraction of the
// frame — used so a text→logo plate starts tight on the word instead of
// appearing as an unrelated box around it.
const wordWidth = (word, size) => Math.min(0.6, Math.max(0.1, word.length * (size || 0.2) * 0.19));

/** A preset drops in two layers and the morph between them. */
export function applyMorphPreset(scene, presetId, options = {}) {
  // A sequence is a whole chain of transformations, so it builds itself.
  if (isMorphSequence(presetId)) return applyMorphSequence(scene, presetId, options);
  const preset = UI_MORPHS.find((p) => p.id === presetId);
  if (!preset) return scene;
  const style = MOTION_STYLES.find((s) => s.id === preset.style) || MOTION_STYLES[0];
  // When the preset is a word becoming a logo, the word is the user's, not ours:
  // the wordmark keeps their spelling and the lockup carries it as a logotype.
  const word = String(options.text || '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const useWord = preset.from.type === 'text' && word;
  const fromSpec = useWord
    ? { ...preset.from, text: word, w: wordWidth(word, preset.from.size) }
    : preset.from;
  // The preset's own tagline is a placeholder for our sample brand — drop it when
  // the lockup is carrying the user's word instead.
  const toSpec = useWord
    ? { ...preset.to, text: word.toUpperCase(), subtext: '' }
    : preset.to;

  const from = sideLayer(fromSpec, 0.28);
  // The agent — or the user — may hand in a different cover for the target card.
  const to = sideLayer(
    options.image
      ? { ...toSpec, src: options.image, textColor: '#ffffff', subtextColor: 'rgba(255,255,255,0.75)' }
      : toSpec,
    0.7,
  );
  const rel = makeMorph({
    from: from.id,
    to: to.id,
    start: 0.4,
    duration: style.duration,
    easing: style.easing,
    curve: 0.4,
  });
  return {
    ...scene,
    duration: Math.max(scene.duration || 0, 0.4 + style.duration + 1.2),
    layers: [...scene.layers, from, to],
    morphs: [...(scene.morphs || []), rel],
  };
}

/**
 * The MVP test, as a scene: a Music button expands, reshapes and repositions
 * into the Thriller card while a glowing arrow draws itself between them.
 */
export function musicToThrillerScene() {
  const button = makeLayer({
    type: 'card',
    name: 'Music button',
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
  const card = makeLayer({
    type: 'card',
    name: 'Thriller card',
    x: 0.7,
    y: 0.5,
    w: 0.26,
    h: 0.4,
    radius: 0.045,
    color: '#f7f7f8',
    src: CARD_ARTWORK,
    text: 'THRILLER',
    subtext: 'Michael Jackson',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.75)',
    textSize: 0.045,
    size: 0.1,
  });
  return {
    name: 'UI morph · Music → Thriller',
    duration: 3,
    markers: [],
    layers: [button, card],
    morphs: [
      makeMorph({
        from: button.id,
        to: card.id,
        start: 0.5,
        duration: 1.2,
        easing: 'easeInOut',
        curve: 0.45,
        glow: 0.85,
        glowColor: '#7DDCFF',
      }),
    ],
  };
}