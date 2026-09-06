import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Download, Compass, Film, Lightbulb, Clapperboard, Captions, Pause, Music, Eye, EyeOff, Copy, Check, ScrollText, Paperclip, X, SlidersHorizontal, FileText, FileSpreadsheet, FileJson, FileCode, FileImage, File, Sparkles, Code2 } from 'lucide-react';
import { VOX_MASTER_PROMPT } from './voxMasterPrompt';
import NichePromptsPanel from './NichePromptsPanel';
import YouTubeDeploy from './YouTubeDeploy';
import { ANIMATION_STYLES, stylePrompt, customStylePrompt, compileExplainerVideo, videoExt, researchAppUi, realUiPrompt, createAudioContext } from './explainerVideo';
import NicheStyleLearner from './NicheStyleLearner';
import { factCheckExplainer } from './explainerFactCheck';
import { sceneCodePrompt, buildFramezDoc, fallbackScene } from '@/components/framez/framezKit';
import FramezStage from '@/components/framez/studio/FramezStage';

const uid = () => Math.random().toString(36).slice(2);
const CHAT_KEY = 'niche_studio_chat'; // the chat survives a refresh
const fmtElapsed = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

// Detect a file's type from its mime + extension so the attachment chip can show
// the right logo (PDF, CSV, JSON, MD, TXT, image…) instead of a generic icon.
const fileKind = (file) => {
  const name = (file?.name || '').toLowerCase();
  const type = file?.type || '';
  if (type.startsWith('image/')) return { label: 'IMG', Icon: FileImage, color: 'text-sky-300' };
  if (type === 'application/pdf' || name.endsWith('.pdf')) return { label: 'PDF', Icon: FileText, color: 'text-red-300' };
  if (name.endsWith('.csv') || type === 'text/csv') return { label: 'CSV', Icon: FileSpreadsheet, color: 'text-emerald-300' };
  if (name.endsWith('.json') || type === 'application/json') return { label: 'JSON', Icon: FileJson, color: 'text-amber-300' };
  if (name.endsWith('.md') || type === 'text/markdown') return { label: 'MD', Icon: FileCode, color: 'text-violet-300' };
  if (name.endsWith('.txt') || type.startsWith('text/')) return { label: 'TXT', Icon: FileText, color: 'text-white/60' };
  return { label: 'FILE', Icon: File, color: 'text-white/60' };
};

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
  const [motionFx, setMotionFx] = useState(() => {
    try { return JSON.parse(localStorage.getItem('niche_motionfx') || 'false'); } catch { return false; }
  });
  const [framezMode, setFramezMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('niche_framez') || 'false'); } catch { return false; }
  });
  const [musicUrl, setMusicUrl] = useState('');
  const [showRecentChips, setShowRecentChips] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [m1Copied, setM1Copied] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [masterMode, setMasterMode] = useState(false);
  const scrollRef = useRef(null);
  const lastScrollSigRef = useRef(null);
  const fileInputRef = useRef(null);
  const masterPromptRef = useRef(null);
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

  // Auto-scroll ONLY when a new message arrives or the working bubble settles —
  // not on the 1-second elapsed timer updates, which would yank the user back
  // to the bottom every second while they're reading up the thread.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    const sig = `${last.id}:${last.working ? 'w' : 's'}`;
    if (sig === lastScrollSigRef.current) return;
    lastScrollSigRef.current = sig;
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

  // Attach images/files (or paste them) so the AI can ingest them as references,
  // analyze and fact-check them, and ask focused questions before building.
  const addFiles = (fileList) => {
    Array.from(fileList).forEach((file) => {
      const id = uid();
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      setAttachments((a) => [...a, { id, file, previewUrl, uploadedUrl: null, status: 'uploading' }]);
      base44.integrations.Core.UploadFile({ file })
        .then((up) => setAttachments((a) => a.map((x) => (x.id === id ? { ...x, uploadedUrl: up.file_url, status: 'done' } : x))))
        .catch(() => setAttachments((a) => a.map((x) => (x.id === id ? { ...x, status: 'error' } : x))));
    });
  };

  const removeAttachment = (id) => {
    setAttachments((a) => {
      const att = a.find((x) => x.id === id);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return a.filter((x) => x.id !== id);
    });
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (busy) return;
    let attachmentUrls = [];
    let attachmentPreviews = [];
    if (attachments.length) {
      attachmentUrls = await Promise.all(
        attachments.map(async (a) => {
          if (a.uploadedUrl) return a.uploadedUrl;
          if (a.file) {
            try {
              const up = await base44.integrations.Core.UploadFile({ file: a.file });
              setAttachments((prev) => prev.map((x) => (x.id === a.id ? { ...x, uploadedUrl: up.file_url, status: 'done' } : x)));
              return up.file_url;
            } catch { return null; }
          }
          return null;
        })
      ).then((r) => r.filter(Boolean));
      attachmentPreviews = attachments.map((a) => a.previewUrl).filter(Boolean);
    }
    const userText = text || (attachmentUrls.length ? 'Analyze the attached reference(s) and tell me what you see — fact-check anything claim-like, and ask me one focused question about what I want built.' : '');
    if (!userText) return;
    setInput('');
    setAttachments([]);
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
      { id: uid(), role: 'user', text: userText, attachments: attachmentPreviews.length ? attachmentPreviews : undefined },
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

      // Master-prompt mode: the user loaded a master engine (Vox M1, Stickman,
      // or their own). The AI adopts it and walks its states instead of building
      // a TTT video.
      const activating = !masterMode && !!masterPromptRef.current && userText === masterPromptRef.current;
      if (activating || masterMode) {
        if (activating) setMasterMode(true);
        setWork('Reading the master prompt');
        const masterRes = await base44.integrations.Core.InvokeLLM({
          prompt: `${masterPromptRef.current}\n\n---\n\nConversation so far:\n${convo}\n\nUser's latest message: """${activating ? '(Engine activated — begin STATE 1 now. Ask the first question exactly as specified, nothing else.)' : userText}"""\n\nFollow this engine's states in order. Respond ONLY with the current state's deliverable — no preamble, no commentary about your process. Stop after each state and wait for the user's reply.`,
          add_context_from_internet: false
        });
        if (token.cancelled) { audioContext.close().catch(() => {}); return; }
        audioContext.close().catch(() => {});
        finish({ text: typeof masterRes === 'string' ? masterRes : (masterRes?.reply || JSON.stringify(masterRes)) });
        return;
      }

      // If the user pasted a link, read its actual content first — X posts and
      // articles can't be read from the URL alone, and the video must be about
      // what the post actually says, not a guess from the link.
      let linkContext = '';
      const pastedUrls = text.match(/https?:\/\/[^\s]+/gi) || [];
      if (pastedUrls.length) {
        setWork('Reading the link you pasted');
        const fetched = await Promise.all(
          pastedUrls.slice(0, 2).map((u) => base44.functions.invoke('fetchUrlContent', { url: u }).catch(() => null))
        );
        linkContext = fetched
          .map((r, i) => {
            const d = r?.textContent ? r : r?.data;
            if (!d) return '';
            const content = String(d.textContent || d.metaDescription || '').trim();
            if (!content) return '';
            return `Link: ${pastedUrls[i]}\nTitle: ${d.title || ''}\nContent: ${content.slice(0, 3000)}`;
          })
          .filter(Boolean)
          .join('\n\n');
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the NICHE Studio auto-pilot — a creative content director that builds animated explainer videos for creators, inside a chat.

${convo ? `Conversation so far:\n${convo}\n\n` : ''}User's saved niches: ${(niches || []).map((n) => n.niche_name).join(', ') || 'none yet'}.

User's new message: """${text}"""
${linkContext ? `\nThe user pasted a link. Its actual fetched content:\n"""${linkContext}"""\nHARD RULE for pasted links: the video's topic is exactly the subject of this fetched content — never the URL, the account name, one of the user's saved niches, or anything found in web search that is not this content. If it is an X/Twitter post: build a structured, scene-by-scene explainer OF THE POST ITSELF — its subject (the project, character, update or event the post announces), its points in the order the post makes them, and every claim in the script traceable to the post text. 1:1 accuracy with the post. Do NOT pivot to a generic explainer, an ecosystem overview, a competitor or loosely related project, or a random niche — derive the video's angle and niche from the post's own content. STYLE for X posts — MANDATORY REMIX: unless the user explicitly asked for one specific style, you MUST set the "style" field on EVERY scene (a missing style field falls back to one uniform look, which is wrong for X posts). Use at least 3 different style ids across the video and never let more than half the scenes share the same style — you have the full animation canon to draw from (cel, digital-2d, cgi-3d, anime, claymation, cutout, motion-graphics, rotoscope, rubber-hose, hybrid-2d, vox, real-ui, comic, papercut, isometric, chalkboard, neutral). Pick per scene from that moment's own content: cinematic/narrative beat → vox or anime, app/wallet UI moment → real-ui (+ app field), emotional beat → hybrid-2d or anime, charming moment → claymation or cutout, retro/playful beat → rubber-hose or cel, sleek tech beat → motion-graphics or cgi-3d, realistic human moment → rotoscope, plain explainer beat → neutral, diagram beat → isometric or chalkboard.` : ''}

Animation styles available (style ids): ${ANIMATION_STYLES.map((s) => `${s.id} (${s.name})`).join(', ')}. Default style: neutral.
"real-ui" (Real UI Clone) is special: use it when the topic is about a REAL app (e.g. "Kaspium wallet", "Cash App", "Binance", "Kaspa wallet", "Kaspa node dashboard"). It researches the app's actual UI from the web and clones it faithfully — premium modern UI, not stick-man. When you pick "real-ui" you MUST also set the app field to the app's name.
"vox" (Vox Documentary) is the documentary style — use it for documentary topics: history, wars, famous people, true stories, business mysteries, major world events, or anything that reads like a mini-documentary. It produces an archival cinematic photographic look with muted color grading, consistent across every scene. Match casual names ("documentary", "vox style", "explainer documentary") to "vox". But do NOT default an entire video to vox just because a post or update reads serious — unless the user asked for documentary/vox, remix per scene.
${learnedStyles.length ? `Styles the user personally taught you from their own videos or images (style ids): ${learnedStyles.map((s) => `${s.id} ("${s.name}")`).join(', ')}. If they ask to use one of these, use its id.` : ''}
${voxMode ? `MOTION V1 IS ON: the user selected the Vox documentary style. Always use style "vox" — do NOT ask about the animation style, and skip style from the things you ask for. You may still ask about scene_count and color_mode if unknown (default color_mode "color" for vox, 10 scenes).` : ''}
${attachmentUrls.length ? `The user attached ${attachmentUrls.length} reference file(s) — they are provided as file_urls (images and/or documents). Look at them carefully and use them as context for the video or your answer. Analyze and fact-check any claim-like content in them against live sources. If, after looking, the user's intent for a video is still genuinely unclear, ask ONE concise question (kind "ask").` : ''}

First, carefully extract the user's intent from their message and the conversation so far:
- topic: what the video is about
- style: the video's default style — a style id from the lists above; match casual names ("stick man"→neutral, "comic"→comic, "documentary"/"vox"→vox, "anime"→anime, "3d"/"pixar"→cgi-3d, "clay"/"claymation"→claymation, "retro"/"vintage"/"1930s"/"cuphead"→rubber-hose, "cel"/"hand-drawn"→cel, "spider-verse"→hybrid-2d, "motion graphics"→motion-graphics); if they name a style you don't have, offer the closest one instead of using it. No style is ever forced — not even for X links — pick whatever the content itself calls for. STYLE REMIX — you are a master of the full animation canon: cel (hand-drawn classic), digital-2d, cgi-3d, anime, claymation, cutout, motion-graphics, rotoscope, rubber-hose, hybrid-2d, vox, real-ui, comic, papercut, isometric, chalkboard, neutral. Give any scene its own "style" field to switch the look mid-video whenever it serves that moment: cinematic/narrative beat → vox, app/UI moment → real-ui + set the scene's "app" field, emotional/dramatic beat → anime or hybrid-2d, charming/tactile moment → claymation, playful retro beat → rubber-hose or cel, sleek/tech moment → motion-graphics or cgi-3d, realistic human movement → rotoscope, plain explainer beat → neutral, diagram beat → isometric. Remix freely scene by scene like a director who knows every technique — variety makes the video feel alive, but only when it serves the content; a consistent look is also fine when it fits.
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
  - scenes: EXACTLY scene_count scenes. Each scene: "action" = describes ONLY what is seen (typing at a desk, plugging in a cable, celebrating) — never commands, URLs, code or step text in the action, those go only in the voiceover, "caption" = an on-screen caption of at most 8 words matching the scene, "voiceover" = 2–4 spoken sentences, written the way a person talks, "style" (optional) = a style id overriding the video's default for that scene (remix), "app" (optional) = the app name when that scene uses real-ui.
  - The script must actually teach: for how-to topics it includes the real technical steps — which website to open, which buttons or menus to click, which commands to run — in chronological order, using real URLs, commands and requirements you have verified from live research. No vague generalities, no invented details.
  - camera: pick one per scene from zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down, static — match the scene's energy, never repeat the same move twice in a row, use static sparingly. This drives a Ken Burns camera move on the still image during stitching so the video feels alive.
  - When style is "vox": write the script in Fern documentary DNA — cold open on a precise date, location or name plus one concrete detail; calm precise documentary tone; one self-contained idea per sentence; factual restraint (never invent names, dates or numbers); and a cliffhanger final line of 12 words or fewer ending on a noun, name, date or short declarative. The art is a hand-cut documentary paper collage: aged newsprint and archival maps, halftone photo cutouts with scissor-cut edges, torn tape, typewriter strips, stamps, red string and brass pins, desaturated tan/ink-black/halftone-gray palette with one hot red accent and mustard yellow secondary.
  - description: 2 short paragraphs for YouTube; tags: 8–10 SEO tags
  - reply: one warm sentence announcing the video and its topic
- Otherwise return kind "chat" and reply conversationally like a top-shelf niche strategist — sharp, creative, specific to their niche, never generic. Do NOT build a video unless it's clearly wanted.`,
        add_context_from_internet: true,
        file_urls: attachmentUrls.length ? attachmentUrls : undefined,
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
                      style: { type: 'string', description: 'Optional per-scene style id (remix)' },
                      app: { type: 'string', description: 'App name when this scene uses real-ui' },
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
        const checked = await factCheckExplainer({ topic: v.title, title: v.title, scenes: v.scenes.slice(0, 15), source: linkContext || text });
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

        // Framez mode: render the same researched script as a coded HTML motion
        // film (HyperFrames style) instead of drawn scenes. Exports a real MP4.
        if (framezMode) {
          setWork('Directing coded shots');
          const film = {
            title: v.title,
            aspect: '16:9',
            W: 1280, H: 720,
            bg: v.color_mode === 'color' ? '#0b0b12' : '#050507',
            ink: '#f5f5f7',
            accent: '#22d3ee',
            shots: scenes.map((s, i) => ({ label: s.caption || `Shot ${i + 1}`, summary: s.action, duration: 1.8, motion: s.camera || 'your choice' }))
          };
          // one generated hero image from the topic, offered to every shot
          let heroImg = '';
          try {
            const ir = await base44.integrations.Core.GenerateImage({ prompt: `A premium cinematic hero visual for "${v.title}": bold, minimal, dark background, high contrast, no text. Suitable as a launch-film backdrop.` });
            if (ir?.url) heroImg = ir.url;
          } catch {}
          const genFz = async (shot, i) => {
            for (let a = 0; a < 2; a++) {
              try {
                const r = await base44.integrations.Core.InvokeLLM({
                  prompt: sceneCodePrompt(film, shot, i, scenes.length, heroImg),
                  response_json_schema: { type: 'object', properties: { html: { type: 'string' }, js: { type: 'string' } }, required: ['html', 'js'] }
                });
                if (r?.html && r?.js) return r;
              } catch {}
            }
            return fallbackScene(shot);
          };
          const results = new Array(scenes.length);
          for (let b = 0; b < scenes.length; b += 3) {
            const batch = scenes.slice(b, b + 3).map((s, i) => ({ i: b + i }));
            const got = await Promise.all(batch.map(({ i }) => genFz(film.shots[i], i)));
            batch.forEach(({ i }, k) => { results[i] = got[k]; });
            setWork(`Coding shots · ${Math.min(scenes.length, b + 3)}/${scenes.length}`);
            if (token.cancelled) { audioContext.close().catch(() => {}); return; }
          }
          audioContext.close().catch(() => {});
          const fzScenes = scenes.map((s, i) => ({ html: results[i].html, js: results[i].js, dur: 1.8 }));
          const doc = buildFramezDoc(fzScenes, { W: film.W, H: film.H, bg: film.bg, ink: film.ink });
          finish({
            text: res.reply || `Your coded film "${v.title}" is ready — ${scenes.length} shots, rendered live. Hit export for a real MP4.`,
            framez: { doc, film }
          });
          return;
        }

        // Per-scene style resolution — the AI can remix styles scene by scene;
        // anything it names that we don't have falls back to the video default
        const validStyle = (sid) => ANIMATION_STYLES.some((x) => x.id === sid) || learnedStyles.some((x) => x.id === sid);
        const sceneStyles = scenes.map((s) => (s.style && validStyle(s.style) ? s.style : styleId));
        // Real UI Clone: research the actual app's UI once — needed when the whole
        // video OR any single remixed scene uses the real-ui style
        let uiDesc = '';
        const realUiScene = scenes.find((s, i) => sceneStyles[i] === 'real-ui');
        if (realUiScene) {
          setWork(`Researching the real ${realUiScene.app || v.app || v.title} UI from the web`);
          const r = await researchAppUi(realUiScene.app || v.app || v.title);
          uiDesc = r.description;
        }
        // Generate every scene's image and narration in small batches with retry, so a
        // transient failure on one scene doesn't drop it (and doesn't kill the build).
        let done = 0;
        const total = n * 2;
        const step = () => setWork(`Drawing & narrating · ${++done}/${total}`);
        setWork(`Drawing & narrating · 0/${total}`);
        const withRetry = async (fn) => {
          for (let attempt = 0; attempt < 3; attempt++) {
            try { return await fn(); } catch (e) { if (attempt === 2) return null; await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); }
          }
        };
        const mapBatch = async (items, concurrency, fn) => {
          const out = new Array(items.length).fill(null);
          let idx = 0;
          await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
            while (idx < items.length) { const i = idx++; if (i < items.length) out[i] = await fn(items[i], i); }
          }));
          return out;
        };
        const [images, audios] = await Promise.all([
          mapBatch(scenes, 3, (s, i) =>
            withRetry(() => base44.integrations.Core.GenerateImage({
              prompt: (() => {
                const sid = sceneStyles[i];
                if (sid === 'real-ui') return realUiPrompt(s.app || v.app || v.title, uiDesc, s.action, v.color_mode);
                const ls = learnedStyles.find((x) => x.id === sid);
                if (ls) return customStylePrompt(ls.description, s.action, v.color_mode);
                return stylePrompt(sid, s.action, v.color_mode);
              })()
            })).then((r) => { step(); return r?.url || null; })
          ),
          mapBatch(scenes, 3, (s) =>
            withRetry(() => base44.integrations.Core.GenerateSpeech({ text: s.voiceover, voice: 'storm' }))
              .then((r) => { step(); return r?.url || null; })
          )
        ]);
        if (token.cancelled) { audioContext.close().catch(() => {}); return; }
        // A scene needs both its image and its narration to make the cut.
        const kept = scenes.map((s, i) => ({ s, img: images[i], aud: audios[i] })).filter((x) => x.img && x.aud);
        const dropped = n - kept.length;
        if (!kept.length) throw new Error('Every scene failed to generate — try again in a moment.');
        const finalScenes = kept.map((x) => x.s);
        const finalImages = kept.map((x) => x.img);
        const finalAudios = kept.map((x) => x.aud);
        setWork(motionFx ? 'Animating scenes with Motion FX' : 'Stitching your video');
        const blob = await compileExplainerVideo({
          images: finalImages,
          audios: finalAudios,
          captions: finalScenes.map((s) => (captionMode === 'tts' ? (s.voiceover || s.caption || '') : (s.caption || String(s.voiceover || '').split(' ').slice(0, 8).join(' ')))),
          style: styleId,
          cameras: finalScenes.map((s) => s.camera),
          musicUrl: soundtrack ? musicUrl.trim() : '',
          onProgress: setWork,
          audioContext,
          motion: motionFx
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
              scenes: finalScenes.map((s) => ({ action: s.action, caption: s.caption, voiceover: s.voiceover })),
              fact_note: checked.note || ''
            });
          } catch {}
        })();
        finish({
          text: `${res.reply || `Your explainer is ready — ${finalScenes.length} scenes, narrated, captioned, stitched. Saved to your Library.`}${dropped ? ` ⚠️ ${dropped} scene(s) were dropped because their image or narration failed to generate (the rest finished).` : ''}${checked.note ? `\n\nFact-checked: ${checked.note}` : ''}`,
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
              className={`${m.framez ? 'w-full' : 'max-w-[85%]'} rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
                  {m.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {m.attachments.map((src, i) => (
                        <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-black/10" />
                      ))}
                    </div>
                  )}
                  <p className={`whitespace-pre-line ${m.text.length > 300 ? 'max-h-40 overflow-y-auto' : ''}`}>{m.text}</p>
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
                  {m.framez && (
                    <div className="mt-3">
                      <FramezStage doc={m.framez.doc} film={m.framez.film} />
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
        {/* Attached references preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {attachments.map((a) => {
              const k = a.previewUrl ? null : fileKind(a.file);
              return (
              <div key={a.id} className="relative">
                {a.previewUrl ? (
                  <img src={a.previewUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-white/15" />
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-white/15 bg-white/5 flex flex-col items-center justify-center gap-0.5" title={a.file?.name}>
                    <k.Icon className={`w-5 h-5 ${k.color}`} />
                    <span className={`text-[9px] font-bold tracking-wide ${k.color}`}>{k.label}</span>
                  </div>
                )}
                {a.status === 'uploading' && (
                  <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black border border-white/25 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/50 transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              );
            })}
          </div>
        )}

        {/* Recent niches — collapsible */}
        {showRecentChips && niches?.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {niches.slice(0, 6).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setInput(`Make an explainer video for my niche: ${n.niche_name}`);
                  setShowRecentChips(false);
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

        {/* Tools — collapsible */}
        {showTools && (
          <div className="pb-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setVoxMode((v) => !v)}
                disabled={busy}
                title="Motion V1 — Vox documentary style"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  voxMode ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Motion V1</span>
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  m1Copied ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                {m1Copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium">M1</span>
              </button>
              <button
                onClick={() => setShowPrompts((s) => !s)}
                disabled={busy}
                title="Prompt library — master prompts to use in your niche"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  showPrompts ? 'border-violet-400/60 bg-violet-400/15 text-violet-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Prompts</span>
              </button>
              <button
                onClick={() => setCaptionMode((m) => (m === 'summary' ? 'tts' : 'summary'))}
                disabled={busy}
                title="Caption mode — Summary label or real TTS narration"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  captionMode === 'tts' ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <Captions className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{captionMode === 'tts' ? 'Real TTS' : 'Summary'}</span>
              </button>
              <button
                onClick={() => setSoundtrack((s) => !s)}
                disabled={busy}
                title="Background soundtrack — paste a royalty-free audio URL"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  soundtrack ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Music</span>
              </button>
              <button
                onClick={() =>
                  setMotionFx((s) => {
                    const next = !s;
                    try { localStorage.setItem('niche_motionfx', JSON.stringify(next)); } catch {}
                    return next;
                  })
                }
                disabled={busy}
                title="Motion FX — turn still scenes into moving motion graphics: eased camera moves, cutout slide entrances, parallax drift, light sweeps, particles, shake, pop and tile reveals. Off = classic Ken Burns look."
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  motionFx ? 'border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Motion FX</span>
              </button>
              <button
                onClick={() =>
                  setFramezMode((s) => {
                    const next = !s;
                    try { localStorage.setItem('niche_framez', JSON.stringify(next)); } catch {}
                    return next;
                  })
                }
                disabled={busy}
                title="Framez — render this video as a coded HTML motion film (HyperFrames style) instead of drawn scenes. Exports a real MP4."
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 ${
                  framezMode ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Framez</span>
              </button>
              <button
                onClick={() => setShowLearner(true)}
                disabled={busy}
                title="Teach me a style from a video or images"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
              >
                <Film className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Style</span>
              </button>
            </div>
            {soundtrack && (
              <input
                value={musicUrl}
                onChange={(e) => setMusicUrl(e.target.value)}
                disabled={busy}
                placeholder="Paste a direct .mp3/.wav URL (royalty-free, e.g. a Pixabay download link)"
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
              />
            )}
            {showPrompts && <NichePromptsPanel onUse={(text) => { masterPromptRef.current = text; setInput(text); inputRef.current?.focus(); }} />}
          </div>
        )}

        {/* Master-engine active banner */}
        {masterMode && (
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded-full bg-violet-400/15 border border-violet-400/40 text-violet-300 text-[11px] font-semibold">📐 Engine active</span>
            <button
              onClick={() => { setMasterMode(false); masterPromptRef.current = null; }}
              className="text-[11px] text-white/50 hover:text-white transition-colors"
            >
              Exit
            </button>
          </div>
        )}

        {/* Main compact row */}
        <div className="flex gap-2 items-center">
          {niches?.length > 0 && (
            <button
              onClick={() => setShowRecentChips((s) => !s)}
              disabled={busy}
              title="Recent niches"
              className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border transition-all disabled:opacity-40 ${
                showRecentChips ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Recent</span>
            </button>
          )}
          <button
            onClick={() => setShowTools((s) => !s)}
            disabled={busy}
            title="Tools — style, captions, music, prompts"
            className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border transition-all disabled:opacity-40 ${
              showTools ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">Tools</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            title="Attach images or files for the AI to analyze"
            className="flex items-center justify-center px-3 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,.pdf,.txt,.csv,.json,.md"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
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
            onPaste={handlePaste}
            placeholder={voxMode ? 'Motion V1 (Vox) is on — paste a topic, X link, or prompt…' : 'Paste a topic, X link, or niche — or attach a file…'}
            disabled={busy}
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={busy ? pauseBuild : () => send(input)}
            disabled={!busy && !input.trim() && attachments.length === 0}
            className={`px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-40 ${
              busy ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300 hover:bg-amber-400/30' : 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
            }`}
            aria-label={busy ? 'Pause and iterate' : 'Send'}
            title={busy ? 'Pause and iterate' : 'Send'}
          >
            {busy ? <Pause className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
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