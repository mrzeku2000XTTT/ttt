import { seekCameraVideo } from '@/components/camerastudio/cameraStudioMedia';
export function downloadCameraBlob(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function exportCameraPhoto(engine, settings, name, assets = []) {
  engine.exporting = true;
  try {
    engine.medias.forEach(media => media.video && media.element.pause());
    engine.draw(settings, 0, false, [], assets);
    const blob = await new Promise(resolve => engine.canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Photo export failed. Please try again.');
    downloadCameraBlob(blob, `${name || 'camera-studio'}.png`);
  } finally { engine.exporting = false; }
}
export async function exportCameraVideo(engine, settings, name, progress, interestPoints = [], assets = [], cameraKeyframes = []) {
  if (typeof MediaRecorder === 'undefined' || !engine.canvas.captureStream) throw new Error('Video export is not supported in this browser. Try Chrome or Edge, or export a photo.');
  const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
  if (!mime) throw new Error('No supported video encoder. Try Chrome or Edge.');
  const videos = engine.medias.filter(media => media.video), oldTimes = videos.map(media => media.element.currentTime);
  let stream, recorder, frame, rejectRun;
  engine.exporting = true;
  const abort = () => { if (document.hidden) rejectRun?.(new Error('Export interrupted: keep this tab visible and try again.')); };
  try {
    await Promise.all(videos.map(async media => { media.element.pause(); await seekCameraVideo(media.element, 0); await media.element.play(); }));
    engine.draw(settings, 0, true, interestPoints, assets, cameraKeyframes); stream = engine.canvas.captureStream(60);
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    const chunks = [];
    const result = new Promise((resolve, reject) => {
      rejectRun = reject;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('Video encoding failed. Try a shorter duration.'));
      recorder.onstop = () => chunks.length ? resolve(new Blob(chunks, { type: recorder.mimeType })) : reject(new Error('No video frames were captured.'));
    });
    document.addEventListener('visibilitychange', abort);
    recorder.start(); const start = performance.now();
    const tick = now => {
      if (engine.disposed) { rejectRun(new Error('Export stopped because the editor was closed.')); return; }
      const elapsed = (now - start) / 1000;
      engine.draw(settings, Math.min(elapsed, settings.duration), true, interestPoints, assets, cameraKeyframes); progress(Math.min(1, elapsed / settings.duration));
      if (elapsed >= settings.duration) { recorder.stop(); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const blob = await result;
    downloadCameraBlob(blob, `${name || 'camera-studio'}.${mime.startsWith('video/mp4') ? 'mp4' : 'webm'}`);
  } finally {
    cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', abort);
    if (recorder?.state === 'recording') recorder.stop(); stream?.getTracks().forEach(track => track.stop());
    engine.exporting = false;
    if (!engine.disposed) await Promise.all(videos.map(async (media, index) => { media.element.pause(); await seekCameraVideo(media.element, oldTimes[index]); }));
  }
}