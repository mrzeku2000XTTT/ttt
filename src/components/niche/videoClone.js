// videoClone.js — 1:1 video clone pipeline for the NICHE auto-pilot.
// Ingests a video file, transcribes its audio, samples keyframes, and asks a
// vision LLM to reproduce the exact scene-by-scene structure. Returns the same
// "video plan" shape the normal NICHE director produces, so the existing
// image-gen + stitch flow takes over unchanged. Resilient by design: a failed
// seek/upload just skips that frame; a failed transcript falls back to frames.

import { base44 } from '@/api/base44Client';

const FRAME_COUNT = 8;

// Sample N evenly-spaced frames from a local video File and upload each as an
// image. Uses a blob URL (same-origin) so the canvas is not tainted. Per-frame
// try/catch so one bad seek never kills the whole clone.
async function extractKeyframes(file, onProgress) {
  const url = URL.createObjectURL(file);
  const frames = [];
  try {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    await new Promise((res, rej) => {
      v.onloadedmetadata = () => res();
      v.onerror = () => rej(new Error('Could not read the video file'));
      v.src = url;
    });
    const duration = Math.max(0.1, v.duration || 0);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t = Math.min(duration * ((i + 0.5) / FRAME_COUNT), duration - 0.05);
      try {
        await new Promise((resolve, reject) => {
          const onSeeked = () => {
            v.removeEventListener('seeked', onSeeked);
            v.removeEventListener('error', onErr);
            try {
              const vw = v.videoWidth || 640;
              const vh = v.videoHeight || 360;
              const scale = Math.min(1, 640 / vw);
              canvas.width = Math.max(1, Math.round(vw * scale));
              canvas.height = Math.max(1, Math.round(vh * scale));
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/jpeg', 0.82);
            } catch (e) { reject(e); }
          };
          const onErr = () => {
            v.removeEventListener('seeked', onSeeked);
            v.removeEventListener('error', onErr);
            reject(new Error('seek failed'));
          };
          v.addEventListener('seeked', onSeeked);
          v.addEventListener('error', onErr);
          try { v.currentTime = t; } catch (e) { reject(e); }
        }).then(async (blob) => {
          const up = await base44.integrations.Core.UploadFile({
            file: new File([blob], `frame-${i}.jpg`, { type: 'image/jpeg' }),
          });
          if (up?.file_url) frames.push(up.file_url);
        }).catch(() => {});
      } catch {}
      if (onProgress) try { onProgress(i + 1, FRAME_COUNT); } catch {}
    }
  } finally {
    URL.revokeObjectURL(url);
  }
  return frames;
}

// Transcribe the video's audio. TranscribeAudio accepts mp4/mov/etc. Best-effort.
async function transcribeVideo(videoUrl) {
  if (!videoUrl) return '';
  try {
    const r = await base44.integrations.Core.TranscribeAudio({ audio_url: videoUrl });
    return typeof r === 'string' ? r : r?.text || r?.transcript || '';
  } catch {
    return '';
  }
}

// Build a 1:1 clone plan from the source video: transcript + keyframes → scene
// script. Returns { res, transcript } where res is the same shape the normal
// NICHE director returns ({ kind, reply, video }).
export async function buildClonePlan({ file, videoUrl, setWork }) {
  setWork('Transcribing the video you sent');
  const transcript = await transcribeVideo(videoUrl);

  setWork('Sampling keyframes from the video');
  const frames = await extractKeyframes(file, (done, total) => setWork(`Sampling keyframes · ${done}/${total}`));

  if (!transcript && !frames.length) {
    throw new Error("I couldn't read that video — try a different file (mp4 works best).");
  }

  setWork('Reading every scene in the video');
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the NICHE Studio clone engine. The user sent a video and wants a 1:1 clone — reproduce the EXACT video's content, scene order, on-screen captions, and spoken lines as an animated explainer.

${frames.length ? `Here are ${frames.length} keyframes from the video, in chronological order (file_urls). Study them carefully.` : 'No keyframes were available.'}
${transcript ? `The full transcript of its audio:\n"""${transcript.slice(0, 4000)}"""` : 'No audio transcript was available — derive the scenes from the keyframes only.'}

Clone it scene by scene:
- One scene per distinct visual moment in the source (match the source's own pacing — aim for 6–12 scenes).
- "caption" = the on-screen text shown in that moment of the source (if any), max 8 words.
- "voiceover" = the spoken line(s) from the transcript that belong to that moment (2–4 sentences, verbatim or near-verbatim from the transcript). If no transcript, describe the action as narration.
- "action" = describes ONLY what is seen in that frame (the visual action), never commands/URLs/code.
- "style" = the animation style id that best matches that scene's visual look: cel, digital-2d, cgi-3d, anime, claymation, cutout, motion-graphics, rotoscope, rubber-hose, hybrid-2d, vox, real-ui, comic, papercut, isometric, chalkboard, neutral. Use real-ui + the "app" field if the frame shows a real app UI.
- "camera" = a camera move for that scene (zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down, static).
- "title" = the source video's title (or a faithful one), under 60 chars.
- "description" = 2 short YouTube paragraphs. "tags" = 8–10 SEO tags.
- "color_mode" = "color" or "mono" (match the source).

Return kind "video" with the full scene script. 1:1 fidelity to the source — do not invent content, do not pivot away from what the video actually shows.`,
    file_urls: frames.length ? frames : undefined,
    add_context_from_internet: false,
    response_json_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['video'] },
        reply: { type: 'string' },
        video: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            scene_count: { type: 'number' },
            color_mode: { type: 'string', enum: ['mono', 'color'] },
            app: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  style: { type: 'string' },
                  app: { type: 'string' },
                  caption: { type: 'string' },
                  voiceover: { type: 'string' },
                  camera: { type: 'string', enum: ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'static'] },
                },
              },
            },
          },
        },
      },
    },
  });

  return { res, transcript };
}

// Frame-faithful 1:1 clone: re-renders the source video frame-by-frame to a
// canvas and captures it via MediaRecorder. The output matches the source's
// exact visuals, length, UI and color — no generated images, no TTS, no
// invented content. MP4 when the browser supports it, WebM fallback.
export async function cloneVideoToFile({ file, onProgress }) {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    await new Promise((res, rej) => {
      v.onloadedmetadata = () => res();
      v.onerror = () => rej(new Error('Could not read the video file'));
      v.src = url;
    });
    if (v.readyState < 2) {
      await new Promise((res, { reject } = {}) => {
        v.oncanplay = () => res();
        setTimeout(() => res(), 3000);
      });
    }
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 360;
    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(30);
    const mimeType =
      [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm',
      ].find((t) => MediaRecorder.isTypeSupported(t)) || 'video/mp4';
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: mimeType })); });
    rec.start();
    try { ctx.drawImage(v, 0, 0, vw, vh); } catch {}
    await v.play();
    const duration = v.duration || 0;
    const start = performance.now();
    await new Promise((resolve) => {
      let done = false;
      const finish = () => { done = true; resolve(); };
      const tick = () => {
        if (done) return;
        if (v.ended) { finish(); return; }
        try { ctx.drawImage(v, 0, 0, vw, vh); } catch {}
        if (onProgress && duration) {
          try { onProgress(Math.min(1, (performance.now() - start) / 1000 / duration)); } catch {}
        }
        requestAnimationFrame(tick);
      };
      tick();
      v.onended = finish;
    });
    try { ctx.drawImage(v, 0, 0, vw, vh); } catch {}
    await new Promise((r) => setTimeout(r, 120));
    rec.stop();
    return await stopped;
  } finally {
    URL.revokeObjectURL(url);
  }
}