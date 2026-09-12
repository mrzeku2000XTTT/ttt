import { activeClip, addScene, sampleKeys, splitClip, uid } from '@/components/cam/camTimelineModel';

export default function useCamTimelineEdits(setProject, snapshot, time) {
  const add = (start, duration = snapshot.duration) => setProject((p) => addScene(p, snapshot, start, duration));
  const addClip = (trackId) => setProject((p) => ({ ...p, tracks: p.tracks.map((t) => {
    const asset = snapshot.assets.find((a) => a.id === t.assetId);
    return t.id === trackId && asset ? { ...t, clips: [...t.clips, { id: uid(), start: time, duration: snapshot.duration, keys: [{ t: 0, x: asset.x, y: asset.y, z: asset.z, scale: asset.scale, aspect: asset.aspect, animationId: asset.animationId || '' }] }] } : t;
  }) }));
  const update = (id, patch) => setProject((p) => {
    const cut = p.cuts.find((c) => c.id === id);
    const delta = cut && patch.start !== undefined ? patch.start - cut.start : 0;
    return { cuts: p.cuts.map((c) => c.id === id ? { ...c, ...patch } : c), tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.map((c) => c.id === id ? { ...c, ...patch } : c.takeId === id ? { ...c, start: c.start + delta, ...(patch.duration !== undefined ? { duration: patch.duration } : {}) } : c) })) };
  });
  const remove = (id) => setProject((p) => ({ cuts: p.cuts.filter((c) => c.id !== id), tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.id !== id && c.takeId !== id) })) }));
  const split = () => setProject((p) => {
    const parts = new Map(p.cuts.map((c) => [c.id, splitClip(c, time)]));
    return { cuts: [...parts.values()].flat(), tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.flatMap((c) => splitClip(c, time).map((part) => {
      const cut = parts.get(c.takeId)?.find((s) => part.start >= s.start && part.start < s.start + s.duration);
      return cut ? { ...part, takeId: cut.id } : part;
    })) })) };
  });
  const splitSelected = (id) => setProject((p) => {
    const scene = p.cuts.find((c) => c.id === id);
    if (!scene) return { ...p, tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.flatMap((c) => c.id === id ? splitClip(c, time) : [c]) })) };
    const scenes = splitClip(scene, time); if (scenes.length === 1) return p;
    return { cuts: p.cuts.flatMap((c) => c.id === id ? scenes : [c]), tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.flatMap((c) => c.takeId !== id ? [c] : splitClip(c, time).map((part) => ({ ...part, takeId: scenes.find((s) => part.start >= s.start && part.start < s.start + s.duration)?.id || id }))) })) };
  });
  const duplicate = (id) => setProject((p) => {
    const scene = p.cuts.find((c) => c.id === id);
    if (scene) {
      const insert = scene.start + scene.duration, newId = uid(), clone = { ...scene, id: newId, start: insert, keys: scene.keys.map((k) => ({ ...k })) };
      return { cuts: [...p.cuts.map((c) => c.id !== id && c.start >= insert ? { ...c, start: c.start + scene.duration } : c), clone], tracks: p.tracks.map((t) => ({ ...t, clips: [...t.clips.map((c) => c.takeId !== id && c.start >= insert ? { ...c, start: c.start + scene.duration } : c), ...t.clips.filter((c) => c.takeId === id).map((c) => ({ ...c, id: uid(), takeId: newId, start: c.start + scene.duration, keys: c.keys.map((k) => ({ ...k })) }))] })) };
    }
    return { ...p, tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.flatMap((c) => c.id === id ? [c, { ...c, id: uid(), takeId: undefined, start: c.start + c.duration, keys: c.keys.map((k) => ({ ...k })) }] : [c]) })) };
  });
  const hide = (id) => setProject((p) => ({ ...p, tracks: p.tracks.map((t) => t.id === id ? { ...t, hidden: !t.hidden } : t) }));
  const applyAnimation = (assetId, animationId, intensity = 1, selectedId) => setProject((p) => ({ ...p, tracks: p.tracks.map((track) => {
    if (track.assetId !== assetId) return track;
    const chosen = track.clips.find((c) => c.id === selectedId) || activeClip(track.clips, time) || track.clips[track.clips.length - 1];
    const asset = snapshot.assets.find((a) => a.id === assetId);
    if (!chosen && asset) return { ...track, clips: [...track.clips, { id: uid(), start: time, duration: snapshot.duration, animationId, animationIntensity: intensity, keys: [{ t: 0, x: asset.x, y: asset.y, z: asset.z, scale: asset.scale, aspect: asset.aspect }] }] };
    return { ...track, clips: track.clips.map((c) => c.id === chosen?.id ? { ...c, animationId, animationIntensity: intensity } : c) };
  }) }));
  return { add, addClip, update, remove, split, splitSelected, duplicate, hide, applyAnimation };
}