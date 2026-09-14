export const CAMERA_EASINGS = [
  ['auto', 'Auto easing'], ['linear', 'Linear'], ['easeIn', 'Ease in'],
  ['easeOut', 'Ease out'], ['easeInOut', 'Ease in & out']
];
export function cameraEase(value, easing = 'auto', distance = 0) {
  const t = Math.max(0, Math.min(1, value));
  if (easing === 'linear') return t;
  if (easing === 'easeIn') return t * t * t;
  if (easing === 'easeOut') return 1 - (1 - t) ** 3;
  if (easing === 'easeInOut') return t < .5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2;
  return distance > .45 ? (t < .5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2) : t * t * (3 - 2 * t);
}