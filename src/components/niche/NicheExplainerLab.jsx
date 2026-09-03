import React, { useState } from 'react';
import { PenTool, Loader2, Mic } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import YouTubeDeploy from './YouTubeDeploy';
import ExplainerPlayer from './ExplainerPlayer';

const stickPrompt = (action) =>
  `Minimalist hand-drawn stick figure explainer illustration showing: ${action}. One simple black stick-figure character with expressive stick arms and legs mid-action on a clean pure white background, thin marker ink lines, doodle sketch style, generous white space, wide 16:9 composition. STRICTLY NO TEXT: no words, no letters, no numbers, no labels, no captions, no signs, no writing of any kind anywhere in the image.`;

export default function NicheExplainerLab({ niche }) {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState(null);
  const [images, setImages] = useState([]);
  const [audios, setAudios] = useState([]);
  const [busy, setBusy] = useState(''); // progress label while working

  const scenes = script?.scenes || [];

  const generateScript = async () => {
    setBusy('Writing script…');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a viral explainer-video scriptwriter. Write a stick-man explainer video script.

Creator's niche: "${niche.niche_name}" — ${niche.tagline}
Video topic: "${topic.trim() || niche.niche_name}"

Write:
1. A click-worthy title (under 60 characters)
2. A 5-scene script. For each scene: one simple visual "action" a single stick figure can plainly show (walking, pointing, lifting, falling, celebrating — one clear visual moment, no words involved), and the exact narrator voiceover lines for that scene (2–4 sentences, written the way a person talks).
3. A YouTube description (2 short paragraphs)
4. 8–10 SEO tags

Narration must total about 60–90 seconds when spoken.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', description: 'What the stick figure is doing — one clear visual moment' },
                  voiceover: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setScript(res);
      setImages([]);
      setAudios([]);
    } finally {
      setBusy('');
    }
  };

  const generateVisuals = async () => {
    setBusy('Drawing scene 1/' + scenes.length + '…');
    try {
      const urls = [];
      for (let i = 0; i < scenes.length; i++) {
        setBusy(`Drawing scene ${i + 1}/${scenes.length}…`);
        const res = await base44.integrations.Core.GenerateImage({ prompt: stickPrompt(scenes[i].action) });
        urls.push(res.url);
        setImages([...urls]);
      }
    } finally {
      setBusy('');
    }
  };

  const generateNarration = async () => {
    setBusy('Recording narration 1/' + scenes.length + '…');
    try {
      const urls = [];
      for (let i = 0; i < scenes.length; i++) {
        setBusy(`Recording narration ${i + 1}/${scenes.length}…`);
        const res = await base44.integrations.Core.GenerateSpeech({ text: scenes[i].voiceover, voice: 'storm' });
        urls.push(res.url);
        setAudios([...urls]);
      }
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <PenTool className="w-4 h-4 text-white/50" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Stick-Man Explainer</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={`Video topic — leave blank to use "${niche.niche_name}"`}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
        <button
          onClick={generateScript}
          disabled={!!busy}
          className="px-5 py-3 rounded-xl bg-white text-black font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-40 transition-all"
        >
          {busy === 'Writing script…' ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
          {script ? 'New script' : 'Generate explainer'}
        </button>
      </div>

      {busy && busy !== 'Writing script…' && (
        <p className="text-white/50 text-xs mt-3 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {busy}
        </p>
      )}

      {script && (
        <div className="space-y-4 mt-5">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-1">Title</p>
            <p className="text-white font-bold text-lg">{script.title}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={generateVisuals}
              disabled={!!busy || images.length === scenes.length}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy.startsWith('Drawing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              {images.length === scenes.length ? 'Stick-man visuals ready' : `Generate stick-man visuals (${scenes.length} scenes)`}
            </button>
            <button
              onClick={generateNarration}
              disabled={!!busy || audios.length === scenes.length}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy.startsWith('Recording') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              {audios.length === scenes.length ? 'Narration ready' : 'Generate TTS narration'}
            </button>
          </div>

          {images.length === scenes.length && audios.length === scenes.length && (
            <ExplainerPlayer images={images} audios={audios} />
          )}

          <ol className="space-y-3">
            {scenes.map((s, i) => (
              <li key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  {images[i] ? (
                    <img src={images[i]} alt={`Scene ${i + 1}`} className="w-24 h-14 object-cover rounded-lg border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-24 h-14 rounded-lg border border-dashed border-white/15 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs mb-0.5">Scene {i + 1}: {s.action}</p>
                    <p className="text-white text-sm leading-relaxed">{s.voiceover}</p>
                  </div>
                </div>
                {audios[i] && (
                  <audio controls src={audios[i]} className="w-full mt-3 h-8" />
                )}
              </li>
            ))}
          </ol>

          <YouTubeDeploy title={script.title} description={script.description} tags={script.tags} />
        </div>
      )}
    </div>
  );
}