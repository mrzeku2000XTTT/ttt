import { activeClip, endTime, sampleKeys } from '@/components/cam/camTimelineModel';
import { animationState } from '@/components/cam/camAnimationLibrary';
import { propertyPose } from '@/components/cam/camPropertyKeys';

const IDLE_ANIM = { dx: 0, dy: 0, dz: 0, scale: 1, rot: 0, opacity: 1, blur: 0, glow: 0 };

export const camHasTimeline = (project) => (project?.cuts?.length || 0) > 0 || (project?.tracks?.length || 0) > 0;

// Pure timeline sampler — the exact 2D scene (camera + layered assets, with
// keyframes, property channels and animation presets applied) at time t.
// Shared by the live preview and the MP4 exporter so both always match.
export function camSceneAt(project, snapshot, t) {
  const total = endTime(project);
  const time = Math.min(Math.max(0, t), Math.max(0, total - 0.00001));
  const cut = activeClip(project.cuts, time);
  const camera = cut ? sampleKeys(cut.keys, time - cut.start) : snapshot.camera;
  const progress = camera.progress ?? (cut ? (cut.fromProgress || 0) + ((cut.toProgress ?? 1) - (cut.fromProgress || 0)) * (time - cut.start) / cut.duration : 0);
  const assets = project.tracks.filter((track) => !track.hidden).flatMap((track) => {
    const clip = activeClip(track.clips, time); if (!clip) return [];
    const sampled = sampleKeys(clip.keys, time - clip.start);
    const base = { ...sampled, ...propertyPose(clip, time - clip.start, sampled) };
    const anim = clip.animationId ? animationState(clip.animationId, (time - clip.start) / clip.duration, clip.animationIntensity || 1) : IDLE_ANIM;
    return [{ id: track.assetId, ...base, x: base.x + anim.dx, y: base.y + anim.dy, z: base.z + anim.dz, scale: base.scale * anim.scale, rotation: (base.rotation || 0) + anim.rot, opacity: (base.opacity ?? 1) * anim.opacity, blur: anim.blur, glow: anim.glow, animationId: clip.animationId || '' }];
  });
  return { camera, progress, assets };
}