import React, { useState, useEffect } from 'react';
import { PenTool, Loader2, Mic, Download, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import YouTubeDeploy from './YouTubeDeploy';
import ExplainerPlayer from './ExplainerPlayer';
import { ANIMATION_STYLES, COLOR_MODES, stylePrompt, customStylePrompt, compileExplainerVideo, videoExt, researchAppUi, realUiPrompt } from './explainerVideo';
import NicheStyleLearner from './NicheStyleLearner';
import { factCheckExplainer } from './explainerFactCheck';

const fmtElapsed = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

export default function NicheExplainerLab({ niche }) {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState(null);
  const [images, setImages] = useState([]);
  const [audios, setAudios] = useState([]);
  const [busy, setBusy] = useState(''); // progress label while working
  const [styleId, setStyleId] = useState('neutral'); // default animation style
  const [sceneCount, setSceneCount] = useState(8);
  const [learnedStyles, setLearnedStyles] = useState([]);
  const [showLearner, setShowLearner] = useState(false);
  const [colorMode, setColorMode] = useState('mono'); // black & white by default, colored optional
  const [appName, setAppName] = useState(''); // for the "Real UI Clone" style
  const [uiResearch, setUiResearch] = useState(null); // cached {app, description}
  const [elapsed, setElapsed] = useState(0); // live elapsed on the working status

  const scenes = script?.scenes || [];

  // tick elapsed seconds while any build step is running
  useEffect(() => {
    if (!busy) { setElapsed(0); return; }
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [busy]);

  useEffect(() => {
    base44.entities.NicheStyle.list().then(setLearnedStyles).catch(() => {});
  }, []);

  // a scene count / color choice sent over from the Niche app
  useEffect(() => {
    try {
      const req = JSON.parse(localStorage.getItem('niche_video_request') || 'null');
      if (req) {
        if (req.scenes >= 6 && req.scenes <= 15) setSceneCount(req.scenes);
        if (req.colorMode) setColorMode(req.colorMode);
        localStorage.removeItem('niche_video_request');
      }
    } catch {}
  }, []);

  const generateScript = async () => {
    setBusy('Writing script…');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a viral explainer-video scriptwriter. Write an animated explainer video script.

Creator's niche: "${niche.niche_name}" — ${niche.tagline}
Video topic: "${topic.trim() || niche.niche_name}"

Write:
1. A click-worthy title (under 60 characters)
2. A script of exactly ${sceneCount} scenes. For each scene: a visual "action" describing ONLY what is seen (typing at a desk, plugging in a cable, celebrating) — never commands, URLs, code or step text in the action, those go only in the voiceover; a short on-screen "caption" of at most 8 words matching the scene; and the exact narrator voiceover lines for that scene (2–4 sentences, written the way a person talks).
3. A YouTube description (2 short paragraphs)
4. 8–10 SEO tags

The script must actually teach: for how-to topics include the real technical steps — which website to open, which buttons or menus to click, which commands to run — in chronological order, with real URLs, commands and requirements you have verified from live research. No vague generalities, no invented details.

Narration must total about 60–120 seconds when spoken.`,
        add_context_from_internet: true,
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
                  action: { type: 'string', description: 'What the character is seen doing — pure visual moment, no commands or step text' },
                  caption: { type: 'string', description: 'Short on-screen caption, max 8 words' },
                  voiceover: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setBusy('Fact-checking with live sources…');
      const checked = await factCheckExplainer({
        topic: topic.trim() || niche.niche_name,
        title: res.title,
        scenes: res.scenes || []
      });
      setScript({ ...res, scenes: checked.scenes, fact_note: checked.note });
      setImages([]);
      setAudios([]);
    } finally {
      setBusy('');
    }
  };

  const generateVisuals = async () => {
    setBusy('Drawing scene 1/' + scenes.length + '…');
    try {
      // Real UI Clone: research the actual app's UI once, then clone it per scene
      let uiDesc = '';
      if (styleId === 'real-ui') {
        const name = appName.trim();
        if (!name) {
          setBusy('Enter the app name to clone its real UI…');
          setTimeout(() => setBusy(''), 1800);
          return;
        }
        if (!uiResearch || uiResearch.app !== name) {
          setBusy(`Researching the real ${name} UI from the web…`);
          const r = await researchAppUi(name);
          setUiResearch(r);
          uiDesc = r.description;
        } else {
          uiDesc = uiResearch.description;
        }
      }
      const urls = [];
      for (let i = 0; i < scenes.length; i++) {
        setBusy(`Drawing scene ${i + 1}/${scenes.length}…`);
        const learned = learnedStyles.find((s) => `learned:${s.id}` === styleId);
        const prompt =
          styleId === 'real-ui'
            ? realUiPrompt(appName.trim(), uiDesc, scenes[i].action, colorMode)
            : learned
              ? customStylePrompt(learned.description, scenes[i].action, colorMode)
              : stylePrompt(styleId, scenes[i].action, colorMode);
        const res = await base44.integrations.Core.GenerateImage({ prompt });
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

  const downloadVideo = async () => {
    setBusy('Stitching your video…');
    try {
      const blob = await compileExplainerVideo({
        images,
        audios,
        captions: scenes.map((s) => s.caption || String(s.voiceover || '').split(' ').slice(0, 8).join(' ')),
        style: styleId,
        onProgress: setBusy
      });
      // best effort — save the finished video to the user's Library
      (async () => {
        try {
          const me = await base44.auth.me();
          if (!me?.email) return;
          const learned = learnedStyles.find((s) => `learned:${s.id}` === styleId);
          const up = await base44.integrations.Core.UploadFile({
            file: new File(
              [blob],
              `${(script.title || 'niche-explainer').replace(/[^a-z0-9]+/gi, '-')}.${videoExt(blob.type)}`,
              { type: blob.type }
            )
          });
          await base44.entities.NicheVideo.create({
            user_email: me.email,
            title: script.title,
            description: script.description || '',
            tags: script.tags || [],
            style_name: learned ? learned.name : (ANIMATION_STYLES.find((s) => s.id === styleId) || {}).name || 'Neutral',
            video_url: up.file_url,
            scenes: scenes.map((s) => ({ action: s.action, caption: s.caption, voiceover: s.voiceover })),
            fact_note: script.fact_note || ''
          });
        } catch {}
      })();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(script.title || 'niche-explainer').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${videoExt(blob.type)}`;
      a.click();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <PenTool className="w-4 h-4 text-white/50" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Explainer Video</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {ANIMATION_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyleId(s.id)}
            disabled={!!busy}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
              styleId === s.id
                ? 'bg-white text-black border-white'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            {s.name}
          </button>
        ))}
        {learnedStyles.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyleId(`learned:${s.id}`)}
            disabled={!!busy}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
              styleId === `learned:${s.id}`
                ? 'bg-white text-black border-white'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            ★ {s.name}
          </button>
        ))}
        <button
          onClick={() => setShowLearner(true)}
          disabled={!!busy}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-50"
        >
          + Learn a style
        </button>
        {COLOR_MODES.map((c) => (
          <button
            key={c.id}
            onClick={() => setColorMode(c.id)}
            disabled={!!busy}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
              colorMode === c.id
                ? 'bg-white text-black border-white'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            {c.name}
          </button>
        ))}
        <select
          value={sceneCount}
          onChange={(e) => setSceneCount(Number(e.target.value))}
          disabled={!!busy}
          className="ml-auto bg-white/[0.03] border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/70 focus:border-white/40 focus:outline-none disabled:opacity-50"
        >
          {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
            <option key={n} value={n} className="bg-black text-white">
              {n} scenes
            </option>
          ))}
        </select>
      </div>

      {styleId === 'real-ui' && (
        <input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="App name to clone — e.g. Kaspium wallet, Cash App, Binance"
          className="w-full mb-4 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
      )}

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

      {busy && (
        <p className="text-white/50 text-xs mt-3 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {busy}
          {elapsed > 0 ? <span className="tabular-nums text-white/35">· {fmtElapsed(elapsed)}</span> : null}
        </p>
      )}

      {script && (
        <div className="space-y-4 mt-5">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-1">Title</p>
            <p className="text-white font-bold text-lg">{script.title}</p>
            {script.fact_note && (
              <p className="text-white/40 text-xs mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Fact-checked: {script.fact_note}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={generateVisuals}
              disabled={!!busy || images.length === scenes.length}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy.startsWith('Drawing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              {images.length === scenes.length ? 'Visuals ready' : `Generate visuals (${scenes.length} scenes)`}
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
            <>
              <ExplainerPlayer images={images} audios={audios} captions={scenes.map((s) => s.caption || '')} />
              <button
                onClick={downloadVideo}
                disabled={!!busy}
                className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {busy ? busy : 'Download MP4'}
              </button>
            </>
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

      {showLearner && (
        <NicheStyleLearner
          onClose={() => setShowLearner(false)}
          onLearned={(s) => {
            setLearnedStyles((prev) => [...prev, s]);
            setStyleId(`learned:${s.id}`);
          }}
        />
      )}
    </div>
  );
}