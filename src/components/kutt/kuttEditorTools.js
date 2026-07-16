// Editor tool set — pure functions that editor agents use to build and manipulate clips.

const uid = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function createClip(assetId, track, start, duration, trimIn = 0) {
  return { id: uid(), assetId, track, start, duration, trimIn };
}

export function createHyperframe(text, start, duration, animation, stylePreset, track = 1) {
  return {
    id: uid(),
    clip_type: "hyperframe",
    track,
    start,
    duration,
    text: text || "",
    animation: animation || "fade_in",
    style_preset: stylePreset || "bold_white",
  };
}

export function splitClip(clips, clipId, atSecond) {
  const clip = clips.find((c) => c.id === clipId);
  if (!clip || atSecond <= clip.start || atSecond >= clip.start + clip.duration) return clips;
  const offset = atSecond - clip.start;
  const right = { ...clip, id: uid(), start: atSecond, duration: clip.duration - offset, trimIn: (clip.trimIn || 0) + offset };
  return clips.flatMap((c) => (c.id === clipId ? [{ ...c, duration: offset }, right] : [c]));
}

export function trimClip(clips, clipId, newDuration) {
  return clips.map((c) => (c.id === clipId ? { ...c, duration: Math.max(0.5, newDuration) } : c));
}

export function moveClip(clips, clipId, newStart, newTrack) {
  return clips.map((c) => {
    if (c.id !== clipId) return c;
    return {
      ...c,
      start: typeof newStart === "number" ? Math.max(0, newStart) : c.start,
      track: typeof newTrack === "number" ? Math.max(0, Math.min(2, newTrack)) : c.track,
    };
  });
}

export function deleteClip(clips, clipId) {
  return clips.filter((c) => c.id !== clipId);
}

// Build clips + hyperframes from an editor agent's plan, offset to the segment's timeline position
export function applyEditorPlan(plan, segmentAssets, segmentOffset) {
  const clips = [];
  const hyperframes = [];

  (plan.clips || []).forEach((c) => {
    const asset = segmentAssets[c.scene_index];
    if (!asset) return;
    clips.push(createClip(asset.id, c.track ?? 0, (c.start ?? 0) + segmentOffset, c.duration ?? asset.duration ?? 4));
  });

  (plan.hyperframes || []).forEach((h) => {
    hyperframes.push(createHyperframe(h.text, (h.start ?? 0) + segmentOffset, h.duration ?? 2, h.animation, h.style_preset));
  });

  return { clips, hyperframes };
}