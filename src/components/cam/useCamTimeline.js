import { useEffect, useRef, useState } from 'react';
import { activeClip, endTime, sampleKeys, uid } from '@/components/cam/camTimelineModel';
import useCamTimelineClock from '@/components/cam/useCamTimelineClock';
import useCamTimelineEdits from '@/components/cam/useCamTimelineEdits';

export default function useCamTimeline(address, snapshot) {
  const [project, setProject] = useState(() => JSON.parse(localStorage.getItem(`cam_timeline_${address}`) || 'null') || { cuts: [], tracks: [] });
  const [enabled, setEnabled] = useState(false), [selected, setSelected] = useState(null);
  const projectRef = useRef(project), snapshotRef = useRef(snapshot);
  projectRef.current = project; snapshotRef.current = snapshot;
  const clock = useCamTimelineClock(projectRef, snapshotRef, setProject);
  const edits = useCamTimelineEdits(setProject, snapshot, clock.time);
  useEffect(() => { const t = setTimeout(() => localStorage.setItem(`cam_timeline_${address}`, JSON.stringify(project)), 400); return () => clearTimeout(t); }, [project, address]);
  useEffect(() => {
    const added = snapshot.assets.filter((a) => !project.tracks.some((t) => t.assetId === a.id));
    if (!added.length) return;
    setProject((p) => ({ ...p, tracks: [...p.tracks, ...added.map((a) => ({ id: uid(), assetId: a.id, name: a.name, hidden: false, clips: [{ id: uid(), start: clock.time, duration: snapshot.duration, keys: [{ t: 0, x: a.x, y: a.y, z: a.z, scale: a.scale }] }] }))] }));
  }, [snapshot.assets.map((a) => a.id).join('|')]);
  const total = endTime(project), t = Math.min(clock.time, Math.max(0, total - 0.00001));
  const cut = activeClip(project.cuts, t), camera = cut ? sampleKeys(cut.keys, t - cut.start) : snapshot.camera;
  const scene = clock.recording ? { ...snapshot, progress: Math.min(1, (clock.time - (clock.take.current?.start || 0)) / (clock.take.current?.duration || snapshot.duration)) } : {
    camera, progress: camera.progress ?? (cut ? (cut.fromProgress || 0) + ((cut.toProgress ?? 1) - (cut.fromProgress || 0)) * (t - cut.start) / cut.duration : 0),
    assets: project.tracks.filter((track) => !track.hidden).flatMap((track) => {
      const clip = activeClip(track.clips, t); return clip ? [{ id: track.assetId, ...sampleKeys(clip.keys, t - clip.start) }] : [];
    }),
  };
  const seek = (time) => { if (clock.recording) return; setEnabled(true); clock.setRunning(false); clock.seek(Math.min(total, Math.max(0, time))); };
  const play = () => { setEnabled(true); if (clock.time >= total) clock.seek(0); clock.setRunning(!clock.running); };
  const record = () => { setEnabled(true); clock.recording ? clock.stopRecording() : clock.startRecording(); };
  const leave = () => { clock.stopRecording(); clock.setRunning(false); setEnabled(false); };
  return { ...clock, ...edits, project, total, enabled, scene, selected, setSelected, seek, play, record, leave, enable: () => setEnabled(true) };
}