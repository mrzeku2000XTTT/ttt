import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Download, Compass, Film, Lightbulb, Clapperboard, Captions, Pause, Music, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { VOX_MASTER_PROMPT } from './voxMasterPrompt';
import YouTubeDeploy from './YouTubeDeploy';
import { ANIMATION_STYLES, stylePrompt, customStylePrompt, compileExplainerVideo, videoExt, researchAppUi, realUiPrompt, createAudioContext } from './explainerVideo';
import NicheStyleLearner from './NicheStyleLearner';
import { factCheckExplainer } from './explainerFactCheck';

const uid = () => Math.random().toString(36).slice(2);
const CHAT_KEY = 'niche_studio_chat'; // the chat survives a refresh
const fmtElapsed = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

const WorkDots = () => (
  <span className="inline-flex gap-1 ml-1 align-middle">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// Rotating wait-tips shown while the auto-pilot builds — about their own topic,
// plus how Kaspa can plug into their niche
const TipRotator = ({ tips }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!tips?.length) return;
    const t = setInterval(() => setI((x) => (x + 1) % tips.length), 8000);
    return () => clearInterval(t);
  }, [tips]);
  if (!tips?.length) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-white/40">
      <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {tips[i]}
    </p>
  );
};

// Automatic mode: talk to the auto-pilot, it researches, writes, draws, narrates,
// stitches the stick-man explainer and hands it back ready to deploy.
export default function NicheAutoStudio({ niches }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [learnedStyles, setLearnedStyles] = useState([]);
  const [showLearner, setShowLearner] = useState(false);
  const [voxMode, setVoxMode] = useState(false);
  const [captionMode, setCaptionMode] = useState('summary'); // 'summary' = short label, 'tts' = real narration
  const [soundtrack, setSoundtrack] = useState(false);
  const [musicUrl, setMusicUrl] = useState('');
  const [hideRecent, setHideRecent] = useState(false);
  const [m1Copied, setM1Copied] = useState(false);
  const scrollRef = useRef(null);
  const buildRef = useRef(null); // { cancelled } token for the in-flight build, so Pause can stop it
  const workIdRef = useRef(null); // id of the current "working" chat bubble, so Pause can settle it
  const inputRef = useRef(null);

  useEffect(() => {
    const names = (niches || []).map((n) => n.niche_name);
    const intro = names.length
      ? `Your saved niches: ${names.slice(0, 6).join(' · ')}. Tap one below to drop it in the box, then add any details — or paste a topic, an X link, or a prompt.`
      : `Paste a topic, an X link, or a prompt and I'll take it from there — or just talk to me.`;
    // refresh survival — restore the chat if there is one
    try {
      const saved = (JSON.parse(localStorage.getItem(CHAT_KEY) || '[]') || []).filter((m) => m && m.role && m.text);
      if (saved.length && saved.some((m) => m.role === 'user')) {
        setMessages(saved);
        return;
      }
    } catch {}
    setMessages([
      {
        id: uid(),
        role: 'ai',
        text: `Hey — I'm your NICHE auto-pilot. Give me a topic, an X link, or a prompt — I'll ask you to pick the animation style, how many scenes you want, and whether you want it black & white or colored. Then I research live, write the script, draw every scene, narrate, caption and stitch the MP4 — ready to deploy to YouTube.\n\n${intro}`
      }
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // live elapsed timer on whichever message is currently working
  useEffect(() => {
    const t = setInterval(() => {
      setMessages((m) =>
        m.map((x) => (x.working ? { ...x, elapsed: Math.floor((Date.now() - (x.startedAt || Date.now())) / 1000) } : x))
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    base44.entities.NicheStyle.list().then(setLearnedStyles).catch(() => {});
  }, []);

  // keep the chat on disk so a refresh doesn't wipe it
  useEffect(() => {
    if (!messages.length) return;
    try {
      localStorage.setItem(
        CHAT_KEY,
        JSON.stringify(
          messages
            .filter((m) => !m.working)
            .map((m) => ({
              id: m.id,
              role: m.role,
              text: m.text,
              video: m.video ? { title: m.video.title, description: m.video.description, tags: m.video.tags } : undefined
            }))
        )
      );
    } catch {}
  }, [messages]);

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    // must be created synchronously inside the tap — iOS blocks audio otherwise
    const audioContext = createAudioContext();
    const workId = uid();
    const token = { cancelled: false };
    buildRef.current = token;
    workIdRef.current = workId;
    const history = [...messages];
    setMessages((m) => [
      ...m,
      { id: uid(), role: 'user', text },
      { id: workId, role: 'ai', working: true, text: 'Thinking', startedAt: Date.now() }
    ]);

    const setWork = (t) => setMessages((m) => m.map((x) => (x.id === workId ? { ...x, text: t } : x)));
    const finish = (patch) =>
      setMessages((m) => m.map((x) => (x.id === workId ? { ...x, working: false, ...patch } : x)));

    try {
      const convo = history
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'You'}: ${m.text}`)
        .join('\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the NICHE Studio auto-pilot — a creative content director that builds animated explainer videos for creators, inside a chat.

${convo ? `Conversation so far:\n${convo}\n\n` : ''}User's saved niches: ${(niches || []).map((n) => n.niche_name).join(', ') || 'none yet'}.

User's new message: """${text}"""

Animation styles available (style ids): ${ANIMATION_STYLES.map((s) => `${s.id} (${s.name})`).join(', ')}. Default style: neutral.
"real-ui" (Real UI Clone) is special: use it when the topic is about a REAL app (e.g. "Kaspium wallet", "Cash App", "Binance", "Kaspa wallet", "Kaspa node dashboard"). It researches the app's actual UI from the web and clones it faithfully — premium modern UI, not stick-man. When you pick "real-ui" you MUST also set the app field to the app's name.
"vox" (Vox Documentary) is the documentary style — use it for documentary topics: history, wars, famous people, true stories, business mysteries, major world events, or anything that reads like a mini-documentary. It produces an archival cinematic photographic look with muted color grading, consistent across every scene. Match casual names ("documentary", "vox style", "explainer documentary") to "vox".
${learnedStyles.length ? `Styles the user personally taught you from their own videos or images (style ids): ${learnedStyles.map((s) => `${s.id} ("${s.name}")`).join(', ')}. If they ask to use one of these, use its id.` : ''}
${voxMode ? `MOTION V1 IS ON: the user selected the Vox documentary style. Always use style "vox" — do NOT ask about the animation style, and skip style from the things you ask for. You may still ask about scene_count and color_mode if unknown (default color_mode "color" for vox, 10 scenes).` : ''}

First, carefully extract the user's intent from their message and the conversation so far:
- topic: what the video is about
- style: a style id from the lists above — match casual names ("stick man"→neutral, "comic"→comic, "documentary"/"vox"→vox); if they name a style you don't have, offer the closest one from the list instead of using it
- scene_count: any number 6–15 they mention ("7 scenes", "10 steps")
- color_mode: "color" if they want a colored animation, "mono" for black & white

Read the user's intent carefully from their message AND the conversation so far. Decide for yourself whether you have enough to build a great customized video — do not block on style, scene count or color; those are details you can default. The only thing you truly need is a clear topic or angle.

Decide what to do:
- kind "chat": the user is just talking, asking a question, or exploring ideas — NOT asking for a video right now. Reply like a top-shelf niche strategist: sharp, creative, specific to their niche, never generic. Do NOT build a video.
- kind "ask": the user wants a video but the topic or angle is genuinely too thin or ambiguous to make a good one (e.g. just "make a video" with no subject). Ask ONE concise, specific question — two at most — to nail down what they actually want. Never ask a menu of style/scene/color questions unless they explicitly want to choose. Keep it warm and short.
- kind "video": the user gave a clear enough topic (even roughly), OR they are iterating on a video already discussed in this conversation (e.g. "make it shorter", "add a scene about Y", "change the ending", "do it in color", "redo it as a documentary"). You decide the rest — default style "neutral", 8 scenes, color_mode "mono" (if Motion V1 is on, style "vox", 10 scenes, color_mode "color"); honor any style/scene/color they did specify. For iterations, carry forward the previous topic and fold the requested change into a fresh full script. Research the topic live for accuracy and fresh, specific angles. Then produce:
  - style: the chosen style id from the list above (default "neutral")
  - scene_count: the number of scenes they chose
  - color_mode: "mono" or "color"
  - title: click-worthy, under 60 characters
  - scenes: EXACTLY scene_count scenes. Each scene: "action" = describes ONLY what is seen (typing at a desk, plugging in a cable, celebrating) — never commands, URLs, code or step text in the action, those go only in the voiceover, "caption" = an on-screen caption of at most 8 words matching the scene, "voiceover" = 2–4 spoken sentences, written the way a person talks.
  - The script must actually teach: for how-to topics it includes the real technical steps — which website to open, which buttons or menus to click, which commands to run — in chronological order, using real URLs, commands and requirements you have verified from live research. No vague generalities, no invented details.
  - camera: pick one per scene from zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down, static — match the scene's energy, never repeat the same move twice in a row, use static sparingly. This drives a Ken Burns camera move on the still image during stitching so the video feels alive.
  - When style is "vox": write the script in Fern documentary DNA — cold open on a precise date, location or name plus one concrete detail; calm precise documentary tone; one self-contained idea per sentence; factual restraint (never invent names, dates or numbers); and a cliffhanger final line of 12 words or fewer ending on a noun, name, date or short declarative. The art is a hand-cut documentary paper collage: aged newsprint and archival maps, halftone photo cutouts with scissor-cut edges, torn tape, typewriter strips, stamps, red string and brass pins, desaturated tan/ink-black/halftone-gray palette with one hot red accent and mustard yellow secondary.
  - description: 2 short paragraphs for YouTube; tags: 8–10 SEO tags
  - reply: one warm sentence announcing the video and its topic
- Otherwise return kind "chat" and reply conversationally like a top-shelf niche strategist — sharp, creative, specific to their niche, never generic. Do NOT build a video unless it's clearly wanted.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['chat', 'ask', 'video'] },
            reply: { type: 'string' },
            video: {
              type: 'object',
              properties: {
                style: { type: 'string', enum: [...ANIMATION_STYLES.map((s) => s.id), ...learnedStyles.map((s) => s.id)] },
                scene_count: { type: 'number' },
                color_mode: { type: 'string', enum: ['mono', 'color'] },
                app: { type: 'string', description: 'App name when style is real-ui' },
                title: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                scenes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      caption: { type: 'string' },
                      voiceover: { type: 'string' },
                      camera: { type: 'string', enum: ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'static'] }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (token.cancelled) { audioContext.close().catch(() => {}); return; }

      if (res.kind === 'video' && res.video?.scenes?.length) {
        const v = res.video;
        const learned = learnedStyles.find((s) => s.id === v.style);
        const styleId = learned ? v.style : ANIMATION_STYLES.some((s) => s.id === v.style) ? v.style : 'neutral';
        setWork('Fact-checking with live sources');
        const checked = await factCheckExplainer({ topic: v.title, title: v.title, scenes: v.scenes.slice(0, 15) });
        const scenes = checked.scenes.slice(0, 15);
        if (token.cancelled) { audioContext.close().catch(() => {}); return; }
        const n = scenes.length;
        // keep them company while we draw, narrate and stitch
        base44.integrations.Core.InvokeLLM({
          prompt: `A creator is building an explainer video on "${v.title}" right now and has to wait a while. Write 6 short tips (max 18 words each): at least 3 genuinely useful insights about this exact topic, and at least 2 concrete ways Kaspa — the instant proof-of-work cryptocurrency (on-chain tipping, KRC-20 tokens, its fast-growing community) — could plug into a creator's work in this niche. Punchy, no emojis.`,
          response_json_schema: {
            type: 'object',
            properties: { tips: { type: 'array', items: { type: 'string' } } }
          }
        })
          .then((r) => setMessages((m) => m.map((x) => (x.id === workId ? { ...x, tips: r.tips || [] } : x))))
          .catch(() => {});

        // Real UI Clone: research the actual app's UI once, then clone it per scene
        let uiDesc = '';
        if (styleId === 'real-ui') {
          setWork(`Researching the real ${v.app || v.title} UI from the web`);
          const r = await researchAppUi(v.app || v.title);
          uiDesc = r.description;
        }
        // draw every scene and record every narration in parallel — far faster than one by one
        let done = 0;
        const total = n * 2;
        const step = () => setWork(`Drawing & narrating · ${++done}/${total}`);
        setWork(`Drawing & narrating · 0/${total}`);
        const [images, audios] = await Promise.all([
          Promise.all(
            scenes.map((s) =>
              base44.integrations.Core.GenerateImage({
                prompt:
                  styleId === 'real-ui'
                    ? realUiPrompt(v.app || v.title, uiDesc, s.action, v.color_mode)
                    : learned
                      ? customStylePrompt(learned.description, s.action, v.color_mode)
                      : stylePrompt(styleId, s.action, v.color_mode)
              }).then((r) => (step(), r.url))
            )
          ),
          Promise.all(
            scenes.map((s) =>
              base44.integrations.Core.GenerateSpeech({ text: s.voiceover, voice: 'storm' }).then((r) => (step(), r.url))
            )
          )
        ]);
        if (token.cancelled) { audioContext.close().catch(() => {}); return; }
        setWork('Stitching your video');
        const blob = await compileExplainerVideo({
          images,
          audios,
          captions: scenes.map((s) => (captionMode === 'tts' ? (s.voiceover || s.caption || '') : (s.caption || String(s.voiceover || '').split(' ').slice(0, 8).join(' ')))),
          style: styleId,
          cameras: scenes.map((s) => s.camera),
          musicUrl: soundtrack ? musicUrl.trim() : '',
          onProgress: setWork,
          audioContext
        });
        // best effort — save the finished video to the user's Library
        (async () => {
          try {
            const me = await base44.auth.me();
            if (!me?.email) return;
            const up = await base44.integrations.Core.UploadFile({
              file: new File(
                [blob],
                `${(v.title || 'niche-explainer').replace(/[^a-z0-9]+/gi, '-')}.${videoExt(blob.type)}`,
                { type: blob.type }
              )
            });
            await base44.entities.NicheVideo.create({
              user_email: me.email,
              title: v.title,
              description: v.description || '',
              tags: v.tags || [],
              style_name: learned ? learned.name : (ANIMATION_STYLES.find((s) => s.id === styleId) || {}).name || 'Neutral',
              video_url: up.file_url,
              scenes: scenes.map((s) => ({ action: s.action, caption: s.caption, voiceover: s.voiceover })),
              fact_note: checked.note || ''
            });
          } catch {}
        })();
        finish({
          text: `${res.reply || `Your explainer is ready — ${n} scenes, narrated, captioned, stitched. Saved to your Library.`}${checked.note ? `\n\nFact-checked: ${checked.note}` : ''}`,
          video: {
            url: URL.createObjectURL(blob),
            type: blob.type,
            title: v.title,
            description: v.description,
            tags: v.tags || []
          }
        });
      } else {
        audioContext.close().catch(() => {});
        finish({ text: res.reply || "Tell me a topic or paste your niche and I'll build the video." });
      }
    } catch (e) {
      finish({ text: `Something went wrong: ${e?.message || e}. Want me to try again?` });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  // Pause the in-flight build so the user can iterate: cancel its token, settle the
  // working bubble, and re-enable the input. The discarded work resolves later but
  // its result is dropped at the next checkpoint.
  const pauseBuild = () => {
    if (buildRef.current) buildRef.current.cancelled = true;
    buildRef.current = null;
    const wid = workIdRef.current;
    workIdRef.current = null;
    if (wid) setMessages((m) => m.map((x) => (x.id === wid ? { ...x, working: false, text: `${x.text} — paused. Tell me what to change.` } : x)));
    setBusy(false);
    inputRef.current?.focus();
  };

  const download = (m) => {
    const a = document.createElement('a');
    a.href = m.video.url;
    a.download = `${(m.video.title || 'niche-explainer').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${videoExt(m.video.type)}`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col" style={{ height: 'calc(100vh - 190px)' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-white text-black rounded-br-sm'
                  : 'bg-white/[0.04] border border-white/10 text-white rounded-bl-sm'
              }`}
            >
              {m.working ? (
                <>
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin opacity-70" /> {m.text}
                    {m.elapsed != null ? <span className="text-white/40 tabular-nums">· {fmtElapsed(m.elapsed)}</span> : null}
                    <WorkDots />
                  </span>
                  <TipRotator tips={m.tips} />
                </>
              ) : (
                <>
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.video && (
                    <div className="mt-3 space-y-3">
                      {m.video.url ? (
                        <>
                          <video src={m.video.url} controls className="w-full rounded-xl border border-white/10 bg-black" />
                          <button
                            onClick={() => download(m)}
                            className="w-full py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download MP4
                          </button>
                        </>
                      ) : (
                        <p className="text-white/50 text-xs border border-white/10 rounded-lg px-3 py-2">
                          This video is saved in your Library tab.
                        </p>
                      )}
                      <YouTubeDeploy title={m.video.title} description={m.video.description} tags={m.video.tags} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* Input stays pinned — it never scrolls away */}
      <div className="pt-3 pb-1 border-t border-white/10 mt-2">
        {niches?.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 items-center">
            <button
              onClick={() => setHideRecent((h) => !h)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors mr-1"
              title={hideRecent ? 'Show recent niches' : 'Hide recent niches'}
            >
              {hideRecent ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              Recent
            </button>
            {!hideRecent && niches.slice(0, 6).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setInput(`Make an explainer video for my niche: ${n.niche_name}`);
                  inputRef.current?.focus();
                }}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-xs font-medium transition-all disabled:opacity-40"
              >
                <Compass className="w-3.5 h-3.5" /> {n.niche_name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setVoxMode((v) => !v)}
            disabled={busy}
            title="Motion V1 — Vox documentary style"
            className={`flex items-center gap-1.5 px-3 rounded-xl border transition-all disabled:opacity-40 ${
              voxMode
                ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
            aria-label="Motion V1 — Vox style"
          >
            <Clapperboard className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Motion V1</span>
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(VOX_MASTER_PROMPT);
                setM1Copied(true);
                setTimeout(() => setM1Copied(false), 2000);
              } catch {}
            }}
            disabled={busy}
            title="Vox M1 — copy the master prompt to use anywhere"
            className={`flex items-center gap-1.5 px-3 rounded-xl border transition-all disabled:opacity-40 ${
              m1Copied
                ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
            aria-label="Vox M1 master prompt"
          >
            {m1Copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs font-semibold hidden sm:inline">M1</span>
          </button>
          <button
            onClick={() => setCaptionMode((m) => (m === 'summary' ? 'tts' : 'summary'))}
            disabled={busy}
            title="Caption mode — Summary label or real TTS narration"
            className={`flex items-center gap-1.5 px-3 rounded-xl border transition-all disabled:opacity-40 ${
              captionMode === 'tts'
                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
            aria-label="Caption mode"
          >
            <Captions className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">{captionMode === 'tts' ? 'Real TTS' : 'Summary'}</span>
          </button>
          <button
            onClick={() => setSoundtrack((s) => !s)}
            disabled={busy}
            title="Background soundtrack — paste a royalty-free audio URL (e.g. a Pixabay download link)"
            className={`flex items-center gap-1.5 px-3 rounded-xl border transition-all disabled:opacity-40 ${
              soundtrack
                ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
            aria-label="Soundtrack"
          >
            <Music className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Music</span>
          </button>
          <button
            onClick={() => setShowLearner(true)}
            disabled={busy}
            title="Teach me a style from a video or images"
            className="px-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
            aria-label="Teach me a style"
          >
            <Film className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={voxMode ? 'Motion V1 (Vox) is on — paste a topic, X link, or prompt…' : 'Paste a topic, X link, or niche — or tell me what to build…'}
            disabled={busy}
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={busy ? pauseBuild : () => send(input)}
            disabled={!busy && !input.trim()}
            className={`px-4 rounded-xl font-bold transition-all disabled:opacity-40 ${
              busy
                ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300 hover:bg-amber-400/30'
                : 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
            }`}
            aria-label={busy ? 'Pause and iterate' : 'Send'}
            title={busy ? 'Pause and iterate' : 'Send'}
          >
            {busy ? <Pause className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {soundtrack && (
          <input
            value={musicUrl}
            onChange={(e) => setMusicUrl(e.target.value)}
            disabled={busy}
            placeholder="Paste a direct .mp3/.wav URL (royalty-free, e.g. a Pixabay download link)"
            className="w-full mt-2 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
          />
        )}
      </div>

      {showLearner && (
        <NicheStyleLearner
          onClose={() => setShowLearner(false)}
          onLearned={(s) => {
            setLearnedStyles((prev) => [...prev, s]);
            send(`I just taught you my style "${s.name}" — use it for my videos from now on`);
          }}
        />
      )}
    </div>
  );
}