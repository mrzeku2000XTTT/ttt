import renderCamScene from '@/components/cam/camSceneRender';
import { camHasTimeline, camSceneAt } from '@/components/cam/camSceneAt';
import { endTime } from '@/components/cam/camTimelineModel';
import { downloadCameraBlob } from '@/components/camerastudio/cameraStudioExport';

// Real-time canvas export of the composed 2D timeline — same MediaRecorder
// pipeline Camera Studio uses, so what you preview is exactly what lands in the MP4.
export async function exportCamVideo({ canvas, project, snapshot, media, onProgress }) {
  if (typeof MediaRecorder === 'undefined' || !canvas?.captureStream) throw new Error('Video export is not supported in this browser. Try Chrome or Edge.');
  const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mime) throw new Error('No supported video encoder. Try Chrome or Edge.');
  const hasTimeline = camHasTimeline(project);
  const duration = Math.max(0.5, hasTimeline ? endTime(project) : (snapshot.duration || 4));
  const drawFrame = (t) => {
    const scene = hasTimeline ? camSceneAt(project, snapshot, t) : { ...snapshot, progress: Math.min(1, t / duration) };
    renderCamScene(canvas, scene, media, 1);
  };
  let stream, recorder, frame, rejectRun;
  const abort = () => { if (document.hidden) rejectRun?.(new Error('Export interrupted: keep this tab visible and try again.')); };
  try {
    drawFrame(0);
    stream = canvas.captureStream(60);
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    const chunks = [];
    const result = new Promise((resolve, reject) => {
      rejectRun = reject;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('Video encoding failed. Try a shorter composition.'));
      recorder.onstop = () => chunks.length ? resolve(new Blob(chunks, { type: recorder.mimeType })) : reject(new Error('No video frames were captured.'));
    });
    document.addEventListener('visibilitychange', abort);
    recorder.start();
    const start = performance.now();
    const tick = (now) => {
      const elapsed = (now - start) / 1000;
      drawFrame(Math.min(elapsed, duration));
      onProgress?.(Math.min(1, elapsed / duration));
      if (elapsed >= duration) { recorder.stop(); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const blob = await result;
    downloadCameraBlob(blob, `cam-export.${mime.startsWith('video/mp4') ? 'mp4' : 'webm'}`);
    return blob;
  } finally {
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', abort);
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
  }
}