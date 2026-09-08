import { stateAt, loadImage, fitFontSize } from './kinezmaEngine';

// Kinezma MP4 export — renders the scene deterministically at 4K and pushes
// frames one by one into the recorder, so every frame is captured exactly once
// (no drops when the encoder is slow, no dependence on the tab staying lively).

// 4K needs High-profile H.264 — Baseline (42E01E) tops out at 720p by spec and
// produces broken output when asked for 3840px.
const pickMime = () => {
  const mimes = [
    'video/mp4;codecs=avc1.640033',
    'video/mp4;codecs=avc1.640028',
    'video/mp4;codecs=avc1.4D401F',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  return mimes.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
};

const roundRect = (ctx, x, y, w, h, r) => {
  const rr = Math.min(r || 0, w / 2, h / 2);
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); return; }
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const drawText = (ctx, c) => {
  ctx.fillStyle = c.color || '#000';
  const size = fitFontSize(c);
  const family = c.fontFamily || 'sans-serif';
  ctx.font = `${Number(c.fontWeight) || 700} ${size}px ${family}`;
  ctx.textBaseline = 'middle';
  const left = c.align === 'left';
  ctx.textAlign = left ? 'left' : 'center';
  if (c.bg) {
    ctx.save();
    ctx.fillStyle = c.bg;
    roundRect(ctx, 0, 0, c.w, c.h, c.radius || 0);
    ctx.fill();
    ctx.restore();
  }
  const words = String(c.text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const wd of words) {
    const test = line ? `${line} ${wd}` : wd;
    if (ctx.measureText(test).width > c.w && line) { lines.push(line); line = wd; }
    else line = test;
  }
  if (line) lines.push(line);
  const lh = size * 1.15;
  let y = c.h / 2 - ((lines.length - 1) * lh) / 2;
  for (const ln of lines) {
    ctx.fillText(ln, left ? 0 : c.w / 2, y);
    y += lh;
  }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function exportKinezmaMp4({ scene, cutouts, motion, onProgress }) {
  if (!window.MediaRecorder) throw new Error('This browser cannot record video — try Chrome, Edge or Safari.');

  // 4K export: render at 3840px wide (proportional height), scene coords scaled up
  const OUT_W = 3840;
  const k = OUT_W / scene.width;
  const canvas = document.createElement('canvas');
  canvas.width = OUT_W;
  canvas.height = Math.round(scene.height * k);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const imgs = {};
  await Promise.all(
    Object.entries(cutouts || {}).map(async ([id, url]) => {
      imgs[id] = await loadImage(url);
    })
  );

  const comps = [...scene.components].sort((a, b) => (a.z || 0) - (b.z || 0));
  const drawFrame = (time) => {
    const state = motion ? stateAt(motion.tracks, time) : {};
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = scene.background || '#fff';
    ctx.fillRect(0, 0, scene.width, scene.height);
    for (const c of comps) {
      const st = state[c.id] || { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
      ctx.save();
      ctx.translate(c.x + c.w / 2 + st.x, c.y + c.h / 2 + st.y);
      if (st.rotate) ctx.rotate((st.rotate * Math.PI) / 180);
      if (st.scale !== 1) ctx.scale(st.scale, st.scale);
      ctx.globalAlpha = Math.max(0, Math.min(1, st.opacity));
      ctx.translate(-c.w / 2, -c.h / 2);
      if (c.kind === 'cutout' && imgs[c.id]) {
        ctx.drawImage(imgs[c.id], 0, 0, c.w, c.h);
      } else if (c.kind === 'box') {
        ctx.fillStyle = c.bg || '#000';
        roundRect(ctx, 0, 0, c.w, c.h, c.radius || 0);
        ctx.fill();
      } else {
        drawText(ctx, c);
      }
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const dur = motion?.duration || 4;
  const FPS = 30;
  const frameMs = 1000 / FPS;
  const mime = pickMime();

  // Preferred path: manual frame push (captureStream(0) + requestFrame) —
  // every drawn frame is captured exactly once.
  const probeStream = canvas.captureStream(0);
  const canPush = typeof probeStream.getVideoTracks()[0]?.requestFrame === 'function';
  const stream = canPush ? probeStream : canvas.captureStream(FPS);
  const track = stream.getVideoTracks()[0];

  const rec = new MediaRecorder(
    stream,
    mime ? { mimeType: mime, videoBitsPerSecond: 20_000_000 } : undefined
  );
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });

  drawFrame(0);
  if (canPush) track.requestFrame();
  rec.start();

  if (canPush) {
    // deterministic frame-by-frame: draw → push → pace to the exact 30fps slot
    const totalFrames = Math.max(1, Math.round(dur * FPS));
    const t0 = performance.now();
    for (let f = 1; f <= totalFrames; f++) {
      drawFrame(f / FPS);
      track.requestFrame();
      onProgress?.(f / totalFrames);
      const target = t0 + f * frameMs;
      while (performance.now() < target) {
        await wait(Math.min(8, target - performance.now()));
      }
    }
    // hold the last frame so the encoder flushes the tail cleanly
    await wait(250);
  } else {
    // fallback: realtime capture
    const start = performance.now();
    await new Promise((resolve) => {
      const loop = () => {
        const t = (performance.now() - start) / 1000;
        if (t >= dur) { drawFrame(dur); resolve(); return; }
        drawFrame(t);
        onProgress?.(t / dur);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }

  rec.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  onProgress?.(1);
  const type = rec.mimeType || mime || 'video/webm';
  return new Blob(chunks, { type });
}