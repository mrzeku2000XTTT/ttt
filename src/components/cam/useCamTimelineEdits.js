import { addScene, sampleKeys, splitClip, uid } from '@/components/cam/camTimelineModel';

export default function useCamTimelineEdits(setProject, snapshot, time) {
  const add = (start, duration = snapshot.duration) => setProject((p) => addScene(p, snapshot, start, duration));
  const addClip = (trackId) => setProject((p) => ({ ...p, tracks: p.tracks.map((t) => {
    const asset = snapshot.assets.find((a) => a.id === t.assetId);
    return t.id === trackId && asset ? { ...t, clips: [...t.clips, { id: uid(), start: time, duration: snapshot.duration, keys: [{ t: 0, x: asset.x, y: asset.y, z: asset.z, scale: asset.scale }] }] } : t;
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
  const hide = (id) => setProject((p) => ({ ...p, tracks: p.tracks.map((t) => t.id === id ? { ...t, hidden: !t.hidden } : t) }));
  return { add, addClip, update, remove, split, hide };
}