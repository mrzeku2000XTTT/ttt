// Natural language → a structured transition request.
//
// The AI never edits objects directly. A sentence becomes options for the
// planner, which becomes a plan, which becomes keyframes. Same path either way,
// so a hand-typed sentence and a machine-issued one behave identically.

const TYPE_WORDS = [
  [/mask|reveal|window|open(s)? up/, 'mask'],
  [/zoom through|camera|fly (in|into)|enter(ing)? the (next|new)|through the/, 'camera'],
  [/rotat|spin|turn (it|the)/, 'rotation'],
  [/color|colour|palette/, 'color'],
  [/shape|silhouette|morph/, 'shape'],
  [/expand|grow|scale|bigger|larger/, 'scale'],
  [/position|same (spot|place)|aligned/, 'position'],
  [/compound|everything|all of it|seamless transition|visual continuity/, 'compound'],
];

const PRESET_WORDS = [
  [/premium|apple|polished|luxury/, 'ui'],
  [/saas|product animation|startup/, 'ui'],
  [/fast|quick|snappy|tight/, 'fast'],
  [/clean|simple|subtle|minimal/, 'clean'],
  [/smooth|gentle|soft/, 'smooth'],
  [/zoom through|through the/, 'zoom'],
  [/logo|brand reveal/, 'logo'],
  [/card expansion|card expand|card grow/, 'card'],
  [/icon to interface|icon into interface/, 'icon-ui'],
  [/image to ui|photo into|picture into/, 'image-ui'],
  [/text to object|words into/, 'text-object'],
  [/object to scene|into the scene|enter the scene/, 'object-scene'],
];

const ROLE_WORDS = {
  circle: 'circle', round: 'circle', dot: 'circle',
  avatar: 'avatar', profile: 'avatar',
  logo: 'logo', brand: 'logo', mark: 'logo',
  icon: 'icon', glyph: 'icon', badge: 'icon',
  button: 'button', btn: 'button', cta: 'button',
  card: 'card', tile: 'card', album: 'card', cover: 'card', thumbnail: 'card',
  dashboard: 'device', screen: 'device', panel: 'device', interface: 'device', ui: 'device', console: 'device',
  image: 'image', photo: 'image', picture: 'image',
  text: 'text', title: 'text', caption: 'text', heading: 'text',
  chart: 'graph', graph: 'graph', metric: 'graph',
  background: 'background', backdrop: 'background',
  cursor: 'cursor', pointer: 'cursor',
  square: 'rectangle', rectangle: 'rectangle', rect: 'rectangle', box: 'rectangle',
};

const lastIndexOfAny = (text, words) => {
  let best = -1;
  let hit = null;
  words.forEach(([re, value]) => {
    const m = re.exec(text);
    if (m && m.index > best) {
      best = m.index;
      hit = value;
    }
  });
  return hit ? { index: best, value: hit } : null;
};

// "match cut the circle into the avatar" → the word before "into" is the source,
// the word after it is the target.
function namedObjects(text) {
  const m = /\b(?:into|to|becomes?|becoming|as)\b/.exec(text);
  if (!m) return { source: null, target: null };
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + m[0].length);
  const roleIn = (s) => {
    const words = s.split(/[^a-z]+/).filter(Boolean).reverse();
    for (const w of words) if (ROLE_WORDS[w]) return ROLE_WORDS[w];
    return null;
  };
  return { source: roleIn(before), target: roleIn(after) };
}

/**
 * Read a sentence against the objects actually available in the two scenes.
 * Returns planner options, or null when there is nothing usable to act on.
 */
export function parseTransitionCommand(text, context = {}) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const t = raw.toLowerCase();
  const anchorsA = context.anchorsA || [];
  const anchorsB = context.anchorsB || [];
  const candidates = context.candidates || [];

  const byRole = (list, role) => list.find((a) => a.semanticRole === role) || list.find((a) => a.shape === role) || null;

  const named = namedObjects(t);
  const options = {};
  const understood = [];

  let source = named.source ? byRole(anchorsA, named.source) : null;
  let target = named.target ? byRole(anchorsB, named.target) : null;

  // "use the logo as the bridge between these scenes"
  if (!target && /\b(bridge|hero|anchor)\b/.test(t)) {
    const bridgeRole = Object.entries(ROLE_WORDS).find(([w]) => t.includes(w))?.[1];
    const hero = bridgeRole ? byRole(anchorsA, bridgeRole) : null;
    const candidate = hero ? candidates.find((c) => c.source === hero.id) : candidates[0];
    if (candidate) {
      source = hero || anchorsA.find((a) => a.id === candidate.source);
      target = anchorsB.find((a) => a.id === candidate.target);
      understood.push('hero object held across the cut');
    }
  }

  // "make the first card expand into the second scene"
  if (!source && /\b(first|source|scene a)\b/.test(t) && anchorsA.length) source = anchorsA[0];
  if (!target && /\b(second|next|scene b)\b/.test(t) && anchorsB.length) target = anchorsB[0];

  const type = lastIndexOfAny(t, TYPE_WORDS)?.value;
  const preset = lastIndexOfAny(t, PRESET_WORDS)?.value;
  const wantsAuto = /\b(find|best|auto|detect|figure out)\b/.test(t);

  if (source) options.source = source.id;
  if (target) options.target = target.id;
  if (type) options.type = type;
  if (preset) options.preset = preset;
  if (/\bfast\b|\bquick\b|\bsnappy\b/.test(t)) options.duration = 0.45;
  if (/\bslow\b|\bcinematic\b|\bpremium\b/.test(t) && !preset) options.duration = 1.6;
  if (/\bno camera\b|\bwithout (a )?camera\b/.test(t)) options.camera = false;
  if (/\bzoom\b/.test(t) && !/no zoom/.test(t)) options.camera = true;
  if (/\bmask\b|\breveal\b/.test(t)) options.mask = true;

  if (source && target) understood.push(`"${source.name}" becomes "${target.name}"`);
  else if (wantsAuto || !source || !target) understood.push('auto-matched the best visual pair');

  return { options, understood, text: raw };
}

export const COMMAND_EXAMPLES = [
  'Match cut the circle into the avatar.',
  'Turn the button into the dashboard.',
  'Use the logo as the bridge between these scenes.',
  'Make the first card expand into the second scene.',
  'Find the best visual match between these two scenes.',
  'Create a seamless transition.',
  'Use a fast match cut.',
  'Make it feel like a premium SaaS product animation.',
];