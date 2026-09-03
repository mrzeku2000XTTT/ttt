// Stick-man explainer video utilities — shared by the Manual lab and the Automatic chat studio

export const stickPrompt = (action) =>
  `Minimalist hand-drawn stick figure explainer illustration showing: ${action}. One simple black stick-figure character with expressive stick arms and legs mid-action on a clean pure white background, thin marker ink lines, doodle sketch style, generous white space, wide 16:9 composition. STRICTLY NO TEXT: no words, no letters, no numbers, no labels, no captions, no signs, no writing of any kind anywhere in the image.`;

const CAPTION_MAX = 42;

const wrapCaption = (text) => {
  const words = String(text || '').split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > CAPTION_MAX) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 2);
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Stitches scene images + narration audio into one downloadable webm video,
// drawing each scene's clean caption at the bottom in the doodle style.
export async function compileExplainerVideo({ images, audios, captions = [], onProgress }) {
  const W = 1280;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  onProgress?.('Loading scenes…');
  const imgEls = await Promise.all(images.map(loadImage));

  onProgress?.('Preparing narration…');
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ac = new AudioCtx();
  const dest = ac.createMediaStreamDestination();
  const buffers = await Promise.all(
    audios.map(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      return ac.decodeAudioData(buf);
    })
  );

  const stream = canvas.captureStream(25);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });
  recorder.start(250);

  // Schedule narration back-to-back; remember the window for each scene
  const segments = [];
  let t = ac.currentTime + 0.15;
  buffers.forEach((buf, i) => {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(dest);
    src.start(t);
    segments.push({ start: t, end: t + buf.duration, img: imgEls[i], caption: captions[i] || '' });
    t += buf.duration;
  });

  const drawFrame = (seg) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const { img } = seg;
    const r = Math.min(W / img.width, (H - 100) / img.height);
    const dw = img.width * r;
    const dh = img.height * r;
    ctx.drawImage(img, (W - dw) / 2, (H - 100 - dh) / 2, dw, dh);
    const lines = wrapCaption(seg.caption);
    ctx.font = 'bold 34px "Nunito", sans-serif';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    lines.forEach((line, li) => {
      ctx.fillText(line, W / 2, H - 56 + li * 42);
    });
  };

  onProgress?.('Stitching your video…');
  await new Promise((resolve) => {
    const tick = () => {
      const now = ac.currentTime;
      const seg = segments.find((s) => now >= s.start && now < s.end) || segments[segments.length - 1];
      if (seg) drawFrame(seg);
      if (now >= t + 0.3) return resolve();
      requestAnimationFrame(tick);
    };
    tick();
  });

  recorder.stop();
  await stopped;
  await ac.close();
  return new Blob(chunks, { type: 'video/webm' });
}