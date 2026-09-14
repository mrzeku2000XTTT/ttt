import { cameraEase } from '@/components/camerastudio/cameraEasing';
const values = (settings, frame = {}) => ({ x: frame.x ?? settings.x, y: frame.y ?? settings.y, z: frame.z ?? settings.z, zoom: frame.zoom ?? settings.zoom });
export function cameraTransformAt(settings, keyframes = [], time = 0, animate = false) {
  const frames = [...keyframes].sort((a, b) => a.time - b.time);
  let transform = values(settings);
  if (frames.length) {
    const nextIndex = frames.findIndex(frame => frame.time >= time), next = nextIndex < 0 ? frames.at(-1) : frames[nextIndex], previous = nextIndex <= 0 ? next : frames[nextIndex - 1];
    if (next === previous) transform = values(settings, next);
    else { const a = values(settings, previous), b = values(settings, next), mix = (time - previous.time) / Math.max(.001, next.time - previous.time), t = cameraEase(Math.max(0, Math.min(1, mix)), next.easing || settings.easing); transform = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, zoom: a.zoom + (b.zoom - a.zoom) * t }; }
  }
  if (!animate) return transform;
  const p = Math.max(0, Math.min(1, time / settings.duration)), wave = Math.sin(p * Math.PI * 2), eased = cameraEase(p, settings.easing);
  if (settings.motion === 'push') transform.zoom *= 1 + .12 * Math.sin(Math.PI * eased) ** 2;
  if (settings.motion === 'orbit') { transform.y += wave * 12; transform.x += Math.sin(p * Math.PI) * 5; }
  if (settings.motion === 'float') transform.z += wave * 2;
  return transform;
}
export function ensureCameraKeyframes(settings, keyframes = []) {
  const existing = [...keyframes].sort((a, b) => a.time - b.time), result = [];
  for (let second = 0; second <= Math.ceil(settings.duration); second += 1) { const transform = cameraTransformAt(settings, existing, Math.min(second, settings.duration)); result.push({ id: existing.find(frame => Math.abs(frame.time - second) < .01)?.id || crypto.randomUUID(), time: Math.min(second, settings.duration), ...transform, easing: settings.easing || 'auto' }); }
  return [...new Map(result.map(frame => [frame.time, frame])).values()];
}
export function upsertCameraKeyframe(settings, keyframes, time, patch) {
  const second = Math.max(0, Math.min(settings.duration, Math.round(time))), frames = ensureCameraKeyframes(settings, keyframes);
  return frames.map(frame => Math.abs(frame.time - second) < .01 ? { ...frame, ...patch, time: second, easing: settings.easing || 'auto' } : frame);
}