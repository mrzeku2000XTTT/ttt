import { sliceChannels } from '@/components/cam/camPropertyKeys';
export const uid = () => crypto.randomUUID();
export const endTime = (project) => Math.max(0, ...project.cuts.map((c) => c.start + c.duration), ...project.tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)));
export const activeClip = (clips, time) => [...clips].reverse().find((c) => time >= c.start && time < c.start + c.duration);
export function sampleKeys(keys, time) {
  if (!keys?.length) return {};
  const a = [...keys].reverse().find((k) => k.t <= time) || keys[0];
  const b = keys.find((k) => k.t > time) || a;
  const p = b.t === a.t ? 0 : Math.max(0, Math.min(1, (time - a.t) / (b.t - a.t)));
  return Object.fromEntries(Object.keys(a).filter((k) => k !== 't').map((k) => [k, typeof a[k] === 'number' && typeof b[k] === 'number' ? a[k] + (b[k] - a[k]) * p : a[k]]));
}
export function captureScene(media, offset, rig, moveId, intensity, duration) {
  return { duration, camera: { ...rig, moveId, intensity }, assets: media.map((m) => ({ id: m.id, name: m.name, x: m.id === 'primary' ? offset.x * 2.4 : m.pos.x, y: m.id === 'primary' ? offset.y * 1.6 : m.pos.y, z: m.id === 'primary' ? offset.z * 2.2 : m.pos.z, scale: m.scale || 1, aspect: m.aspect || (m.id === 'primary' ? 16/9 : 1), animationId: m.animationId || '' })) };
}
export function addScene(project, snapshot, start, duration, id = uid()) {
  const cut = { id, start, duration, fromProgress: 0, toProgress: 1, keys: [{ t: 0, ...snapshot.camera }] };
  const tracks = [...project.tracks];
  for (const asset of snapshot.assets) {
    let index = tracks.findIndex((t) => t.assetId === asset.id);
    if (index < 0) { index = tracks.length; tracks.push({ id: uid(), assetId: asset.id, name: asset.name, hidden: false, clips: [] }); }
    tracks[index] = { ...tracks[index], clips: [...tracks[index].clips, { id: uid(), takeId: id, start, duration, keys: [{ t: 0, x: asset.x, y: asset.y, z: asset.z, scale: asset.scale, aspect: asset.aspect, animationId: asset.animationId || '' }] }] };
  }
  return { cuts: [...project.cuts, cut], tracks };
}
export function recordSample(project, id, snapshot, elapsed) {
  const append = (keys, value) => [...keys, { t: elapsed, ...value }];
  return { cuts: project.cuts.map((c) => c.id === id ? { ...c, duration: Math.max(0.1, elapsed), keys: append(c.keys, snapshot.camera) } : c), tracks: project.tracks.map((track) => {
    const asset = snapshot.assets.find((a) => a.id === track.assetId);
    return { ...track, clips: track.clips.map((c) => c.takeId === id && asset ? { ...c, duration: Math.max(0.1, elapsed), keys: append(c.keys, { x: asset.x, y: asset.y, z: asset.z, scale: asset.scale, aspect: asset.aspect, animationId: asset.animationId || '' }) } : c) };
  }) };
}
export function splitClip(clip, time) {
  const t = time - clip.start;
  if (t <= 0.01 || t >= clip.duration - 0.01) return [clip];
  const boundary = sampleKeys(clip.keys, t);
  const mid = (clip.fromProgress || 0) + ((clip.toProgress ?? 1) - (clip.fromProgress || 0)) * t / clip.duration;
  return [{ ...clip, channels: sliceChannels(clip.channels,0,t), ...(clip.fromProgress !== undefined ? { toProgress: mid } : {}), duration: t, keys: [...clip.keys.filter((k) => k.t < t), { t, ...boundary }] }, { ...clip, channels: sliceChannels(clip.channels,t,clip.duration), ...(clip.fromProgress !== undefined ? { fromProgress: mid } : {}), id: uid(), start: time, duration: clip.duration - t, keys: [{ t: 0, ...boundary }, ...clip.keys.filter((k) => k.t > t).map((k) => ({ ...k, t: k.t - t }))] }];
}