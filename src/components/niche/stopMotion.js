// SM — Stop Motion engine for NICHE Studio.
// Every scripted scene is broken into physical stop-motion poses, each pose is
// "exposed" as a tangible AI frame (chained so the set, puppets and palette
// stay identical between exposures), and the whole sequence is compiled into
// a 60fps exportable MP4 with hard pose cuts and a subtle handmade "boil".
import { base44 } from '@/api/base44Client';
import { createAudioContext } from './explainerVideo';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const REC_MIMES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm'
];

export const POSES_PER_SCENE = 5;

const MATERIALS = (colorMode) =>
  colorMode === 'mono'
    ? 'strictly black-and-white materials: white and gray clay, charcoal felt, black-and-white paper cutouts — zero color anywhere'
    : 'warm tactile materials: colored clay, felt, fabric, paper cutouts, miniature props';

const wrapCaption = (text, per = 8, maxLines = 2) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  for (let i = 0; i < words.length && lines.length < maxLines; i += per) {
    lines.push(words.slice(i, i + per).join(' '));
  }
  return lines;
};

// First exposure of a scene — a photographed handcrafted miniature set.
export function stopMotionFramePrompt(pose, colorMode) {
  return `Authentic stop-motion film still — a single photographed exposure of a handcrafted miniature set. Scene: ${pose}. ${MATERIALS(colorMode)}. Visible fingerprints and tool marks in the clay, seams and felt fuzz on the puppets, practical set lighting with soft shadows and one warm key lamp, macro-lens shallow depth of field on a physical tabletop set, subtle film grain — it must read as a REAL stop-motion exposure (Laika/Aardman style), never a digital illustration, never a 3D render. No text, no letters, no logos, no captions.`;
}

// Every following exposure — the SAME set, only the puppets nudged forward.
export function nextPoseFramePrompt(pose, colorMode) {
  return `The reference images are earlier exposures of the SAME stop-motion set. Produce the NEXT exposure after the animator repositioned the puppets for this beat: ${pose}. Keep the set, puppets, camera angle, materials, lighting and palette EXACTLY identical to the references — same characters, same proportions, same colors (${colorMode === 'mono' ? 'strictly black-and-white' : 'same palette'}). Only the subjects move one tiny incremental step, exactly like a stop-motion animator nudging a clay puppet between exposures. ${MATERIALS(colorMode)}. No text, no letters, no logos.`;
}

// Ask the director-LLM to break a scene into incremental stop-motion poses.
export function posePlanPrompt(scene, count, colorMode) {
  return `You are a veteran stop-motion director planning a shot. Break the scene into EXACTLY ${count} sequential stop-motion poses — the incremental repositionings an animator would make between camera exposures.

Scene action: """${scene.action}"""

Rules:
- Each pose describes ONLY the visual arrangement of the physical set: where each puppet/prop stands and what has moved since the previous pose.
- The SAME set, characters and props persist across all poses — nothing appears or vanishes mid-shot (unless the action explicitly requires a prop entering).
- Movements are small and incremental (an arm a few degrees higher, a head slightly turned, one small step forward) — the whole sequence reads as one continuous physical motion.
- No text, no captions, no camera commands in the poses.
- ${colorMode === 'mono' ? 'The materials are strictly black-and-white (clay, felt, paper).' : 'The materials are warm tactile craft materials (colored clay, felt, paper).'}

Return JSON: { "poses": [ "pose 1 ...", "pose 2 ...", ... ] } with exactly ${count} entries.`;
}

// Expose one scene: frame 1 from the pose + materials, then each next frame
// chained on the previous exposures so the set never drifts.
export async function generateStopMotionFrames({ scene, poses, colorMode, attachmentUrls = [], onProgress }) {
  const list = poses && poses.length >= 2 ? poses : Array.from({ length: POSES_PER_SCENE }, (_, i) => `${scene.action} — incremental stop-motion pose ${i + 1} of ${POSES_PER_SCENE}`);
  const frames = [];
  let first = null;
  for (let i = 0; i < list.length; i++) {
    onProgress?.(`Exposing stop-motion frames · ${i + 1}/${list.length}`);
    const prompt = i === 0 ? stopMotionFramePrompt(list[i], colorMode) : nextPoseFramePrompt(list[i], colorMode);
    const refs = i === 0 ? (attachmentUrls.length ? attachmentUrls : undefined) : [first, frames[frames.length - 1]].filter(Boolean);
    let url = null;
    for (let attempt = 0; attempt < 2 && !url; attempt++) {
      try {
        const r = await base44.integrations.Core.GenerateImage({ prompt, ...(refs ? { existing_image_urls: refs } : {}) });
        url = r?.url || null;
      } catch {}
      if (!url) await new Promise((r) => setTimeout(r, 700));
    }
    if (!url) break; // keep the exposures we have — a shorter honest beat beats a broken one
    if (i === 0) first = url;
    frames.push(url);
  }
  return frames;
}

// Compile the exposed frames into one 60fps exportable MP4 — each scene's
// poses step forward in hard cuts (authentic stop motion), with a subtle 12Hz
// "frame boil" jitter that sells the handmade puppetry inside the 60fps stream.
export async function compileStopMotionVideo({ framesPerScene, audios, captions = [], colorMode = 'mono', onProgress, audioContext }) {
  const W = 1280;
  const H = 720;
  const bg = colorMode === 'color' ? '#0b0b0e' : '#050507';
  const ink = '#f5f5f7';
  const FPS = 60;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  onProgress?.('Loading exposures…');
  const sceneImgs = await Promise.all(
    framesPerScene.map((poses) => Promise.all(poses.map(loadImage)))
  );

  onProgress?.('Preparing narration…');
  const ac = audioContext || createAudioContext();
  await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  if (ac.state !== 'running') {
    throw new Error('Audio could not start on this device — tap the screen once, then try again.');
  }
  const dest = ac.createMediaStreamDestination();
  const buffers = await Promise.all(
    audios.map(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      return new Promise((resolve, reject) => ac.decodeAudioData(buf, resolve, reject));
    })
  );

  onProgress?.('Laying out the timeline…');
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const LEAD = 0.25;
  const GAP = 0.45;
  const MIN_SCENE = 3.5; // never let a rushed line shrink a scene's hold time
  const timeline = [];
  let cursor = LEAD;
  buffers.forEach((buf, i) => {
    const hold = Math.max(buf.duration, MIN_SCENE);
    timeline.push({ at: cursor, dur: hold, buf, imgs: sceneImgs[i], caption: captions[i] || '' });
    cursor += hold + GAP;
  });
  const totalDur = cursor + 0.4;
  const offline = new OfflineCtx(2, Math.ceil(totalDur * ac.sampleRate), ac.sampleRate);
  timeline.forEach((seg) => {
    const s = offline.createBufferSource();
    s.buffer = seg.buf;
    s.connect(offline.destination);
    s.start(seg.at);
  });
  const mixed = await offline.startRendering();

  const segments = timeline.map((seg, i) => ({
    start: i === 0 ? 0 : seg.at,
    end: i === timeline.length - 1 ? totalDur : seg.at + seg.dur + GAP,
    imgs: seg.imgs,
    caption: seg.caption
  }));

  const stream = canvas.captureStream(FPS);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  const mimeType = REC_MIMES.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/mp4';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((resolve) => {
    recorder.onstop = resolve;
  });

  const drawH = H - 100;
  const drawPose = (img, caption, elapsed) => {
    ctx.save();
    // stop-motion "boil" — a 1-2px handmade jitter flipping at 12Hz inside the 60fps export
    const boil = (Math.floor(elapsed * 12) % 2 === 0 ? 1 : -1) * 1.4;
    const scale = Math.max(W / img.width, drawH / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2 + boil, (drawH - dh) / 2 - boil, dw, dh);
    ctx.font = 'bold 34px "Nunito", sans-serif';
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    wrapCaption(caption).forEach((line, li) => {
      ctx.fillText(line, W / 2, H - 56 + li * 42);
    });
    ctx.restore();
  };

  const clear = () => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  };

  clear();
  drawPose(segments[0].imgs[0], segments[0].caption, 0);

  onProgress?.('Compiling your 60fps stop-motion film…');
  const player = ac.createBufferSource();
  player.buffer = mixed;
  player.connect(dest);
  // silent monitor keeps the graph live on iOS (recorded file needs its audio)
  const monitor = ac.createGain();
  monitor.gain.value = 0;
  player.connect(monitor);
  monitor.connect(ac.destination);

  const t0 = ac.currentTime + 0.1;
  player.start(t0);
  recorder.start(250);

  const wallStart = Date.now();
  const guardMs = (totalDur + 12) * 1000;
  await new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        clearInterval(timer);
        resolve();
      }
    };
    player.onended = done;
    const tick = () => {
      const elapsed = ac.currentTime - t0;
      let idx = segments.findIndex((s) => elapsed >= s.start && elapsed < s.end);
      if (idx === -1) idx = elapsed >= totalDur ? segments.length - 1 : 0;
      const seg = segments[idx];
      const segDur = Math.max(0.001, seg.end - seg.start);
      const nPoses = seg.imgs.length;
      const p = Math.min(1, Math.max(0, (elapsed - seg.start) / segDur));
      // hard cut to the pose that owns this moment — no crossfades in stop motion
      const pose = seg.imgs[Math.min(nPoses - 1, Math.floor(p * nPoses))];
      clear();
      drawPose(pose, seg.caption, elapsed);
      if (elapsed >= totalDur || Date.now() - wallStart > guardMs) done();
    };
    const timer = setInterval(tick, Math.round(1000 / FPS));
    tick();
  });

  await new Promise((r) => setTimeout(r, 400));
  recorder.stop();
  await stopped;
  await ac.close();
  return new Blob(chunks, { type: mimeType.split(';')[0] });
}