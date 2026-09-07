import { drawFrame, W, H } from './messagesCanvas';
import { playSend, playReceive, playTick } from './messagesAudio';

const PLAYERS = { send: playSend, receive: playReceive, tick: playTick };

const pickMime = () => {
  const opts = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm'
  ];
  return opts.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
};

// Real-time capture of the same canvas + synthesized iOS sounds into one MP4.
export async function exportMessagesMp4({ timeline, sounds, onProgress }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(30);

  const actx = new (window.AudioContext || window.webkitAudioContext)();
  const dest = actx.createMediaStreamDestination();
  dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));

  const mime = pickMime();
  const rec = new MediaRecorder(
    stream,
    mime ? { mimeType: mime, videoBitsPerSecond: 12000000, audioBitsPerSecond: 128000 } : undefined
  );
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((res) => { rec.onstop = res; });

  drawFrame(ctx, timeline, 0);
  rec.start(120);

  // sounds and frames share one wall clock so they stay in sync
  const startAt = actx.currentTime + 0.15;
  (sounds || []).forEach((s) => PLAYERS[s.type]?.(actx, dest, startAt + s.t));
  const startWall = performance.now() + 150;

  await new Promise((resolve) => {
    const loop = () => {
      const t = (performance.now() - startWall) / 1000;
      drawFrame(ctx, timeline, Math.min(t, timeline.total));
      onProgress?.(Math.min(1, Math.max(0, t / timeline.total)));
      if (t >= timeline.total + 0.15) resolve();
      else requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  await actx.close();
  const type = mime || 'video/webm';
  return { blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm' };
}