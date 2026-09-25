import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const ANIMATIONS = ['motion-text', 'oversize-rise', 'left-sweep', 'soft-fade', 'fade-up-words'];
const EASINGS = ['easeInOutCubic', 'easeOutExpo', 'easeOutCubic', 'easeInOutSine', 'easeOutBack', 'linear'];
const GRADIENTS = ['still', 'sweep', 'pulse'];
const MOTIONS = ['mesh', 'sweep', 'still'];
const FONTS = ['SF Pro Display', 'Helvetica Regular', 'Inter', 'Space Grotesk', 'Syncopate', 'Fraunces', 'Georgia'];
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

const SCHEMA = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'One short sentence, in plain language, telling the user what you changed. Never mention field names, keys or JSON.',
    },
    patch: {
      type: 'object',
      description: 'ONLY the settings that must change. Anything you leave out stays exactly as it is.',
      properties: {
        text: { type: 'string', description: 'The words on screen, max 200 characters. ONLY when the user asks for different words — never echo the current text back.' },
        fontSize: { type: 'number', description: '24 to 900. Bigger or smaller type.' },
        fontFamily: { type: 'string', description: FONTS.join(' | ') },
        weight: { type: 'number', description: '300 to 900 — how bold the type is.' },
        textColors: { type: 'array', items: { type: 'string' }, description: "Exactly 3 six-digit hex colours — the type's own gradient, first where it starts, third where it ends." },
        gradientAnimation: { type: 'string', description: GRADIENTS.join(' | ') },
        animation: { type: 'string', description: ANIMATIONS.join(' | ') },
        easing: { type: 'string', description: EASINGS.join(' | ') },
        speed: { type: 'number', description: '0.1 to 4 — how long the entrance takes.' },
        slideSpeed: { type: 'number', description: '0.1 to 4 — how fast the type slides to its offset.' },
        slideStart: { type: 'number', description: '-2000 to 2000 — the horizontal offset the type starts at.' },
        slideEnd: { type: 'number', description: '-2000 to 2000 — the horizontal offset the type settles at. Negative is left.' },
        duration: { type: 'number', description: '1 to 20 — the scene length in seconds.' },
        glow: {
          type: 'object',
          properties: {
            on: { type: 'boolean' },
            color: { type: 'string' },
            intensity: { type: 'number', description: '0 to 1' },
            dissolve: { type: 'number', description: '0.5 to 20 — seconds until the glow fades out.' },
          },
        },
        background: {
          type: 'object',
          properties: {
            colors: { type: 'array', items: { type: 'string' }, description: 'Exactly 3 six-digit hex colours for the backdrop.' },
            motion: { type: 'string', description: MOTIONS.join(' | ') },
            speed: { type: 'number', description: '0 to 3' },
          },
        },
        matchCut: {
          type: 'object',
          properties: {
            on: { type: 'boolean' },
            direction: { type: 'string', description: 'left | right' },
          },
        },
        words: {
          type: 'object',
          description: 'Only meaningful for the FadeUpWords animation — the word and sentence timing, counted in frames.',
          properties: {
            fadeDuration: { type: 'number', description: '1 to 300 frames for one word to fade in' },
            stagger: { type: 'number', description: '0 to 60 frames between words' },
            holdDuration: { type: 'number', description: '0 to 300 frames a sentence holds after its last word' },
            fadeOutDuration: { type: 'number', description: '0 to 300 frames for a sentence to fade out' },
            sentenceDelay: { type: 'number', description: '0 to 300 frames between sentences' },
            distance: { type: 'number', description: '0 to 1200 — how far each word travels in' },
            direction: { type: 'string', description: 'up | down | left | right' },
            blurOn: { type: 'boolean' },
            blur: { type: 'number', description: '0 to 80 px of blur at the start of each word' },
            drift: { type: 'boolean' },
          },
        },
      },
    },
  },
  required: ['reply', 'patch'],
};

function buildPrompt(scene, prompt, history) {
  const lines = [
    'You are the director of Lumifly, a text-animation studio. You change the settings of ONE scene so it matches what the user asks for.',
    '',
    `CURRENT SCENE: ${JSON.stringify(scene).slice(0, 3000)}`,
  ];

  if (history.length) {
    lines.push('', 'EARLIER IN THIS SESSION:');
    history.forEach((h) => lines.push(`${h.role === 'user' ? 'user' : 'you'}: ${String(h.content).slice(0, 200)}`));
  }

  lines.push(
    '',
    `INSTRUCTION: ${prompt}`,
    '',
    'TEXT ANIMATIONS — how the words arrive:',
    '- motion-text: type rises on an eased slide and settles',
    '- oversize-rise: huge tight-cropped type settles in with an eased rise and slow push',
    '- left-sweep: type slides in from the left and drifts to rest',
    '- soft-fade: type eases up from below into a gentle fade-in',
    '- fade-up-words: each word rises and fades in, staggered behind the one before it',
    '',
    `EASINGS: ${EASINGS.join(', ')}`,
    `TYPE GRADIENT ANIMATION: ${GRADIENTS.join(' | ')} — still, a sweeping rotation, or a breathing pulse`,
    `BACKGROUND MOTION: ${MOTIONS.join(' | ')} — mesh drift, aurora sweep, or still`,
    `FONTS: ${FONTS.join(', ')}`,
    `FONT WEIGHTS: ${WEIGHTS.join(', ')}`,
    '',
    'Rules:',
    '- Return only the settings that must change in "patch" — never echo a setting back at its current value, and never return a field you are not changing. Everything you leave out keeps its current value.',
    '- A vague instruction still deserves a real change, but only on the aspect it names: "make it pop" means a bigger font size, a bolder weight or a glow; "more premium" means a slower ease, softer colours and a subtler backdrop. Never change an aspect the instruction does not name.',
    '- Return the smallest patch that satisfies the instruction. If the instruction names only the word timing, the patch contains only "words".',
    '- Colours are always six-digit hex, like #ffd9b3. textColors and background.colors each need exactly 3 of them.',
    '- Never invent an animation, easing, motion or font id — use only the ones listed above.',
    '- Change only what the instruction is about. This is one scene being tuned, not a rewrite.',
    '- If the instruction is about timing, animation or colour, return ONLY those fields. Never touch the words, the glow, the background or the match cut unless the instruction names them — echoing a setting back, even at the same value, is a change you did not ask for.',
    '- Never return "text" unless the user asked for different words.',
    '- "words" only applies to the FadeUpWords animation: it sets how long one word takes to fade in, the gap between words, how long a sentence holds and fades out, the gap between sentences, how far each word travels in, its direction, its blur-in, and whether the type keeps drifting. Those numbers are frames, not seconds.',
    '- "reply" is one short sentence in the user\'s own words — say what changed, not which setting you edited.',
  );

  return lines.join('\n');
}

function sanitize(raw) {
  const patch = {};
  if (!raw || typeof raw !== 'object') return patch;

  const num = (v, lo, hi) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
  };
  const hex = (v) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : null);
  const pick = (v, list) => (list.includes(String(v)) ? String(v) : null);
  const triple = (v) => {
    if (!Array.isArray(v)) return null;
    const colors = v.slice(0, 3).map(hex);
    return colors.length === 3 && colors.every(Boolean) ? colors : null;
  };

  if (typeof raw.text === 'string') {
    const text = raw.text.replace(/\s+/g, ' ').trim().slice(0, 200);
    if (text) patch.text = text;
  }

  const fontSize = num(raw.fontSize, 24, 900);
  if (fontSize !== null) patch.fontSize = fontSize;
  const fontFamily = pick(raw.fontFamily, FONTS);
  if (fontFamily) patch.fontFamily = fontFamily;
  const weight = num(raw.weight, 100, 900);
  if (weight !== null) patch.weight = WEIGHTS.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), 700);
  const textColors = triple(raw.textColors);
  if (textColors) patch.textColors = textColors;
  const gradientAnimation = pick(raw.gradientAnimation, GRADIENTS);
  if (gradientAnimation) patch.gradientAnimation = gradientAnimation;
  const animation = pick(raw.animation, ANIMATIONS);
  if (animation) patch.animation = animation;
  const easing = pick(raw.easing, EASINGS);
  if (easing) patch.easing = easing;
  const speed = num(raw.speed, 0.1, 4);
  if (speed !== null) patch.speed = speed;
  const slideSpeed = num(raw.slideSpeed, 0.1, 4);
  if (slideSpeed !== null) patch.slideSpeed = slideSpeed;
  const slideStart = num(raw.slideStart, -2000, 2000);
  if (slideStart !== null) patch.slideStart = slideStart;
  const slideEnd = num(raw.slideEnd, -2000, 2000);
  if (slideEnd !== null) patch.slideEnd = slideEnd;
  const duration = num(raw.duration, 1, 20);
  if (duration !== null) patch.duration = duration;

  if (raw.glow && typeof raw.glow === 'object') {
    const glow = {};
    if (typeof raw.glow.on === 'boolean') glow.on = raw.glow.on;
    const color = hex(raw.glow.color);
    if (color) glow.color = color;
    const intensity = num(raw.glow.intensity, 0, 1);
    if (intensity !== null) glow.intensity = intensity;
    const dissolve = num(raw.glow.dissolve, 0.5, 20);
    if (dissolve !== null) glow.dissolve = dissolve;
    if (Object.keys(glow).length) patch.glow = glow;
  }

  if (raw.background && typeof raw.background === 'object') {
    const background = {};
    const colors = triple(raw.background.colors);
    if (colors) background.colors = colors;
    const motion = pick(raw.background.motion, MOTIONS);
    if (motion) background.motion = motion;
    const bgSpeed = num(raw.background.speed, 0, 3);
    if (bgSpeed !== null) background.speed = bgSpeed;
    if (Object.keys(background).length) patch.background = background;
  }

  if (raw.words && typeof raw.words === 'object') {
    const words = {};
    const fadeDuration = num(raw.words.fadeDuration, 1, 300);
    if (fadeDuration !== null) words.fadeDuration = fadeDuration;
    const stagger = num(raw.words.stagger, 0, 60);
    if (stagger !== null) words.stagger = stagger;
    const holdDuration = num(raw.words.holdDuration, 0, 300);
    if (holdDuration !== null) words.holdDuration = holdDuration;
    const fadeOutDuration = num(raw.words.fadeOutDuration, 0, 300);
    if (fadeOutDuration !== null) words.fadeOutDuration = fadeOutDuration;
    const sentenceDelay = num(raw.words.sentenceDelay, 0, 300);
    if (sentenceDelay !== null) words.sentenceDelay = sentenceDelay;
    const distance = num(raw.words.distance, 0, 1200);
    if (distance !== null) words.distance = distance;
    const direction = pick(raw.words.direction, ['up', 'down', 'left', 'right']);
    if (direction) words.direction = direction;
    if (typeof raw.words.blurOn === 'boolean') words.blurOn = raw.words.blurOn;
    const blur = num(raw.words.blur, 0, 80);
    if (blur !== null) words.blur = blur;
    if (typeof raw.words.drift === 'boolean') words.drift = raw.words.drift;
    if (Object.keys(words).length) patch.words = words;
  }

  if (raw.matchCut && typeof raw.matchCut === 'object') {
    const matchCut = {};
    if (typeof raw.matchCut.on === 'boolean') matchCut.on = raw.matchCut.on;
    const direction = pick(raw.matchCut.direction, ['left', 'right']);
    if (direction) matchCut.direction = direction;
    if (Object.keys(matchCut).length) patch.matchCut = matchCut;
  }

  return patch;
}

function unchanged(a: any, b: any): boolean {
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    for (const key of keys) {
      if (!unchanged(a[key], b[key])) return false;
    }
    return true;
  }
  return a === b;
}

/** Drops anything the model echoed back at its current value. */
function stripUnchanged(patch: any, scene: any): any {
  const out: any = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (unchanged(value, scene?.[key])) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sub: any = {};
      for (const [inner, innerValue] of Object.entries(value)) {
        if (!unchanged(innerValue, scene?.[key]?.[inner])) sub[inner] = innerValue;
      }
      if (Object.keys(sub).length) out[key] = sub;
      continue;
    }
    out[key] = value;
  }
  return out;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400);
    if (!prompt) return Response.json({ error: 'Describe the change you want.' }, { status: 400 });

    const scene = body?.scene && typeof body.scene === 'object' ? body.scene : {};
    const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(scene, prompt, history),
      response_json_schema: SCHEMA,
    });

    // Only values the studio actually ships are honoured, so a hallucinated id
    // or an out-of-range number can never reach the scene.
    const patch = stripUnchanged(sanitize(result?.patch), scene);
    const reply = String(result?.reply || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    return Response.json({ reply: reply || 'Updated the scene.', patch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}