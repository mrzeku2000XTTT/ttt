import { creditOperation, invalid, text, publicImageUrls } from '../../shared/creditOperation.ts';

const KEY = { type: 'object', properties: { t: { type: 'number' }, v: { type: 'number' } }, required: ['t', 'v'] };
const TRACK = { type: 'array', items: KEY };

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star', 'burst', 'spark', 'kite'];

const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    mode: { type: 'string', description: '"sequence" when the brief only asks for effects the library already covers — animate the scene the user has on screen and return NO layers. "scene" when the brief describes content that must be created (shapes, text, images).' },
    duration: { type: 'number' },
    preset: {
      type: 'string',
      description: 'When the brief is one interface element becoming another (a button becoming a card, a card becoming a modal, an icon becoming a button), return the id of the matching entry from PREBUILT UI MORPHS and return NO layers — the engine builds both elements and the morph between them.',
    },
    presetImage: {
      type: 'string',
      description: 'Only with "preset". A public image URL to use as the artwork of the preset\'s target element — one of the attached image URLs, or a URL the user supplied.',
    },
    presetText: {
      type: 'string',
      description: 'Only with a "preset" whose source is text (the "text-logo" preset). The exact word or short phrase the user wants carried through the morph — their brand name or the word they named in the brief. Copy it from the brief; never invent one.',
    },
    layers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ONLY to animate an existing image layer — copy its id exactly from EXISTING IMAGE LAYERS.' },
          name: { type: 'string' },
          type: { type: 'string', description: 'shape | text | image (image only for an existing layer referenced by id)' },
          shape: { type: 'string' },
          morphTo: { type: 'string' },
          color: { type: 'string' },
          text: { type: 'string' },
          size: { type: 'number' },
          keys: {
            type: 'object',
            description: 'keyframe lists per property — x, y, scale, rotation, opacity, morph',
            properties: { x: TRACK, y: TRACK, scale: TRACK, rotation: TRACK, opacity: TRACK, morph: TRACK, glow: TRACK },
          },
        },
        required: ['name'],
      },
    },
    dynamics: {
      type: 'object',
      description: 'A behavioural animation instead of hand-written keys. Use it when the brief is about HOW the motion feels — "snappier", "hit harder", "more bounce", "staggered", "magnetic". The engine bakes the spring physics into real keyframes.',
      properties: {
        motion: { type: 'string', description: 'spring | smooth | explosive | magnetic' },
        energy: { type: 'number', description: '0-100 — faster and travels further' },
        overshoot: { type: 'number', description: '0-100 — how far the spring overshoots' },
        stagger: { type: 'number', description: 'milliseconds between each layer starting' },
        randomness: { type: 'number', description: '0-40 — jitter on the entrance offsets' },
        loop: { type: 'boolean', description: 'keep hovering after the entrance' },
      },
    },
    markers: {
      type: 'array',
      description: 'Timeline markers for the beats the animation should land on.',
      items: { type: 'object', properties: { t: { type: 'number' }, label: { type: 'string' } }, required: ['t'] },
    },
    sequences: {
      type: 'array',
      description: 'Prebuilt engine sequences to chain onto the scene, in play order. Reuse these instead of hand-writing the same effects; they may be returned on their own to animate the scene the user already has.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Sequence name, exactly as listed under PREBUILT SEQUENCES.' },
          target: { type: 'string', description: 'Optional layer name to target — omit for every layer.' },
        },
        required: ['name'],
      },
    },
  },
  required: ['name', 'mode'],
};

function buildPrompt({ idea, context, imageCount, existing, catalog, presets }) {
  const lines = [
    'You are the AI director of a deterministic motion-graphics engine. Turn the brief below into a scene the engine can play.',
    '',
    `BRIEF: ${idea || '(no written brief — infer the animation from the attached material)'}`,
  ];

  if (context) {
    lines.push('', 'SOURCE MATERIAL (scraped from the link the user supplied — stay true to it, do not invent facts):', context.slice(0, 6000));
  }
  if (imageCount) {
    lines.push('', `The user attached ${imageCount} image(s). They are ALREADY in the scene as image layers — animate them by copying their id into the layer's "id" field. Do not invent replacement shapes for them.`);
  }
  if (existing && existing.length) {
    lines.push('', 'EXISTING IMAGE LAYERS:', ...existing.map((e) => `- id: ${e.id} | name: ${e.name}`));
  }

  if (catalog && catalog.length) {
    lines.push(
      '',
      'PREBUILT SEQUENCES — the engine already implements these, hand-tuned. Prefer returning them in "sequences" over hand-writing the same effect, and chain several when the brief asks for several:',
      ...catalog.map((c) => `- ${c.name} — ${c.label}: ${c.description}`),
      'When the brief is about animating the scene the user already has — "make it assemble, spin and glow" — set mode to "sequence", return those sequences, and return NO layers.',
      'When the brief is about how the motion FEELS rather than one specific effect — "snappier", "hit harder", "more bounce", "staggered", "magnetic" — return a "dynamics" object instead of new keys; the engine bakes the spring physics into keyframes.',
      'Add "markers" when the brief names beats ("land the impact on the beat") so the timeline shows where they land.',
    );
  }

  if (presets && presets.length) {
    lines.push(
      '',
      'PREBUILT UI MORPHS — one real interface element becoming another, built by the engine. When the brief is exactly that, return the matching id in "preset" and return NO layers; the engine builds both elements and the morph between them:',
      ...presets.map((p) => `- ${p.id} — ${p.label}`),
      'A UI morph is often the brief even when it is phrased loosely — "make a music button turn into an album card", "the icon should open into a panel", "turn the button into the dashboard".',
      'The "text-logo" preset is the one for words becoming a logo. Use it whenever the brief asks for that however it is worded — "make my text morph into a logo", "animate TEXT → LOGO", "my brand name should turn into the logo", "the wordmark becomes the mark", "turn this word into a logo". A word becoming a logo is this preset, never a hand-built shape scene.',
      'Whenever you return the "text-logo" preset, also return "presetText" with the exact word or short phrase from the brief, so the logo carries the user\'s own brand. Never invent a brand name, slogan or tagline: if the brief names no word, omit "presetText" and the preset keeps its own.',
      'With a preset, also return "presetImage" when the brief supplies a cover for the target element — copy one of the attached image URLs verbatim, or a URL the user wrote in the brief. Never invent or recall an image URL: no cover art, no album artwork, no stock or encyclopedia links. If the user supplied none, omit "presetImage" and the preset uses its own generated cover.',
    );
  }

  lines.push(
    '',
    'Every layer is either a "shape", a "text", or an existing "image" (by id). Animatable properties:',
    '- x: horizontal position, 0 = left edge, 1 = right edge (0.5 = centre)',
    '- y: vertical position, 0 = top, 1 = bottom',
    '- scale: size multiplier, 1 = normal',
    '- rotation: degrees, can exceed 360 for spins',
    '- opacity: 0 to 1',
    '- glow: 0 to 1, a soft halo in the layer colour',
    "- morph: 0 = the layer's \"shape\", 1 = the layer's \"morphTo\". Anything between is a real point-for-point blend, so animate it for a true morph.",
    '',
    `Shapes available: ${SHAPES.join(', ')}.`,
    '',
    'Rules:',
    '- Write keyframes as {t, v} pairs in SECONDS from 0 to the scene duration (5–8s), ordered by t.',
    '- Give every layer at least 2 keyframes on the properties that move. Layers that never change look broken.',
    '- Keep x and y between 0.05 and 0.95 so nothing leaves the frame. scale between 0.1 and 2.5.',
    '- For a morph, key "morph" from 0 to 1 across a couple of seconds.',
    '- Text layers: type "text", put the words in "text" (max 4 words), size 0.14–0.3.',
    '- Use 2–4 layers total. One clear focal element, one supporting element, optionally a title.',
    '- Colours: white #ffffff, or one accent (#ff4d4d red, #3ddc84 green, #4d8dff blue, #facc15 amber).',
    '- Think like a title designer: an entrance, a transformation, a settle. Never a static slide.',
  );

  return lines.join('\n');
}

export default async function (req) {
  return creditOperation(req, async (base44, input) => {
    const idea = text(input?.idea, 'Idea', 1200, true);
    const context = text(input?.context, 'Source material', 8000, true);
    const images = publicImageUrls(input?.images || [], 3);
    const presets = (Array.isArray(input?.presets) ? input.presets : [])
      .slice(0, 12)
      .map((p) => ({
        id: String(p?.id || '').slice(0, 40),
        label: String(p?.label || '').slice(0, 60),
      }))
      .filter((p) => p.id);
    const catalog = (Array.isArray(input?.catalog) ? input.catalog : [])
      .slice(0, 24)
      .map((c) => ({
        name: String(c?.name || '').slice(0, 40),
        label: String(c?.label || '').slice(0, 60),
        description: String(c?.description || '').slice(0, 160),
      }))
      .filter((c) => c.name);
    const existing = (Array.isArray(input?.existing) ? input.existing : [])
      .slice(0, 8)
      .filter((e) => e && typeof e.id === 'string')
      .map((e) => ({ id: e.id.slice(0, 40), name: String(e.name || 'Image').slice(0, 40) }));

    if (!idea && !context && !images.length) {
      throw invalid('Describe the animation, paste an image, or add a link.');
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt({ idea, context, imageCount: images.length, existing, catalog, presets }),
      response_json_schema: SCHEMA,
      ...(images.length ? { file_urls: images } : {}),
    });

    // Only a preset the client actually ships is honoured, so a hallucinated id
    // cannot reach the scene.
    const preset = presets.some((p) => p.id === result?.preset) ? result.preset : null;
    // A cover may only come from material the user actually supplied — an
    // attached image, or a URL they wrote in the brief. The model must never
    // invent one, so anything else falls back to the preset's own artwork.
    const supplied = new Set(images);
    for (const m of (idea || '').matchAll(/https?:\/\/[^\s<>"')]+/gi)) supplied.add(m[0]);
    const wanted = preset ? publicImageUrls(result?.presetImage ? [result.presetImage] : [], 1)[0] : null;
    const presetImage = wanted && supplied.has(wanted) ? wanted : null;
    // The word a text→logo preset should carry. Taken from the model, but only
    // ever the user's own words — never a brand it invented.
    const presetText = preset
      ? String(result?.presetText || '').replace(/\s+/g, ' ').trim().slice(0, 24)
      : '';

    return {
      scene: result || null,
      preset,
      presetImage,
      presetText,
      mode: result?.mode === 'sequence' ? 'sequence' : 'scene',
      dynamics: result?.dynamics && typeof result.dynamics === 'object' ? result.dynamics : null,
      markers: (Array.isArray(result?.markers) ? result.markers : [])
        .filter((m) => Number.isFinite(Number(m?.t)))
        .slice(0, 12)
        .map((m) => ({ t: Math.max(0, Number(m.t)), label: String(m.label || 'Marker').slice(0, 18) })),
      sequences: (Array.isArray(result?.sequences) ? result.sequences : [])
        .map((s) => ({
          name: String((typeof s === 'string' ? s : s?.name) || '').slice(0, 40),
          target: String(s?.target || '').slice(0, 60),
        }))
        .filter((s) => s.name)
        .slice(0, 8),
    };
  }, 32768);
}