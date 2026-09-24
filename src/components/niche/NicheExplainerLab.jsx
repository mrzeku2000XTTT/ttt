import React, { useState, useEffect } from 'react';
import { PenTool, Loader2, Mic, Download, ShieldCheck, Captions, Music, Gauge, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import YouTubeDeploy from './YouTubeDeploy';
import ExplainerPlayer from './ExplainerPlayer';
import { ANIMATION_STYLES, COLOR_MODES, stylePrompt, customStylePrompt, compileExplainerVideo, videoExt, researchAppUi, realUiPrompt, createAudioContext } from './explainerVideo';
import NicheStyleLearner from './NicheStyleLearner';
import { factCheckExplainer } from './explainerFactCheck';
import { buildSentenceBeats, beatCaption } from './sentencePacing';
import GsapOverlayPreview from './GsapOverlayPreview';
import { generateOverlaySpec } from './gsapOverlay';

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
  const [captionMode, setCaptionMode] = useState('summary'); // 'summary' = short label, 'tts' = real narration
  const [soundtrack, setSoundtrack] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [appName, setAppName] = useState(''); // for the "Real UI Clone" style
  const [uiResearch, setUiResearch] = useState(null); // cached {app, description}
  const [elapsed, setElapsed] = useState(0); // live elapsed on the working status
  const [sentencePacing, setSentencePacing] = useState(false); // one image per spoken sentence
  const [gsapOverlay, setGsapOverlay] = useState(false); // GSAP-animated UI layer over the video
  const [overlays, setOverlays] = useState([]); // one overlay spec per unit
  const [previewIndex, setPreviewIndex] = useState(0); // which unit's overlay is being previewed

  const scenes = script?.scenes || [];
  // Sentence pacing: one image + one narration clip per spoken sentence, so the
  // visuals change with every line instead of holding one image for a whole scene.
  const beats = sentencePacing ? buildSentenceBeats(scenes) : [];
  const units = sentencePacing ? beats : scenes;
  const unitLine = (u) => u.line ?? u.voiceover ?? '';
  const unitCaption = (u) =>
    sentencePacing
      ? beatCaption(u, captionMode)
      : captionMode === 'tts'
        ? (u.voiceover || u.caption || '')
        : (u.caption || String(u.voiceover || '').split(' ').slice(0, 8).join(' '));

  const toggleSentencePacing = () => {
    // pacing changes the asset layout (one per sentence vs one per scene), so the
    // generated images/narration are cleared to keep everything in sync
    setSentencePacing((v) => !v);
    setImages([]);
    setAudios([]);
  };

  const toggleGsapOverlay = () => {
    // overlays are authored per unit, so switching the layer clears them
    setGsapOverlay((v) => !v);
    setOverlays([]);
    setPreviewIndex(0);
  };

  // The agent designs one GSAP-animated UI layer per scene/sentence
  const generateOverlays = async () => {
    setBusy('Designing UI overlay 1/' + units.length + '…');
    try {
      const specs = [];
      for (let i = 0; i < units.length; i++) {
        setBusy(`Designing UI overlay ${i + 1}/${units.length}…`);
        const spec = await generateOverlaySpec({
          action: units[i].action,
          line: unitLine(units[i]),
          brand: `${niche.niche_name} — ${niche.tagline}`
        });
        specs.push(spec);
        setOverlays([...specs]);
      }
    } finally {
      setBusy('');
    }
  };

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
${sentencePacing ? `5. Sentence pacing is ON: split every scene's voiceover into its individual sentences and add a "beats" array to that scene — one beat per sentence, in order, each with "line" (that exact sentence) and "visual" (a distinct wordless visual moment showing what is on screen while that sentence is spoken). Joined in order, the beats' lines must read exactly as the scene's voiceover.` : ''}

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
                  voiceover: { type: 'string' },
                  ...(sentencePacing ? {
                    beats: {
                      type: 'array',
                      description: 'One entry per sentence of this scene voiceover, in order',
                      items: {
                        type: 'object',
                        properties: {
                          line: { type: 'string', description: 'The exact sentence of the voiceover' },
                          visual: { type: 'string', description: 'Wordless visual moment for this sentence — no commands or step text' }
                        }
                      }
                    }
                  } : {})
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
    setBusy('Drawing scene 1/' + units.length + '…');
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
      for (let i = 0; i < units.length; i++) {
        setBusy(`Drawing ${sentencePacing ? 'image' : 'scene'} ${i + 1}/${units.length}…`);
        const learned = learnedStyles.find((s) => `learned:${s.id}` === styleId);
        const prompt =
          styleId === 'real-ui'
            ? realUiPrompt(appName.trim(), uiDesc, units[i].action, colorMode)
            : learned
              ? customStylePrompt(learned.description, units[i].action, colorMode)
              : stylePrompt(styleId, units[i].action, colorMode);
        const res = await base44.integrations.Core.GenerateImage({ prompt });
        urls.push(res.url);
        setImages([...urls]);
      }
    } finally {
      setBusy('');
    }
  };

  const generateNarration = async () => {
    setBusy('Recording narration 1/' + units.length + '…');
    try {
      const urls = [];
      for (let i = 0; i < units.length; i++) {
        setBusy(`Recording narration ${i + 1}/${units.length}…`);
        const res = await base44.integrations.Core.GenerateSpeech({ text: unitLine(units[i]), voice: 'storm' });
        urls.push(res.url);
        setAudios([...urls]);
      }
    } finally {
      setBusy('');
    }
  };

  const downloadVideo = async () => {
    // must be created synchronously inside the tap — iOS blocks audio otherwise
    const audioContext = createAudioContext();
    setBusy('Stitching your video…');
    try {
      const blob = await compileExplainerVideo({
        images,
        audios,
        captions: units.map(unitCaption),
        overlays: gsapOverlay ? overlays : [],
        style: styleId,
        musicUrl: soundtrack ? musicUrl.trim() : '',
        onProgress: setBusy,
        audioContext,
        // sentence pacing keeps a tighter hold and breath so every line gets its own beat
        minScene: sentencePacing ? 1.8 : 3.5,
        gap: sentencePacing ? 0.25 : 0.45
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
        <button
          onClick={() => setCaptionMode((m) => (m === 'summary' ? 'tts' : 'summary'))}
          disabled={!!busy}
          title="Caption mode — Summary label or real TTS narration"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
            captionMode === 'tts'
              ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/60'
              : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
          }`}
          aria-label="Caption mode"
        >
          <Captions className="w-3.5 h-3.5" />
          {captionMode === 'tts' ? 'Real TTS' : 'Summary'}
        </button>
        <button
          onClick={toggleSentencePacing}
          disabled={!!busy}
          title="Sentence pacing — one image per spoken sentence, so the visuals change with every line"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
            sentencePacing
              ? 'bg-amber-400/15 text-amber-300 border-amber-400/60'
              : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
          }`}
          aria-label="Sentence pacing"
        >
          <Gauge className="w-3.5 h-3.5" />
          Sentence pacing {sentencePacing ? 'On' : 'Off'}
        </button>
        <button
          onClick={toggleGsapOverlay}
          disabled={!!busy}
          title="GSAP UI overlay — the agent designs a GSAP-animated UI layer and composites it on top of your video"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
            gsapOverlay
              ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/60'
              : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
          }`}
          aria-label="GSAP UI overlay"
        >
          <Sparkles className="w-3.5 h-3.5" />
          GSAP UI overlay {gsapOverlay ? 'On' : 'Off'}
        </button>
        <button
          onClick={() => setSoundtrack((s) => !s)}
          disabled={!!busy}
          title="Background soundtrack — paste a royalty-free audio URL (e.g. a Pixabay download link)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-50 ${
            soundtrack
              ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/60'
              : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
          }`}
          aria-label="Soundtrack"
        >
          <Music className="w-3.5 h-3.5" />
          Music
        </button>
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

      {soundtrack && (
        <input
          value={musicUrl}
          onChange={(e) => setMusicUrl(e.target.value)}
          placeholder="Paste a direct .mp3/.wav URL (royalty-free, e.g. a Pixabay download link)"
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
              disabled={!!busy || images.length === units.length}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy.startsWith('Drawing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              {images.length === units.length ? 'Visuals ready' : `Generate visuals (${units.length} ${sentencePacing ? 'sentences' : 'scenes'})`}
            </button>
            <button
              onClick={generateNarration}
              disabled={!!busy || audios.length === units.length}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy.startsWith('Recording') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              {audios.length === units.length ? 'Narration ready' : 'Generate TTS narration'}
            </button>
            {gsapOverlay && (
              <button
                onClick={generateOverlays}
                disabled={!!busy || overlays.length === units.length}
                className="flex-1 py-3 rounded-xl border border-cyan-400/40 text-cyan-200 hover:text-white hover:border-cyan-300 text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy.startsWith('Designing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {overlays.length === units.length ? 'UI overlay ready' : `Generate UI overlay (${units.length})`}
              </button>
            )}
          </div>

          {gsapOverlay && overlays.length > 0 && (
            <GsapOverlayPreview
              image={images[previewIndex]}
              spec={overlays[previewIndex]}
              label={`GSAP UI overlay ${previewIndex + 1} of ${units.length}`}
            />
          )}

          {images.length === units.length && audios.length === units.length && (
            <>
              <ExplainerPlayer images={images} audios={audios} captions={units.map(unitCaption)} />
              <button
                onClick={downloadVideo}
                disabled={!!busy || (gsapOverlay && overlays.length !== units.length)}
                className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {busy ? busy : gsapOverlay && overlays.length !== units.length ? 'Generate the UI overlay first' : 'Download MP4'}
              </button>
            </>
          )}

          <ol className="space-y-3">
            {units.map((u, i) => (
              <li
                key={i}
                onClick={overlays.length ? () => setPreviewIndex(i) : undefined}
                className={`rounded-xl border p-4 ${
                  overlays.length && previewIndex === i
                    ? 'border-white/40 bg-white/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                } ${overlays.length ? 'cursor-pointer' : ''}`}
              >
                {sentencePacing && u.first && (
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Scene {u.sceneIndex + 1}</p>
                )}
                <div className="flex items-center gap-3">
                  {images[i] ? (
                    <img src={images[i]} alt={sentencePacing ? `Image ${i + 1}` : `Scene ${i + 1}`} className="w-24 h-14 object-cover rounded-lg border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-24 h-14 rounded-lg border border-dashed border-white/15 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs mb-0.5">{sentencePacing ? 'Sentence' : 'Scene'} {i + 1}: {u.action}</p>
                    <p className="text-white text-sm leading-relaxed">{unitLine(u)}</p>
                    {overlays[i] && (
                      <p className="text-cyan-300/70 text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5">
                        GSAP overlay · {overlays[i].title}
                      </p>
                    )}
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
          onLearned={(s, ideaPrompt) => {
            setLearnedStyles((prev) => prev.some((item) => item.id === s.id) ? prev : [...prev, s]);
            setStyleId(`learned:${s.id}`);
            if (ideaPrompt) setTopic(ideaPrompt);
          }}
        />
      )}
    </div>
  );
}