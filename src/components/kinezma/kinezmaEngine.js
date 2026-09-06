import { base44 } from '@/api/base44Client';

// Kinezma engine — turns one image into a component scene, and chat into
// keyframed motion. Components are either editable elements (text/box) or
// cutouts cropped straight from the source image (photos, illustrations).

export const DEFAULT_STATE = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
export const EASES = ['linear', 'inCubic', 'outCubic', 'inOutCubic', 'outBack', 'outElastic', 'outBounce'];

const EASE_FN = {
  linear: (t) => t,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; },
  outBounce: (t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; return n1 * (t -= 2.625 / d1) * t + 0.984375; },
};

export const loadImage = (url) => new Promise((res, rej) => {
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => res(im);
  im.onerror = () => rej(new Error('Could not load image'));
  im.src = url;
});

export const SCENE_SCHEMA = {
  type: 'object',
  properties: {
    scene: {
      type: 'object',
      properties: {
        width: { type: 'number' },
        height: { type: 'number' },
        background: { type: 'string' }
      },
      required: ['width', 'height', 'background']
    },
    components: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          kind: { type: 'string', enum: ['text', 'box', 'cutout'] },
          x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' },
          z: { type: 'number' },
          text: { type: 'string' },
          fontSize: { type: 'number' },
          fontWeight: { type: 'string' },
          fontFamily: { type: 'string' },
          color: { type: 'string' },
          bg: { type: 'string' },
          radius: { type: 'number' },
          border: { type: 'string' },
          align: { type: 'string', enum: ['center', 'left'] }
        },
        required: ['id', 'name', 'kind', 'x', 'y', 'w', 'h']
      }
    }
  },
  required: ['scene', 'components']
};

export const MOTION_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    duration: { type: 'number' },
    loop: { type: 'boolean' },
    edits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          component: { type: 'string' },
          text: { type: 'string' },
          color: { type: 'string' },
          bg: { type: 'string' },
          fontSize: { type: 'number' }
        }
      }
    },
    tracks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          component: { type: 'string' },
          keyframes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                t: { type: 'number' },
                x: { type: 'number' }, y: { type: 'number' },
                scale: { type: 'number' }, rotate: { type: 'number' },
                opacity: { type: 'number' },
                ease: { type: 'string', enum: EASES }
              },
              required: ['t']
            }
          }
        },
        required: ['component', 'keyframes']
      }
    }
  },
  required: ['reply', 'duration', 'tracks']
};

const decomposePrompt = (W, H) => `You are Kinezma's vision engine. Break the attached image into its movable components so each can be animated independently in a motion-graphics scene.

The scene coordinate space is EXACTLY ${W} x ${H} pixels — the image scaled to fit this canvas. Origin top-left. Every rect you return is in these scene pixels.

Rules:
- Cover the WHOLE image: every visible element belongs to exactly one component. The base background layer comes first (kind "box", z 0, covering the full canvas with its average color).
- kind "cutout": photographic, organic or complex regions that cannot be flat text or a solid box — people, characters, illustrations, product photos, detailed art. Its rect crops that exact region from the source image, so make it tight but complete.
- kind "text": any readable text — set text to the exact words, fontSize to fill the rect height, color to the text's color, bg only if it sits on a colored chip/pill, align "left" if the text starts at the rect's left edge, else "center".
- kind "box": flat solid shapes — banners, circles, cards, pills (bg = its color, radius in px if rounded).
- Use 4 to 14 components total. Give each a short name and a unique id "c1", "c2", ...
- Rects must tile the image tightly (adjacent, no gaps) unless the image truly has empty space.
- Extract real colors as hex from the image itself.`;

export async function decomposeImage({ imageUrl, width, height }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: decomposePrompt(width, height),
    file_urls: [imageUrl],
    response_json_schema: SCENE_SCHEMA
  });
  const scene = {
    width: res.scene?.width || width,
    height: res.scene?.height || height,
    background: res.scene?.background || '#ffffff',
    components: []
  };
  const seen = new Set();
  (res.components || []).forEach((c, i) => {
    if (!c || !c.w || !c.h || !['text', 'box', 'cutout'].includes(c.kind)) return;
    let id = c.id || `c${i + 1}`;
    while (seen.has(id)) id = id + 'x';
    seen.add(id);
    scene.components.push({
      ...c,
      id,
      name: c.name || id,
      z: typeof c.z === 'number' ? c.z : i,
      x: Math.max(-c.w, Math.min(scene.width, c.x)),
      y: Math.max(-c.h, Math.min(scene.height, c.y))
    });
  });
  if (!scene.components.length) throw new Error('Could not split this image — try a clearer one.');
  return scene;
}

// Crop every cutout component out of the source image, client-side.
export async function buildCutouts(imageUrl, scene) {
  const img = await loadImage(imageUrl);
  const out = {};
  for (const c of scene.components) {
    if (c.kind !== 'cutout') continue;
    const sx = (c.x / scene.width) * img.naturalWidth;
    const sy = (c.y / scene.height) * img.naturalHeight;
    const sw = Math.max(1, (c.w / scene.width) * img.naturalWidth);
    const sh = Math.max(1, (c.h / scene.height) * img.naturalHeight);
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(sw));
    cv.height = Math.max(1, Math.round(sh));
    cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    out[c.id] = cv.toDataURL('image/png');
  }
  return out;
}

const normalizeKfs = (kfs) => {
  const sorted = (kfs || []).slice().sort((a, b) => a.t - b.t);
  let prev = { ...DEFAULT_STATE };
  return sorted.map((k) => {
    prev = {
      x: k.x ?? prev.x,
      y: k.y ?? prev.y,
      scale: k.scale ?? prev.scale,
      rotate: k.rotate ?? prev.rotate,
      opacity: k.opacity ?? prev.opacity
    };
    return { t: k.t, state: prev, ease: k.ease };
  });
};

// Interpolated state for every tracked component at time `t` (seconds).
export function stateAt(tracks, time) {
  const out = {};
  for (const tr of tracks || []) {
    const kfs = normalizeKfs(tr.keyframes);
    if (!kfs.length) continue;
    if (time <= kfs[0].t) { out[tr.component] = { ...kfs[0].state }; continue; }
    const afterIdx = kfs.findIndex((k) => k.t >= time);
    if (afterIdx === -1) { out[tr.component] = { ...kfs[kfs.length - 1].state }; continue; }
    const before = kfs[afterIdx - 1] || kfs[0];
    const after = kfs[afterIdx];
    const span = after.t - before.t;
    const p = span <= 0 ? 1 : Math.min(1, Math.max(0, (time - before.t) / span));
    const ease = EASE_FN[after.ease] || EASE_FN.linear;
    const ep = ease(p);
    out[tr.component] = {
      x: before.state.x + (after.state.x - before.state.x) * ep,
      y: before.state.y + (after.state.y - before.state.y) * ep,
      scale: before.state.scale + (after.state.scale - before.state.scale) * ep,
      rotate: before.state.rotate + (after.state.rotate - before.state.rotate) * ep,
      opacity: before.state.opacity + (after.state.opacity - before.state.opacity) * ep
    };
  }
  return out;
}

export async function motionFromChat({ request, scene, currentMotion }) {
  const comps = scene.components
    .map((c) => `${c.id} — ${c.name} (${c.kind}${c.text ? `, text "${c.text}"` : ''}; ${Math.round(c.w)}x${Math.round(c.h)} at ${Math.round(c.x)},${Math.round(c.y)})`)
    .join('\n');
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are Kinezma's motion director. Kinezma animates the components of an image the user uploaded — they describe what should move, you write the keyframes.

COMPONENTS (ids are sacred — a keyframe track only works on one of these ids):
${comps}
${currentMotion ? `\nCURRENT MOTION (iterate on it when the user asks for changes — "slower", "less bouncy" etc. — keep what they liked, adjust what they named):\n${JSON.stringify(currentMotion)}` : ''}

USER REQUEST: """${request}"""

Produce keyframe tracks:
- t is seconds from start (0 to duration). Each keyframe may set ANY of: x / y (px offset from the component's base position), scale (1 = original size), rotate (degrees), opacity (0–1), ease (one of ${EASES.join(', ')} — ease describes the segment ARRIVING at that keyframe).
- Properties omitted from a keyframe hold their previous value. The first keyframe (usually t 0) sets the start state; the last keyframe should settle the component at rest (x 0, y 0, scale 1, rotate 0, opacity 1) unless the motion loops or the user wants a held pose.
- Use 2–5 purposeful keyframes per component. Only give tracks to components that actually move — leave static ones out entirely.
- duration: 2–8 seconds (default 4). loop: true only when the motion reads as seamless.
- If the user asks to change a component's CONTENT (text, color, size), also return "edits". Motion is the main job — never refuse motion work.
- "reply": one short sentence describing the motion you set up.`,
    response_json_schema: MOTION_SCHEMA
  });
  const ids = new Set(scene.components.map((c) => c.id));
  const tracks = (res.tracks || []).filter(
    (t) => ids.has(t.component) && Array.isArray(t.keyframes) && t.keyframes.length
  );
  const edits = (res.edits || []).filter((e) => ids.has(e.component));
  return {
    reply: res.reply || 'Motion set.',
    duration: Math.max(1, Math.min(10, res.duration || 4)),
    loop: !!res.loop,
    tracks,
    edits
  };
}