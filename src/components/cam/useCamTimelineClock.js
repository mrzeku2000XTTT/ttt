import { useEffect, useRef, useState } from 'react';
import { addScene, endTime, recordSample, uid } from '@/components/cam/camTimelineModel';

export default function useCamTimelineClock(projectRef, snapshotRef, setProject) {
  const [time, setTime] = useState(0), [running, setRunning] = useState(false), [recording, setRecording] = useState(false);
  const current = useRef(0), playing = useRef(false), take = useRef(null);
  current.current = time; playing.current = running;
  const seek = (t) => { current.current = Math.max(0, t); setTime(current.current); };
  const stopRecording = () => {
    const r = take.current; if (!r) return;
    const elapsed = (performance.now() - r.wall) / 1000;
    const snapshot = snapshotRef.current;
    setProject((p) => recordSample(p, r.id, { ...snapshot, camera: { ...snapshot.camera, progress: Math.min(1, elapsed / r.duration) } }, elapsed));
    take.current = null; setRecording(false); seek(r.start + elapsed);
  };
  const startRecording = () => {
    const id = uid(), snapshot = snapshotRef.current, start = current.current;
    take.current = { id, start, wall: performance.now(), last: 0, duration: snapshot.duration };
    setProject((p) => addScene(p, { ...snapshot, camera: { ...snapshot.camera, progress: 0 } }, start, 0.1, id));
    setRunning(false); setRecording(true);
  };
  useEffect(() => {
    let raf, last = performance.now(), paint = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const r = take.current;
      if (r) {
        const elapsed = (now - r.wall) / 1000; current.current = r.start + elapsed;
        if (now - r.last >= 100) {
          r.last = now; const snapshot = snapshotRef.current;
          setProject((p) => recordSample(p, r.id, { ...snapshot, camera: { ...snapshot.camera, progress: Math.min(1, elapsed / r.duration) } }, elapsed));
        }
      } else if (playing.current) {
        const end = endTime(projectRef.current); current.current = Math.min(end, current.current + dt);
        if (current.current >= end) { playing.current = false; setRunning(false); }
      }
      if ((r || playing.current || current.current === endTime(projectRef.current)) && now - paint > 32) { paint = now; setTime(current.current); }
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  return { time, seek, running, setRunning, recording, startRecording, stopRecording, take };
}