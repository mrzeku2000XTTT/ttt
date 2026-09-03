import React, { useRef, useState } from 'react';
import { X, Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const uid = () => Math.random().toString(36).slice(2);

// Samples up to 8 frames evenly across a video (max 10 minutes)
const extractFrames = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.src = url;
    v.onerror = () => reject(new Error('Could not read that video file.'));
    v.onloadedmetadata = () => {
      const dur = v.duration;
      if (!v.videoWidth) return reject(new Error('That file has no picture track.'));
      if (!dur || dur > 600) return reject(new Error('Please pick a video up to 10 minutes long.'));
      (async () => {
        const frames = [];
        for (let i = 0; i < 8; i++) {
          const t = Math.min(((i + 0.5) / 8) * dur, dur - 0.05);
          await new Promise((res, rej) => {
            v.onseeked = res;
            v.onerror = () => rej(new Error('Could not read that video file.'));
            v.currentTime = t;
          });
          const c = document.createElement('canvas');
          c.width = 640;
          c.height = Math.max(1, Math.round((640 * v.videoHeight) / v.videoWidth));
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          frames.push(await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82)));
        }
        URL.revokeObjectURL(url);
        resolve(frames);
      })().catch(reject);
    };
  });

// Teaches the NICHE AI a visual style from a video (up to 10 min) or images.
// The learned style is saved to the user's account — forever.
export default function NicheStyleLearner({ onClose, onLearned }) {
  const [mode, setMode] = useState('video');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const videoInput = useRef(null);
  const imageInput = useRef(null);

  const study = async (urls, source) => {
    setBusy('Studying the style…');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a master animation stylist. You are watching ${source === 'video' ? 'frames sampled across a full animation video (up to 10 minutes)' : 'reference images'} a creator uploaded. Study the visual style deeply: art medium and rendering technique, linework weight and texture, exact color palette, shading and lighting, character design language, background treatment, framing and composition, overall mood, and how motion and any on-screen text are handled.

Then write:
1. "name" — a short, memorable name for this style (2–4 words)
2. "description" — a rich, precise style prompt (150–250 words) written for an image generator, capturing this exact style so ANY new scene can be recreated in it faithfully. Describe only the look — never mention any specific subject from the frames.`,
        file_urls: urls,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          }
        }
      });

      let style = { id: 'style-' + uid(), name: res.name || 'Learned style', description: res.description || '' };
      try {
        const me = await base44.auth.me();
        if (me?.email) {
          const rec = await base44.entities.NicheStyle.create({
            user_email: me.email,
            name: style.name,
            description: style.description,
            source
          });
          style = { id: rec.id, name: rec.name, description: rec.description };
        }
      } catch {
        // not logged in — the style still works this session, it just isn't saved forever
      }
      onLearned(style);
      onClose();
    } catch (e) {
      setError(e?.message || 'Something went wrong studying that.');
    } finally {
      setBusy('');
    }
  };

  const handleVideo = async (file) => {
    if (!file) return;
    setError('');
    setBusy('Sampling frames…');
    try {
      const frames = await extractFrames(file);
      const urls = [];
      for (let i = 0; i < frames.length; i++) {
        setBusy(`Uploading frame ${i + 1}/${frames.length}…`);
        const up = await base44.integrations.Core.UploadFile({ file: frames[i] });
        urls.push(up.file_url);
      }
      await study(urls, 'video');
    } catch (e) {
      setError(e?.message || 'Could not study that video.');
      setBusy('');
    }
  };

  const handleImages = async (files) => {
    const imgs = [...files].filter((f) => f.type?.startsWith('image/')).slice(0, 4);
    if (!imgs.length) return;
    setError('');
    try {
      const urls = [];
      for (let i = 0; i < imgs.length; i++) {
        setBusy(`Uploading image ${i + 1}/${imgs.length}…`);
        const up = await base44.integrations.Core.UploadFile({ file: imgs[i] });
        urls.push(up.file_url);
      }
      await study(urls, 'image');
    } catch (e) {
      setError(e?.message || 'Could not study that image.');
      setBusy('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onPaste={(e) => {
        if (!busy && [...(e.clipboardData?.files || [])].some((f) => f.type.startsWith('image/'))) {
          handleImages(e.clipboardData.files);
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0a0a] p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-black tracking-tight mb-1">Teach me a style</h3>
        <p className="text-white/50 text-xs leading-relaxed mb-4">
          Upload a video (up to 10 minutes) or up to 4 images — or just paste images right here. I study every frame,
          learn the style, and keep it forever for your videos.
        </p>

        <div className="flex gap-2 mb-4">
          {[
            ['video', 'Video', Film],
            ['image', 'Images', ImageIcon]
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              disabled={!!busy}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 ${
                mode === id
                  ? 'bg-white text-black border-white'
                  : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {busy ? (
          <p className="flex items-center gap-2 text-sm text-white/70 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> {busy}
          </p>
        ) : mode === 'video' ? (
          <button
            onClick={() => videoInput.current?.click()}
            className="w-full py-8 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
          >
            Choose a video (up to 10 min)
          </button>
        ) : (
          <button
            onClick={() => imageInput.current?.click()}
            className="w-full py-8 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
          >
            Choose up to 4 images — or paste them here
          </button>
        )}

        <input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={(e) => handleVideo(e.target.files?.[0])} />
        <input ref={imageInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files || [])} />

        {error && <p className="text-white/70 text-xs mt-3 border border-white/15 rounded-lg px-3 py-2 bg-white/[0.03]">{error}</p>}
      </div>
    </div>
  );
}