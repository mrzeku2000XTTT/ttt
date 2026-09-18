import { base44 } from '@/api/base44Client';
import { compileExplainerVideo, videoExt } from './explainerVideo';


// Shared render pipeline for the auto-pilot's standard build AND its
// refresh-resume: generates only the scenes whose image/narration is still
// missing (already-done ones come in prefilled), then stitches the MP4.
// onAsset(type, index, url) fires as each piece lands so the caller can
// checkpoint it. Returns null if the build was cancelled/paused.
export const runRenderPipeline = async ({
  scenes, scenePrompts, attachmentUrls = [], captionMode = 'summary',
  motionFx = false, musicUrl = '', styleId, audioContext, token, setWork,
  images = [], audios = [], onAsset
}) => {
  const n = scenes.length;
  const concurrency = 3;
  let done = images.filter(Boolean).length + audios.filter(Boolean).length;
  const total = n * 2;
  const step = () => setWork(`Drawing & narrating · ${Math.min(++done, total)}/${total}`);
  setWork(`Drawing & narrating · ${Math.min(done, total)}/${total}`);
  const withRetry = async (fn) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (token.cancelled) return null;
      try { return await fn(); } catch (e) { if (attempt === 2) return null; await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); }
    }
  };
  const mapBatch = async (items, concurrency, fn) => {
    const out = new Array(items.length).fill(null);
    let idx = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (idx < items.length && !token.cancelled) { const i = idx++; if (i < items.length) out[i] = await fn(items[i], i); }
    }));
    return out;
  };
  const [outImages, outAudios] = await Promise.all([
    mapBatch(scenes, concurrency, (s, i) =>
      images[i]
        ? images[i]
        : withRetry(() => base44.integrations.Core.GenerateImage({
            prompt: scenePrompts[i],
            ...(attachmentUrls.length ? { existing_image_urls: attachmentUrls } : {})
          })).then((r) => { step(); const url = r?.url || null; onAsset?.('image', i, url); return url; })
    ),
    mapBatch(scenes, concurrency, (s, i) =>
      audios[i]
        ? audios[i]
        : withRetry(() => base44.integrations.Core.GenerateSpeech({ text: s.voiceover, voice: 'storm' }))
            .then((r) => { step(); const url = r?.url || null; onAsset?.('audio', i, url); return url; })
    )
  ]);
  if (token.cancelled) { try { audioContext.close(); } catch {} return null; }
  const kept = scenes.map((s, i) => ({ s, img: outImages[i], aud: outAudios[i] })).filter((x) => x.img && x.aud);
  if (!kept.length) throw new Error('Every scene failed to generate — try again in a moment.');
  const finalScenes = kept.map((x) => x.s);
  setWork(motionFx ? 'Animating scenes with Motion FX' : 'Stitching your video');
  const blob = await compileExplainerVideo({
    images: kept.map((x) => x.img),
    audios: kept.map((x) => x.aud),
    captions: finalScenes.map((s) => (captionMode === 'tts' ? (s.voiceover || s.caption || '') : (s.caption || String(s.voiceover || '').split(' ').slice(0, 8).join(' ')))),
    style: styleId,
    cameras: finalScenes.map((s) => s.camera),
    musicUrl: musicUrl || '',
    onProgress: setWork,
    audioContext,
    motion: motionFx,
    token
  });
  if (token.cancelled) return null;
  return { blob, finalScenes, dropped: n - kept.length, images: outImages, audios: outAudios };
};

// Save must finish successfully before the build checkpoint is cleared or the
// chat claims the video is in the Library.
export const saveVideoToLibrary = async ({ blob, title, description, tags, styleName, scenes, factNote }) => {
  const me = await base44.auth.me();
  if (!me?.email) throw new Error('Sign in before saving the finished video.');
  const up = await base44.integrations.Core.UploadFile({
    file: new File([blob], `${(title || 'niche-explainer').replace(/[^a-z0-9]+/gi, '-')}.${videoExt(blob.type)}`, { type: blob.type })
  });
  await base44.entities.NicheVideo.create({
    user_email: me.email,
    title,
    description: description || '',
    tags: tags || [],
    style_name: styleName || 'Neutral',
    video_url: up.file_url,
    scenes: (scenes || []).map((s) => ({ action: s.action, caption: s.caption, voiceover: s.voiceover })),
    fact_note: factNote || ''
  });
  return up.file_url;
};