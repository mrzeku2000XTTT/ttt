// Framez export — deterministic frame capture of the coded film (html2canvas)
// followed by a realtime MediaRecorder playback pass. Keep this tab active
// while exporting (same browser-recording constraint as the Niche stitcher).
import html2canvas from 'html2canvas';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

export async function exportFilm(iframe, onProgress) {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  const fps = 15;
  win.FzPause();
  const total = win.FzTotal;
  const stage = doc.getElementById('stage');
  const W = stage.offsetWidth;
  const H = stage.offsetHeight;
  const n = Math.max(1, Math.round(total * fps));

  // Phase 1 — capture every frame deterministically
  const frames = [];
  for (let f = 0; f < n; f++) {
    win.FzRender(f / fps);
    await nextFrame();
    const canvas = await html2canvas(doc.body, {
      width: W, height: H, scale: 1, backgroundColor: null, logging: false
    });
    frames.push(canvas.toDataURL('image/jpeg', 0.85));
    onProgress?.('capture', f / n);
    if (f % 3 === 0) await nextFrame();
  }
  win.FzReplay();

  // Phase 2 — preload, then record a realtime playback pass
  const imgs = await Promise.all(frames.map((src) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  })));
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d');
  octx.fillStyle = '#000';
  octx.fillRect(0, 0, W, H);
  const stream = out.captureStream(fps);
  const mime = window.MediaRecorder?.isTypeSupported?.('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : 'video/webm;codecs=vp9';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start();
  const t0 = performance.now();
  const durMs = (n / fps) * 1000;
  await new Promise((resolve) => {
    const draw = (now) => {
      const idx = Math.min(n - 1, Math.floor(((now - t0) / 1000) * fps));
      octx.drawImage(imgs[idx], 0, 0);
      onProgress?.('record', Math.min(1, (now - t0) / durMs));
      if (now - t0 >= durMs) resolve();
      else requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
  await new Promise((r) => setTimeout(r, 300));
  rec.stop();
  await stopped;
  return { blob: new Blob(chunks, { type: mime }), ext: mime.includes('mp4') ? 'mp4' : 'webm' };
}