import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Box, Contrast, Eye, Film, Grid3x3, Move, Sparkles, Shuffle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PALETTES, paletteById } from './glyphPalettes';
import { DITHER_ALGOS, STYLES } from './glyphStyles';
import { MOTION_PRESETS } from './spriteMotionEngine';
import { parseFilm } from './glyphFilmPlan';
import GlyphMark from './GlyphMark';
import GlyphThinking from './GlyphThinking';

const STYLE_IDS = STYLES.map((s) => s.id);
const PALETTE_IDS = PALETTES.map((p) => p.id);
const MOTION_IDS = MOTION_PRESETS.map((m) => m.id);

// The chat runs on the real Claude Opus — the strongest Claude the platform
// offers. The looks, the movements and the films are all its call, so it is
// worth the extra credits here.
const CHAT_MODEL = 'claude_opus_5';
const CHAT_MODEL_LABEL = 'opus 5';

// The renderer shelf is far too long to enumerate inside the request schema, so
// the model names a renderer in words and this maps it back onto a real style —
// a near-miss still lands instead of being dropped.
const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const STYLE_BY_KEY = new Map();
STYLES.forEach((s) => {
  STYLE_BY_KEY.set(norm(s.id), s.id);
  if (s.name) STYLE_BY_KEY.set(norm(s.name), s.id);
});
function resolveStyle(value) {
  const key = norm(value);
  if (!key) return null;
  if (STYLE_IDS.includes(value)) return value;
  if (STYLE_BY_KEY.has(key)) return STYLE_BY_KEY.get(key);
  const loose = [...STYLE_BY_KEY.keys()].find((k) => k.includes(key) || key.includes(k));
  return loose ? STYLE_BY_KEY.get(loose) : null;
}

const SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'One short sentence describing what you changed.' },
    style: { type: 'string', description: 'One renderer id from the list in the prompt, or "" to leave it alone.' },
    palette: { type: 'string', enum: [...PALETTE_IDS, ''] },
    cellSize: { type: 'number' },
    fontScale: { type: 'number' },
    spacing: { type: 'number' },
    rotation: { type: 'number' },
    brightness: { type: 'number' },
    contrast: { type: 'number' },
    saturation: { type: 'number' },
    jitter: { type: 'number' },
    ditherAlgo: { type: 'string', enum: [...DITHER_ALGOS, ''] },
    charSet: { type: 'string', enum: ['classic', 'blocks', 'minimal', 'tech', 'matrix', 'symbols', ''] },
    dotShape: { type: 'string', enum: ['circle', 'square', 'diamond', ''] },
    halftoneMode: { type: 'string', enum: ['mono', 'rgb', ''] },
    plate: { type: 'string', enum: ['auto', 'light', 'dark', ''] },
    view3d: { type: 'string', enum: ['on', 'off', ''], description: 'on tilts the artwork back in 3D, off flattens it.' },
    view: { type: 'string', enum: ['original', 'split', 'result', ''], description: 'Which way to look at the render.' },
    playing: { type: 'string', enum: ['play', 'pause', ''], description: 'Play or pause a loaded video.' },
    pose3d: {
      type: 'string',
      enum: ['random', 'stop', ''],
      description:
        'random writes and plays a brand-new random 3D move of the artwork through space, stop ends the move, "" when a 3D camera move was not mentioned.',
    },
    motion: {
      type: 'string',
      enum: [...MOTION_IDS, 'none', ''],
      description: 'The motion from the vocabulary that fits what the user asked for, "none" to stop the movement, or "" when movement was not mentioned.',
    },
    motionNote: {
      type: 'string',
      description: 'One sentence on how the subject actually moves: what leads, what follows, how the loop returns. Only with motion.',
    },
    filmTitle: {
      type: 'string',
      description: 'Two to four words naming the film. Only when the user asks for a film or an animation.',
    },
    filmBeats: {
      type: 'string',
      description:
        'The beats of the film, written as "motion:seconds:renderer:palette:CAPTION" and joined with "|". Six to nine beats, seconds 1.2-4, adding up to 10-15 seconds. Example: "float:2.2:characters:ice:THE SURFACE|spin:2.8:dots:mono:INTO CODE". Only when the user asks for a film or an animation.',
    },
  },
  required: ['reply'],
};

const LIMITS = {
  cellSize: [2, 40],
  fontScale: [0.5, 2],
  spacing: [0, 8],
  rotation: [-45, 45],
  brightness: [-70, 70],
  contrast: [0.4, 2.2],
  saturation: [0, 2],
  jitter: [0, 1],
};

const GREETING =
  'Drop an image or a video and I will rebuild it out of characters, tiles, dots or pixels. Tell me how it should look — or press Randomize.';

const QUICK = [
  { label: 'New look', icon: Shuffle, say: 'Give me a new look.' },
  { label: 'Surprise me', icon: Sparkles, say: 'Surprise me.' },
  { label: 'More contrast', icon: Contrast, say: 'More contrast please.' },
  { label: 'Smaller cells', icon: Grid3x3, say: 'Use smaller cells.' },
  { label: '3D view', icon: Box, say: 'Tilt it in 3D.' },
  { label: 'Add motion', icon: Move, say: 'Add some motion to this — gentle movement.', ask: true },
  { label: '3D move', icon: Box, say: 'Give it a random 3D move.' },
  { label: 'Craft a film', icon: Film, say: 'Craft a twelve second motion film of this — use everything you have.', ask: true },
  { label: 'Show original', icon: Eye, say: 'Show me the original.' },
];

// The quick actions answer instantly, so they rotate through a few lines — the
// same button pressed twice should never read as a copy-paste.
const QUICK_LINES = {
  'New look': [
    'New renderer, new palette — the image underneath is untouched.',
    'Swapped the whole treatment. Same pixels, different skin.',
    'Fresh look on the same picture.',
  ],
  'Surprise me': [
    'Something unusual, still built from your pixels.',
    'Took a turn nobody asked for — see if it holds.',
    'Pushed it somewhere odd on purpose.',
  ],
  'More contrast': [
    'Contrast up — the darks bite harder now.',
    'More contrast, so the structure reads at a glance.',
    'Deepened the shadows and lifted the highlights.',
  ],
  'Smaller cells': [
    'Smaller cells, so more detail survives.',
    'Tighter grid — finer detail, heavier render.',
    'Dropped the cell size; the image gets sharper.',
  ],
  '3D view': [
    'Tilted back in 3D — the 2D button in the header flattens it again.',
    'Lifted into 3D. Drag to change the angle.',
    'Now sitting in space — flatten it whenever you want.',
  ],
  '3D move': [
    'Wrote a random move and it is playing — the timeline under the artwork has the keys.',
    'New camera move: it travels, tilts and settles back home. Timeline is open.',
    'Random move running. Scrub the timeline, or press Key to keep a pose you like.',
  ],
  'Show original': [
    'Showing the source. Drag the slider to bring the render back.',
    'That is the untouched image. Slide back for the render.',
    'Source view — the render is one drag away.',
  ],
};

function pickLine(label, memory) {
  const pool = QUICK_LINES[label] || [];
  if (!pool.length) return '';
  const options = pool.filter((t) => t !== memory[label]);
  const next = options[Math.floor(Math.random() * options.length)] || pool[0];
  memory[label] = next;
  return next;
}

function buildPrompt(text, params, view3d, hasRef) {
  const current = params
    ? `style=${params.style}, palette=${params.palette}, cellSize=${params.cellSize}, fontScale=${params.fontScale}, spacing=${params.spacing}, rotation=${params.rotation}, brightness=${params.brightness}, contrast=${params.contrast}, saturation=${params.saturation}, jitter=${params.jitter}, plate=${params.plate}, ditherAlgo=${params.ditherAlgo}, charSet=${params.charSet}, view3d=${view3d ? 'on' : 'off'}`
    : 'nothing loaded yet';
  return [
    'You are GLYPH, a render assistant inside a local image-transformation studio.',
    'One image is on screen and it is rebuilt by a renderer. You change HOW it is rebuilt — never what the image is.',
    hasRef
      ? 'A reference image of the current artwork is attached. Read it: name what the subject is and which of its parts could move.'
      : '',
    `Renderers: ${STYLE_IDS.join(', ')}.`,
    `Palettes: ${PALETTE_IDS.join(', ')}.`,
    `Motion vocabulary: ${MOTION_IDS.join(', ')}.`,
    'When the user asks for movement, pick the closest motion from that vocabulary and return it in "motion", with "motionNote": one sentence, 20 words maximum, saying how the subject really moves — what leads, what follows, how the loop returns. The artwork then really moves on screen, so choose the movement that fits what you can see in it. Never invent a motion name, return "none" when they ask to stop the movement, and leave both empty when movement was not mentioned.',
    'cellSize 2-40, fontScale 0.5-2, spacing 0-8, rotation -45-45, brightness -70-70, contrast 0.4-2.2, saturation 0-2, jitter 0-1.',
    `Current settings: ${current}.`,
    'You also control the view: view3d "on" tilts the artwork back in space and "off" flattens it, view is "original" / "split" / "result" for the before-and-after comparison, and playing is "play" / "pause" for a loaded video.',
    'You also direct the camera in 3D: pose3d "random" writes a brand-new random move of the artwork through space and plays it on the timeline, and "stop" ends the move. Return "random" when they ask for a 3D move, a camera move, or movement through space — the move is generated for you, so never invent angles, positions or keyframes yourself.',
    'Set ONLY the fields that must change. Use "" for every field you want left alone.',
    'Every name you return must be copied exactly from the lists above. When the user asks for a look, palette or movement that is not on a list, choose the closest real one and say which one you chose. Never describe a change you did not return in the fields.',
    'FILMS: when the user asks for a film, an animation, a motion piece, a sequence or a video of the artwork — or asks you to craft one — return "filmTitle" and "filmBeats". A film is 10 to 15 seconds: six to nine beats, each written "motion:seconds:renderer:palette:CAPTION" and joined with "|". Seconds are 1.2 to 4 and must add up to 10-15. Renderer and palette must be copied exactly from the lists above, or left empty to keep the current look. CAPTION is two to five words in capitals with no punctuation — it is the only text on screen, so it has to carry the idea. Change the movement between beats: a film that repeats one movement is a loop, not a film. Then make "reply" one sentence about what the film does.',
    'How you talk: one or two short sentences, 32 words maximum, no lists and no markdown. Name the concrete thing you changed — the renderer, the palette, the movement — and what it does to this image. Never open with "Done", never repeat the user\'s words back, and never give a line that would fit any image.',
    `The user says: "${text}"`,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function GlyphChat({
  params,
  imageReady,
  view3d,
  onApply,
  onView,
  onRandomize,
  onSurprise,
  onMotion,
  onFilm,
  onPoseMove,
  reference,
  onClearReference,
}) {
  const [messages, setMessages] = useState([{ role: 'glyph', text: GREETING }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [refUrl, setRefUrl] = useState(null);
  const listRef = useRef(null);

  const say = (role, text) => setMessages((m) => [...m, { role, text }]);
  const lineMemory = useRef({});
  const sayLine = (label) => say('glyph', pickLine(label, lineMemory.current));

  // A reference sent from the studio is put into storage once, so every
  // following question carries the same image without re-uploading it.
  useEffect(() => {
    const url = reference?.url;
    setRefUrl(null);
    if (!url) return undefined;
    say('glyph', 'Reference attached — ask for a look, or for some motion.');
    let alive = true;
    (async () => {
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], 'glyph-reference.jpg', { type: blob.type || 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        if (alive) setRefUrl(file_url);
      } catch (e) {
        /* the thumbnail still shows — the question just goes without the image */
      }
    })();
    return () => {
      alive = false;
    };
  }, [reference?.url]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const ask = async (text) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    setInput('');
    say('user', clean);
    setThinking(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(clean, params, view3d, !!refUrl),
        response_json_schema: SCHEMA,
        model: CHAT_MODEL,
        ...(refUrl ? { file_urls: [refUrl] } : {}),
      });
      // A film is the artwork moving for 10-15 seconds, so it is handed to the
      // studio to render and play rather than described here.
      const film = parseFilm(res?.filmTitle, res?.filmBeats);
      if (film && onFilm) onFilm(film);
      const patch = {};
      const styleId = resolveStyle(res?.style);
      if (styleId) patch.style = styleId;
      if (res?.palette && PALETTE_IDS.includes(res.palette)) {
        patch.palette = res.palette;
        patch.paletteObj = paletteById(res.palette);
      }
      Object.entries(LIMITS).forEach(([key, [min, max]]) => {
        const v = Number(res?.[key]);
        if (Number.isFinite(v) && v !== 0) patch[key] = Math.min(max, Math.max(min, v));
      });
      if (res?.ditherAlgo && DITHER_ALGOS.includes(res.ditherAlgo)) patch.ditherAlgo = res.ditherAlgo;
      if (res?.charSet) patch.charSet = res.charSet;
      if (res?.dotShape) patch.dotShape = res.dotShape;
      if (res?.halftoneMode) patch.halftoneMode = res.halftoneMode;
      if (res?.plate) patch.plate = res.plate;

      const view = {};
      if (res?.view3d === 'on') view.view3d = true;
      else if (res?.view3d === 'off') view.view3d = false;
      if (res?.view && ['original', 'split', 'result'].includes(res.view)) view.view = res.view;
      if (res?.playing === 'play') view.playing = true;
      else if (res?.playing === 'pause') view.playing = false;

      // The camera move is generated in the studio, so the model only has to ask
      // for one — it never invents the angles itself.
      if (onPoseMove && (res?.pose3d === 'random' || res?.pose3d === 'stop')) onPoseMove(res.pose3d);

      if (Object.keys(patch).length) onApply(patch);
      if (Object.keys(view).length && onView) onView(view);
      // The movement is handed to the studio, which plays it on the artwork.
      if (onMotion) {
        if (res?.motion === 'none') onMotion(null);
        else if (MOTION_PRESETS.some((m) => m.id === res?.motion)) onMotion(res.motion);
      }
      const motion = MOTION_PRESETS.find((m) => m.id === res?.motion);
      setMessages((m) => [
        ...m,
        {
          role: 'glyph',
          text:
            res?.reply ||
            (Object.keys(patch).length || Object.keys(view).length
              ? 'Done — the view changed.'
              : 'Tell me which way to take it.'),
          motion: motion ? { label: motion.label, note: res?.motionNote || '' } : null,
          film: film
            ? {
                title: film.title,
                beats: film.beats.length,
                seconds: film.beats.reduce((s, b) => s + (b.seconds || 0), 0),
              }
            : null,
        },
      ]);
    } catch (e) {
      say('glyph', 'I could not reach the model just now — the quick actions below still work.');
    }
    setThinking(false);
  };

  const quick = (item) => {
    if (thinking || !imageReady) return;
    if (item.ask) {
      ask(item.say);
      return;
    }
    say('user', item.say);
    if (item.label === 'New look') {
      onRandomize();
      sayLine('New look');
    } else if (item.label === 'Surprise me') {
      onSurprise();
      sayLine('Surprise me');
    } else if (item.label === 'More contrast') {
      onApply({ contrast: Math.min(2.2, (params?.contrast || 1) + 0.3) });
      sayLine('More contrast');
    } else if (item.label === 'Smaller cells') {
      onApply({ cellSize: Math.max(2, Math.round((params?.cellSize || 12) * 0.7)) });
      sayLine('Smaller cells');
    } else if (item.label === '3D view') {
      onView({ view3d: true });
      sayLine('3D view');
    } else if (item.label === '3D move') {
      onPoseMove?.('random');
      sayLine('3D move');
    } else {
      onView({ view: 'original' });
      sayLine('Show original');
    }
  };

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2.5 pb-3 mb-1" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <GlyphMark size={30} spinning={thinking} />
        <div className="min-w-0 flex-1">
          <p className="glyph-word flex items-center gap-1.5 text-[11px]">
            Glyph
            <span className="glyph-mono text-[8px] uppercase tracking-[0.14em] glyph-muted">{CHAT_MODEL_LABEL}</span>
          </p>
          <p className="glyph-muted text-[10px] truncate">
            {thinking ? 'rendering an answer…' : imageReady ? 'ask for a look' : 'waiting for an image'}
          </p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[86%]">
              <p
                className={`break-words rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                  m.role === 'user' ? 'text-[#04202f]' : 'glyph-pill'
                }`}
                style={m.role === 'user' ? { background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' } : undefined}
              >
                {m.text}
              </p>
              {m.motion && (
                <div className="glyph-pill mt-1 rounded-xl px-2.5 py-2">
                  <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] glyph-muted">
                    <Move className="h-3 w-3" /> motion read
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold">{m.motion.label}</p>
                  {m.motion.note && (
                    <p className="mt-0.5 text-[11px] leading-relaxed glyph-muted">{m.motion.note}</p>
                  )}
                </div>
              )}
              {m.film && (
                <div className="glyph-pill mt-1 rounded-xl px-2.5 py-2">
                  <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] glyph-muted">
                    <Film className="h-3 w-3" /> motion film
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold">{m.film.title}</p>
                  <p className="mt-0.5 text-[11px] glyph-muted">
                    {m.film.beats} beats · {m.film.seconds.toFixed(1)}s · playing on the artwork
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <GlyphThinking size={58} count={13} isThinking showLabel thinkingLabel="rebuilding…" />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => quick(q)}
            disabled={thinking || !imageReady}
            title={q.label}
            className="glyph-pill shrink-0 rounded-full px-2 py-[3px] text-[9px] uppercase tracking-[0.06em] disabled:opacity-40"
          >
            {q.label}
          </button>
        ))}
      </div>

      {reference && (
        <div
          className="mb-2 flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5"
          style={{ border: '1px solid var(--g-line)' }}
        >
          <img src={reference.url} alt="reference" className="h-9 w-9 shrink-0 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.14em] glyph-muted">reference</p>
            <p className="truncate text-[11px]" style={{ color: 'var(--g-ink)' }}>
              {refUrl ? 'the agent can see this' : 'preparing…'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearReference}
            className="glyph-pill flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            title="Remove the reference"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex shrink-0 items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          placeholder={
            !imageReady
              ? 'Load an image first'
              : reference
                ? 'Add some motion…'
                : 'Make it look like newsprint…'
          }
          disabled={!imageReady}
          className="flex-1 resize-none rounded-xl px-3 py-2 text-[12px] glyph-mono"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--g-line)',
            color: 'var(--g-ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!imageReady || thinking || !input.trim()}
          className="glyph-btn glyph-btn-primary h-9 w-9 p-0 disabled:opacity-40"
          title="Send"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}