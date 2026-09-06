import { stateAt, loadImage } from './kinezmaEngine';

// Kinezma MP4 export — renders the scene deterministically onto a canvas and
// records it in real time. MP4 only, per Kinezma's contract.

const pickMime = () => {
  const mimes = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4'
  ];
  return mimes.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
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
  const size = c.fontSize || Math.round(c.h * 0.8);
  const family = /serif|mono/i.test(c.fontFamily || '') ? c.fontFamily : 'sans-serif';
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

export async function exportKinezmaMp4({ scene, cutouts, motion, onProgress }) {
  const mime = pickMime();
  if (!mime) throw new Error('This browser cannot record MP4 — try Chrome, Edge or Safari.');

  const canvas = document.createElement('canvas');
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext('2d');

  const imgs = {};
  await Promise.all(
    Object.entries(cutouts || {}).map(async ([id, url]) => {
      imgs[id] = await loadImage(url);
    })
  );

  const comps = [...scene.components].sort((a, b) => (a.z || 0) - (b.z || 0));
  const drawFrame = (time) => {
    const state = motion ? stateAt(motion.tracks, time) : {};
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
  };

  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: 'video/mp4' })); });
  rec.start(100);

  const dur = motion?.duration || 4;
  const start = performance.now();
  await new Promise((resolve) => {
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= dur) { drawFrame(dur); resolve(); return; }
      drawFrame(t);
      onProgress?.(t / dur);
      requestAnimationFrame(loop);
    };
    loop();
  });
  rec.stop();
  stream.getTracks().forEach((t) => t.stop());
  const blob = await done;
  onProgress?.(1);
  return blob;
}