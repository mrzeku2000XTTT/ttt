// Camera Studio text animation presets.
// Keyframes use the same transform + easing model as every other layer,
// so the existing keyframe engine moves these text presets directly.
export const CAMERA_TEXT_PRESETS = [
  {
    id: 'oversize-rise',
    name: 'Oversize Rise',
    description: 'Huge tight-cropped type settles in with an eased rise and slow push',
    text: 'Spin',
    keyframes: duration => [
      { time: 0, transform: { x: 0, y: -0.08, scale: 1.28, opacity: 1 } },
      { time: Math.min(1.2, duration * 0.35), transform: { x: 0, y: 0, scale: 1.5 }, easing: 'easeOut' },
      { time: duration, transform: { y: 0.02, scale: 1.56 }, easing: 'easeInOut' },
    ],
  },
  {
    id: 'left-sweep',
    name: 'Left Sweep',
    description: 'Oversize type slides in from the left and drifts to rest',
    text: 'Motion',
    keyframes: duration => [
      { time: 0, transform: { x: -0.72, y: 0, scale: 1.5, opacity: 1 } },
      { time: Math.min(1.3, duration * 0.4), transform: { x: 0, y: 0 }, easing: 'easeOut' },
      { time: duration, transform: { x: 0.03, y: 0 }, easing: 'easeInOut' },
    ],
  },
  {
    id: 'soft-fade',
    name: 'Soft Fade',
    description: 'Type eases up from below into a gentle fade-in',
    text: 'Focus',
    keyframes: duration => [
      { time: 0, transform: { y: -0.06, scale: 1.42, opacity: 0 } },
      { time: Math.min(1.4, duration * 0.45), transform: { y: 0, scale: 1.5, opacity: 1 }, easing: 'easeOut' },
      { time: duration, transform: { scale: 1.54, opacity: 1 }, easing: 'easeInOut' },
    ],
  },
];

export const createTextAsset = (preset, duration = 6) => ({
  id: crypto.randomUUID(),
  type: 'text',
  text: preset.text || 'Text',
  name: `${preset.name} text`,
  presetId: preset.id,
  transform: { x: 0, y: 0, scale: 1.5, rotation: 0, opacity: 1, visible: true },
  keyframes: preset.keyframes(Math.max(2, Number(duration) || 6)).map(frame => ({ id: crypto.randomUUID(), ...frame })),
});