// Deterministic, local prompt enhancer for the Blueprint generator.
// Amplifies a plain user prompt into a premium + motion-rich ("motionsites")
// design directive WITHOUT an extra LLM round-trip (keeps generation fast).
// The user's actual product/content intent is preserved exactly.

export function enhancePrompt(rawPrompt, { concept } = {}) {
  const raw = (rawPrompt || '').trim();
  const lower = raw.toLowerCase();

  const hasExplicitStyle = /\b(apple|mac\s?os|macos|minimal|minimalist|dark|light|brutalist|glass|glassmorphism|neon|pastel|gradient|monochrome|retro|vintage|playful|corporate|web3|crypto|noir|editorial|aurora)\b/.test(lower);

  const styleDirection = hasExplicitStyle
    ? 'Honor the explicit visual style the user named. Keep it world-class, polished and motion-rich within that style.'
    : 'Apple/macOS-inspired, minimalist, light background, near-black ink, one tasteful vibrant accent, generous whitespace.';

  const intent = raw
    || (concept?.name
      ? `A landing page for ${concept.name}${concept?.one_liner ? ' — ' + concept.one_liner : ''}`
      : 'A premium product landing page');

  return [
    'USER INTENT (the product/content the user actually wants — preserve this exactly; do not change what it is or does):',
    intent,
    '',
    'DESIGN AMPLIFICATION (apply on top of the intent; never override what the product IS):',
    '- Visual direction: ' + styleDirection,
    '- Deliver a world-class, absolutely premium UI — the kind that wins Awwwards. Production-grade polish, not a template.',
    '- MotionSites: rich, tasteful motion — scroll-reveal entrances, animated gradient/aurora backgrounds, floating elements, a logo marquee, hover micro-interactions, lift on hover. Use the host "reveal", "reveal-delay-*", "marquee" and "animate-float" classes for motion.',
    '- Even if the prompt is plain, the result must look like a top studio designed it — while still being exactly the product the user described.'
  ].join('\n');
}