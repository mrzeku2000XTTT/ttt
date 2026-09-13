import { activeClip, addScene, sampleKeys, uid } from '@/components/cam/camTimelineModel';

export function appendCameraMove(project, snapshot, at, id = uid()) {
  const start = Math.max(at, 0, ...project.cuts.map(c => c.start + c.duration));
  const duration = Math.max(.1, snapshot.duration);
  const next = addScene(project, snapshot, start, duration, id);
  return { ...next, cuts: next.cuts.map(c => c.id === id ? { ...c, keys: [
    { t: 0, ...snapshot.camera, progress: 0 },
    { t: duration, ...snapshot.camera, progress: 1 },
  ] } : c) };
}

export function keyCamera(project, snapshot, camera, at) {
  let cut = activeClip(project.cuts, at) || [...project.cuts].reverse().find(c => Math.abs(c.start + c.duration - at) < .001);
  if (!cut) {
    const id = uid();
    project = addScene(project, snapshot, at, Math.max(.1, snapshot.duration), id);
    cut = project.cuts.find(c => c.id === id);
  }
  const t = Math.min(cut.duration, Math.max(0, at - cut.start));
  const base = sampleKeys(cut.keys, t);
  const value = { ...base, ...camera, progress: camera.progress ?? base.progress ?? t / cut.duration };
  const keys = [...cut.keys.filter(k => Math.abs(k.t - t) > .001), { t, ...value }].sort((a,b) => a.t-b.t);
  return { ...project, cuts: project.cuts.map(c => c.id === cut.id ? { ...c, keys } : c) };
}