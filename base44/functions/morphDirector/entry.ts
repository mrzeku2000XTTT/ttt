import { creditOperation, invalid, text, publicImageUrls } from '../../shared/creditOperation.ts';

const KEY = { type: 'object', properties: { t: { type: 'number' }, v: { type: 'number' } }, required: ['t', 'v'] };
const TRACK = { type: 'array', items: KEY };

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star', 'burst'];

const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    duration: { type: 'number' },
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
            properties: { x: TRACK, y: TRACK, scale: TRACK, rotation: TRACK, opacity: TRACK, morph: TRACK },
          },
        },
        required: ['name', 'keys'],
      },
    },
  },
  required: ['name', 'duration', 'layers'],
};

function buildPrompt({ idea, context, imageCount, existing }) {
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

  lines.push(
    '',
    'Every layer is either a "shape", a "text", or an existing "image" (by id). Animatable properties:',
    '- x: horizontal position, 0 = left edge, 1 = right edge (0.5 = centre)',
    '- y: vertical position, 0 = top, 1 = bottom',
    '- scale: size multiplier, 1 = normal',
    '- rotation: degrees, can exceed 360 for spins',
    '- opacity: 0 to 1',
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
    const existing = (Array.isArray(input?.existing) ? input.existing : [])
      .slice(0, 8)
      .filter((e) => e && typeof e.id === 'string')
      .map((e) => ({ id: e.id.slice(0, 40), name: String(e.name || 'Image').slice(0, 40) }));

    if (!idea && !context && !images.length) {
      throw invalid('Describe the animation, paste an image, or add a link.');
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt({ idea, context, imageCount: images.length, existing }),
      response_json_schema: SCHEMA,
      ...(images.length ? { file_urls: images } : {}),
    });

    return { scene: result || null };
  }, 32768);
}