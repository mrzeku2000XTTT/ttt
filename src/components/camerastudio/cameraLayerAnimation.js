import { cameraEase } from '@/components/camerastudio/cameraEasing';
export const baseLayerTransform = asset => ({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, visible: true, ...asset.transform });
export function layerTransformAt(asset, time, easing = 'auto') {
  const frames = [...(asset.keyframes || [])].sort((a, b) => a.time - b.time);
  if (!frames.length || time < frames[0].time) return baseLayerTransform(asset);
  const nextIndex = frames.findIndex(frame => frame.time >= time), next = nextIndex < 0 ? frames.at(-1) : frames[nextIndex], previous = nextIndex <= 0 ? next : frames[nextIndex - 1];
  if (next === previous) return { ...baseLayerTransform(asset), ...next.transform };
  const mix = Math.max(0, Math.min(1, (time - previous.time) / Math.max(.001, next.time - previous.time))), a = { ...baseLayerTransform(asset), ...previous.transform }, b = { ...a, ...next.transform }, distance = Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(b.scale - a.scale), t = cameraEase(mix, next.easing || easing, distance);
  return { ...a, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, scale: a.scale + (b.scale - a.scale) * t, rotation: a.rotation + (b.rotation - a.rotation) * t, opacity: a.opacity + (b.opacity - a.opacity) * t };
}
export function mergeLayerKeyframes(existing, captured) {
  const merged = [...(existing || [])];
  captured.forEach(frame => { const index = merged.findIndex(item => Math.abs(item.time - frame.time) < .06); if (index >= 0) merged[index] = frame; else merged.push(frame); });
  return merged.sort((a, b) => a.time - b.time);
}