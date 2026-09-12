import { useEffect, useRef, useState } from 'react';
import { activeClip, endTime, sampleKeys, uid } from '@/components/cam/camTimelineModel';
import useCamTimelineClock from '@/components/cam/useCamTimelineClock';
import useCamTimelineEdits from '@/components/cam/useCamTimelineEdits';
import { animationState } from '@/components/cam/camAnimationLibrary';

export default function useCamTimeline(address, snapshot) {
  const [project, setProject] = useState(() => JSON.parse(localStorage.getItem(`cam_timeline_${address}`) || 'null') || { cuts: [], tracks: [] });
  const [enabled, setEnabled] = useState(false), [selected, setSelected] = useState(null);
  const enabledRef = useRef(enabled); enabledRef.current = enabled;
  const projectRef = useRef(project), snapshotRef = useRef(snapshot);
  projectRef.current = project; snapshotRef.current = snapshot;
  const clock = useCamTimelineClock(projectRef, snapshotRef, setProject);
  const edits = useCamTimelineEdits(setProject, snapshot, clock.time);
  useEffect(() => { const t = setTimeout(() => localStorage.setItem(`cam_timeline_${address}`, JSON.stringify(project)), 400); return () => clearTimeout(t); }, [project, address]);
  useEffect(() => {
    const added = snapshot.assets.filter((a) => !project.tracks.some((t) => t.assetId === a.id));
    if (!added.length) return;
    setProject((p) => ({ ...p, tracks: [...p.tracks, ...added.map((a) => ({ id: uid(), assetId: a.id, name: a.name, hidden: false, clips: [{ id: uid(), start: clock.time, duration: snapshot.duration, keys: [{ t: 0, x: a.x, y: a.y, z: a.z, scale: a.scale, aspect: a.aspect, animationId: a.animationId || '' }] }] }))] }));
  }, [snapshot.assets.map((a) => a.id).join('|')]);
  const total = endTime(project), t = Math.min(clock.time, Math.max(0, total - 0.00001));
  const cut = activeClip(project.cuts, t), camera = cut ? sampleKeys(cut.keys, t - cut.start) : snapshot.camera;
  const scene = clock.recording ? { ...snapshot, progress: Math.min(1, (clock.time - (clock.take.current?.start || 0)) / (clock.take.current?.duration || snapshot.duration)) } : {
    camera, progress: camera.progress ?? (cut ? (cut.fromProgress || 0) + ((cut.toProgress ?? 1) - (cut.fromProgress || 0)) * (t - cut.start) / cut.duration : 0),
    assets: project.tracks.filter((track) => !track.hidden).flatMap((track) => {
      const clip = activeClip(track.clips, t); if (!clip) return [];
      const base = sampleKeys(clip.keys, t - clip.start), progress = (t - clip.start) / clip.duration;
      const anim = clip.animationId ? animationState(clip.animationId, progress, clip.animationIntensity || 1) : { dx:0,dy:0,dz:0,scale:1,rot:0,opacity:1,blur:0,glow:0 };
      return [{ id: track.assetId, ...base, x: base.x + anim.dx, y: base.y + anim.dy, z: base.z + anim.dz, scale: base.scale * anim.scale, rotation: anim.rot, opacity: anim.opacity, blur: anim.blur, glow: anim.glow, animationId: clip.animationId || '' }];
    }),
  };
  const seek = (time) => { if (clock.recording) return; enabledRef.current = true; setEnabled(true); clock.setRunning(false); clock.seek(Math.min(total, Math.max(0, time))); };
  const play = () => { enabledRef.current = true; setEnabled(true); if (clock.time >= total) clock.seek(0); clock.setRunning(!clock.running); };
  const record = () => { enabledRef.current = true; setEnabled(true); clock.recording ? clock.stopRecording() : clock.startRecording(); };
  const leave = () => { clock.stopRecording(); clock.setRunning(false); enabledRef.current = false; setEnabled(false); };
  return { ...clock, ...edits, applyAnimation: (assetId, preset, intensity) => { enabledRef.current = true; setEnabled(true); edits.applyAnimation(assetId, preset, intensity, selected); }, project, total, enabled, scene, selected, setSelected, seek, play, record, leave, isEnabled: () => enabledRef.current, enable: () => { enabledRef.current = true; setEnabled(true); } };
}