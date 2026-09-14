import { sample3D } from '@/lib/eta3DKeyframes';

const presetByComponent = (component = '') => {
  if (/Cards/.test(component)) return 'spin';
  if (/Browser|Phone|IPhone|MacBook|UIAnimation|Search/.test(component)) return 'tilt';
  return 'float';
};

export function buildAutoKeyframes(component, duration = 3, preset = 'auto', intensity = 1) {
  const d = Math.max(1, Number(duration) || 3);
  const k = Math.max(0, Number(intensity ?? 1));
  const mode = preset === 'auto' ? presetByComponent(component) : preset;
  const base = { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
  if (mode === 'spin') return [
    { ...base, time: 0, rotateX: 8 * k, rotateY: -18 * k, scale: 0.94 },
    { ...base, time: d * .33, y: -10 * k, rotateX: -5 * k, rotateY: 112 * k, scale: 1.03 },
    { ...base, time: d * .66, y: 7 * k, rotateX: 6 * k, rotateY: 238 * k, scale: 1.01 },
    { ...base, time: d, rotateX: 8 * k, rotateY: 342 * k, scale: 0.94 },
  ];
  if (mode === 'tilt') return [
    { ...base, time: 0, y: 14 * k, rotateX: 10 * k, rotateY: -14 * k, scale: 0.94 },
    { ...base, time: d * .35, y: -7 * k, rotateX: -4 * k, rotateY: 8 * k, scale: 1.03 },
    { ...base, time: d * .7, y: 3 * k, rotateX: 3 * k, rotateY: 14 * k, scale: 1.01 },
    { ...base, time: d, y: 0, rotateX: 0, rotateY: 0, scale: 1 },
  ];
  return [
    { ...base, time: 0, y: 16 * k, rotateZ: -1.5 * k, scale: 0.96 },
    { ...base, time: d * .3, y: -10 * k, rotateZ: 1 * k, scale: 1.02 },
    { ...base, time: d * .65, y: 7 * k, rotateZ: -0.5 * k, scale: 1.01 },
    { ...base, time: d, y: 0, rotateZ: 0, scale: 1 },
  ];
}

export function sampleAutoKeyframes(scene, advanced, frameProgress) {
  const duration = Math.max(1, Number(scene.duration) || 3);
  const frames = advanced.autoTransformKeyframes?.length > 1
    ? advanced.autoTransformKeyframes
    : buildAutoKeyframes(scene.component, duration, advanced.autoMotionPreset, advanced.autoMotionIntensity);
  return sample3D(frames, frameProgress * duration, {});
}