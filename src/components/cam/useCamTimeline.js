import { useEffect, useRef, useState } from 'react';
import { endTime, uid } from '@/components/cam/camTimelineModel';
import useCamTimelineClock from '@/components/cam/useCamTimelineClock';
import useCamTimelineEdits from '@/components/cam/useCamTimelineEdits';
import { camSceneAt } from '@/components/cam/camSceneAt';
import { editProperty } from '@/components/cam/camPropertyKeys';
import { appendCameraMove, keyCamera } from '@/components/cam/camCameraTimeline';

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
  const total = endTime(project);
  const scene = clock.recording ? { ...snapshot, progress: Math.min(1, (clock.time - (clock.take.current?.start || 0)) / (clock.take.current?.duration || snapshot.duration)) } : camSceneAt(project, snapshot, clock.time);
  const seek = (time) => { if (clock.recording) return; enabledRef.current = true; setEnabled(true); clock.setRunning(false); clock.seek(Math.min(total, Math.max(0, time))); };
  const play = () => { enabledRef.current = true; setEnabled(true); if (clock.time >= total) clock.seek(0); clock.setRunning(!clock.running); };
  const record = () => { enabledRef.current = true; setEnabled(true); clock.recording ? clock.stopRecording() : clock.startRecording(); };
  const leave = () => { clock.stopRecording(); clock.setRunning(false); enabledRef.current = false; setEnabled(false); };
  const setProperty = (assetId, property, value, at = clock.time, options = {}) => {
    if (clock.recording) return;
    enabledRef.current = true; setEnabled(true); clock.setRunning(false);
    setProject(p=>editProperty(p,assetId,options.clipId||selected,property,at,value,options));
  };
  const appendMove = (nextSnapshot) => {
    const id = uid(), next = appendCameraMove(projectRef.current, nextSnapshot, clock.time, id);
    projectRef.current = next; setProject(next); setSelected(id);
    enabledRef.current = true; setEnabled(true); clock.setRunning(false); clock.seek(next.cuts.find(c => c.id === id).start);
  };
  const setCamera = (camera) => {
    if (clock.recording) return;
    enabledRef.current = true; setEnabled(true); clock.setRunning(false);
    setProject(p => keyCamera(p, snapshotRef.current, camera, clock.time));
  };
  const addTextTrack = (assetId,name) => setProject(p=>({...p,tracks:[...p.tracks,{id:uid(),assetId,name,hidden:false,clips:[{id:uid(),start:clock.time,duration:snapshot.duration,keys:[{t:0,x:0,y:0,z:.1,scale:.35}]}]}]}));
  return { ...clock, ...edits, appendMove, setCamera, setProperty, addTextTrack, applyAnimation: (assetId, preset, intensity) => { enabledRef.current = true; setEnabled(true); edits.applyAnimation(assetId, preset, intensity, selected); }, project, total, enabled, scene, selected, setSelected, seek, play, record, leave, isEnabled: () => enabledRef.current, enable: () => { enabledRef.current = true; setEnabled(true); } };
}