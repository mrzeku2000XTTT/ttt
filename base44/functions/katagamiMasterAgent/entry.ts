import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Katagami Master Motion-Ad Agent
// Single endpoint that runs ONE step at a time of a self-improving motion-ad
// pipeline. The frontend calls it repeatedly with the running `state`, so the
// chat UI can stream every thought / search / critique to the user.
//
// Steps:
//   research             — websearch motion ad references for the vibe
//   analyze_media        — vision-pass on the uploaded media (subject, mood, palette)
//   plan                 — design v1 motion plan (preset, camera, tagline, bg, duration)
//   choreograph_setup    — copywriter drafts ALL beat lines (returns script_lines + plan)
//   choreograph_beat     — ONE sub-agent designs ONE beat (called repeatedly by frontend
//                          with `beat_index` and the running `segments` array, so the
//                          UI can render each beat live and the user can adjust speed)
//   choreograph_finalize — assemble segments[] into a `choreograph` output blob
//   sequence             — global director reorders all chained presets into an arc
//   camera_director      — single director designs a real camera-cut plan
//   critique             — pro motion-ad director scores the plan
//   refine               — produce final v2 plan based on critique
//   done                 — return render URL

const MOTION_PRESETS = [
  "spin","tilt","pop","float","reveal","flip","wobble","zoomin","zoomout",
  "tilt-up","showcase","shake","barrel","slide-in-left","slide-in-right",
  "slide-up","drop-in","fly-across","orbit","bounce","pendulum","swoop","chat-zoom"
];
const CAMERA_PRESETS = [
  "cam_dolly_in","cam_zoom_to_target","cam_pull_back","cam_pan_lr",
  "cam_pan_rl","cam_orbit","cam_punch_in","cam_handheld"
];
const BACKGROUNDS = ["sunset","ocean","forest","midnight","neon","cosmos","pastel","mono"];
const DEVICES = ["iphone","android","macbook","ipad","imac","browser","none"];

// Text-animation variants the sub-agents can pick from. Each one renders
// VERY differently so consecutive beats feel distinct. The 5 per-word
// reveals (pop, slide-up, blur-in, glow-pop, glitch) read as smooth modern
// kinetic typography — picked from 2025 motion-ad trends.
const TEXT_ANIMATIONS = ["typewriter","pop","slide-up","blur-in","glow-pop","glitch","3d","none"];

// Font families per intent. Each ad will mix several of these so consecutive
// beats look visually distinct. Whitelisted on the frontend (TextLayer reads
// `item.fontFamily`) and preloaded globally in index.html.
const FONT_FAMILIES = [
  { id: "anton",     css: "'Anton', Impact, sans-serif",                   intent: "bold display, hero claims, high impact climaxes" },
  { id: "bebas",     css: "'Bebas Neue', Impact, sans-serif",              intent: "ALL-CAPS punchy callouts, energetic builds" },
  { id: "archivo",   css: "'Archivo Black', sans-serif",                   intent: "ultra-heavy weight, modern app vibes" },
  { id: "oswald",    css: "'Oswald', sans-serif",                          intent: "condensed editorial feel, subtitles" },
  { id: "inter",     css: "'Inter', system-ui, sans-serif",                intent: "clean minimal modern (default tech / SaaS)" },
  { id: "space",     css: "'Space Grotesk', sans-serif",                   intent: "tech / startup / futuristic vibes" },
  { id: "playfair",  css: "'Playfair Display', Georgia, serif",            intent: "luxury / premium / editorial / fashion" },
  { id: "montserrat",css: "'Montserrat', sans-serif",                      intent: "friendly modern brand, balanced builds" },
  { id: "caveat",    css: "'Caveat', cursive",                             intent: "handwritten / playful / personal — use sparingly" },
];

// Safe text positions when a DEVICE is on screen. The device occupies the
// vertical center strip (roughly y:25-85), so text MUST stay in the top
// band (y:6-14) or bottom band (y:86-94). We removed all middle-y positions
// because they overlap the device.
const TEXT_POSITIONS = [
  { id: "top_center",     x: 50, y: 8  },
  { id: "top_left",       x: 25, y: 10 },
  { id: "top_right",      x: 75, y: 10 },
  { id: "bottom_center",  x: 50, y: 92 },
  { id: "bottom_left",    x: 25, y: 90 },
  { id: "bottom_right",   x: 75, y: 90 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { step, state = {} } = await req.json();
    if (!step) return Response.json({ error: 'Missing step' }, { status: 400 });

    // ── STEP 1: RESEARCH ───────────────────────────────────────────────
    if (step === 'research') {
      const { vibe, media_type } = state;
      const research = await base44.integrations.Core.InvokeLLM({
        prompt: `You are researching modern professional motion ads to inform a new edit.

USER VIBE: "${vibe || 'cinematic premium product reveal'}"
MEDIA TYPE: ${media_type || 'image'}

Search the web (YouTube, ad galleries, motion design blogs) for current trends in motion ads matching this vibe. Identify what makes top-performing motion ads work in 2025.

Return JSON:
- trends: array of 4-6 short trend bullets
- references: array of 3 example references (title + why it works)
- key_principles: array of 3-5 craft rules
- recommended_pace: "fast" | "medium" | "slow"
- recommended_mood: short phrase`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            trends: { type: 'array', items: { type: 'string' } },
            references: {
              type: 'array',
              items: {
                type: 'object',
                properties: { title: { type: 'string' }, why: { type: 'string' } },
              },
            },
            key_principles: { type: 'array', items: { type: 'string' } },
            recommended_pace: { type: 'string' },
            recommended_mood: { type: 'string' },
          },
          required: ['trends', 'key_principles'],
        },
      });

      return Response.json({ step: 'research', output: research, next_step: 'analyze_media' });
    }

    // ── STEP 2: ANALYZE MEDIA ──────────────────────────────────────────
    if (step === 'analyze_media') {
      const { media_url, media_type } = state;
      if (!media_url) return Response.json({ error: 'Missing media_url' }, { status: 400 });

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${media_type || 'image'} for a motion ad. Look at composition, subject, mood, palette.

Return JSON:
- subject: what is the main subject (1 short phrase)
- product_category: best guess of product category (1-2 words, e.g. "fitness app", "luxury watch", "AI tool")
- mood: dominant mood
- palette: 3-4 dominant colors as descriptive names
- composition: short phrase
- best_motion_angle: which animation style would best showcase this
- suggested_focal_point: where the eye should land first
- key_selling_points: array of 3-5 implied selling points / features the ad copy could highlight`,
        file_urls: [media_url],
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            product_category: { type: 'string' },
            mood: { type: 'string' },
            palette: { type: 'array', items: { type: 'string' } },
            composition: { type: 'string' },
            best_motion_angle: { type: 'string' },
            suggested_focal_point: { type: 'string' },
            key_selling_points: { type: 'array', items: { type: 'string' } },
          },
          required: ['subject', 'mood', 'best_motion_angle'],
        },
      });

      return Response.json({ step: 'analyze_media', output: analysis, next_step: 'plan' });
    }

    // ── STEP 3: PLAN V1 ────────────────────────────────────────────────
    if (step === 'plan') {
      const { vibe, research, analysis, target_duration, segment_count } = state;

      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are designing v1 of a motion ad. Use the research and media analysis below.

USER VIBE: "${vibe || 'premium and alive'}"

RESEARCH FINDINGS:
- Trends: ${(research?.trends || []).join(' · ')}
- Principles: ${(research?.key_principles || []).join(' · ')}
- Recommended pace: ${research?.recommended_pace || 'medium'}
- Recommended mood: ${research?.recommended_mood || ''}

MEDIA ANALYSIS:
- Subject: ${analysis?.subject || ''}
- Product category: ${analysis?.product_category || ''}
- Selling points: ${(analysis?.key_selling_points || []).join(' · ')}
- Best motion angle: ${analysis?.best_motion_angle || ''}

You will be writing the MASTER tagline / hero claim for the ad. Sub-agents will write per-beat lines later, so this should be the SINGLE BIGGEST line — punchy, 2-6 words.

Return JSON:
- tagline: punchy 2-6 word headline
- preset_id: ONE of: ${MOTION_PRESETS.join(', ')}
- camera_preset: ONE of: ${CAMERA_PRESETS.join(', ')}
- background: ONE of: ${BACKGROUNDS.join(', ')}
- device: ONE of: ${DEVICES.join(', ')}
- duration: integer 3-8
- reasoning: one sentence`,
        response_json_schema: {
          type: 'object',
          properties: {
            tagline: { type: 'string' },
            preset_id: { type: 'string' },
            camera_preset: { type: 'string' },
            background: { type: 'string' },
            device: { type: 'string' },
            duration: { type: 'number' },
            reasoning: { type: 'string' },
          },
          required: ['preset_id', 'background', 'device', 'duration'],
        },
      });

      const planDuration = target_duration && target_duration > 8 ? target_duration : plan.duration;
      const finalPlan = { ...plan, duration: planDuration };

      return Response.json({ step: 'plan', output: finalPlan, next_step: 'critique' });
    }

    // ── STEP 4: CRITIQUE ───────────────────────────────────────────────
    if (step === 'critique') {
      const { plan, research, analysis, vibe } = state;

      const critique = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior motion-design director reviewing a junior's motion ad plan. Be honest, sharp, and specific.

GOAL VIBE: "${vibe}"
SUBJECT: "${analysis?.subject}"
PRINCIPLES: ${(research?.key_principles || []).join(' · ')}

THE PLAN:
${JSON.stringify(plan, null, 2)}

Return JSON:
- score: integer 0-100
- strengths: 2-3 short bullets
- issues: 2-4 short bullets identifying weak choices
- improvements: 2-4 concrete fixes
- verdict: one sentence`,
        response_json_schema: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            issues: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            verdict: { type: 'string' },
          },
          required: ['score', 'issues', 'improvements'],
        },
      });

      return Response.json({ step: 'critique', output: critique, next_step: 'refine' });
    }

    // Beat-position preset palettes — force narrative arc.
    // Used by both choreograph_setup (to inform the writer) and
    // choreograph_beat (to constrain each sub-agent).
    const PALETTES = {
      opener:  ['slide-in-left', 'slide-in-right', 'slide-up', 'drop-in', 'fly-across', 'swoop', 'reveal', 'zoomin'],
      build:   ['pop', 'bounce', 'wobble', 'tilt', 'float', 'showcase', 'pendulum', 'tilt-up'],
      climax:  ['spin', 'barrel', 'orbit', 'shake', 'flip', 'chat-zoom', 'fly-across'],
      resolve: ['showcase', 'tilt-up', 'zoomout', 'pop', 'float', 'chat-zoom', 'tilt'],
    };

    // ── STEP 4.5a: CHOREOGRAPH SETUP (copywriter drafts all beat lines) ──
    // Runs ONCE before the per-beat loop. Returns the full script + the
    // computed segment count, total duration, segment length, and kfs/seg
    // so the frontend can iterate `choreograph_beat` for each line.
    if (step === 'choreograph_setup') {
      const {
        plan, analysis, vibe, target_duration,
        segment_count, keyframes_per_segment,
      } = state;

      const segCount = Math.max(4, Math.min(30, parseInt(segment_count) || 20));
      const totalDur = Math.max(4, Math.min(60, parseInt(target_duration) || 12));
      const segLen = totalDur / segCount;
      const kfPerSeg = Math.max(1, Math.min(6, parseInt(keyframes_per_segment) || 3));

      const scriptWriter = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the COPYWRITER for a ${totalDur}-second motion ad. Write ${segCount} short lines that together tell a complete story arc for this product.

PRODUCT: ${analysis?.subject || ''} (${analysis?.product_category || ''})
SELLING POINTS: ${(analysis?.key_selling_points || []).join(' · ')}
HERO TAGLINE (already used as the final beat): "${plan?.tagline || ''}"
VIBE: ${vibe}

REQUIREMENTS:
- Write ${segCount} UNIQUE lines, in NARRATIVE ORDER (opener → build → climax → resolve).
- Each line is 2–6 words. Punchy. Ad-grade copy. NO fluff. NO repetition.
- Beat 1 = the HOOK (a question, a tease, a bold claim).
- Middle beats = build curiosity / reveal features (one feature per line).
- Climax beats = emotional peak / value proposition.
- Final beat = a strong CTA or echo of the hero tagline.
- DO NOT repeat any word combination across lines. DO NOT reuse the hero tagline verbatim.
- Together these lines must read like a real commercial script.

Return JSON: { "lines": ["line1", "line2", ...] }  with exactly ${segCount} entries.`,
        response_json_schema: {
          type: 'object',
          properties: {
            lines: { type: 'array', items: { type: 'string' } },
          },
          required: ['lines'],
        },
      });

      const scriptLines = (Array.isArray(scriptWriter?.lines) ? scriptWriter.lines : []).slice(0, segCount);
      while (scriptLines.length < segCount) scriptLines.push('');

      return Response.json({
        step: 'choreograph_setup',
        output: {
          script_lines: scriptLines,
          segment_count: segCount,
          total_duration: totalDur,
          segment_length: segLen,
          keyframes_per_segment: kfPerSeg,
        },
        next_step: 'choreograph_beat',
      });
    }

    // ── STEP 4.5b: CHOREOGRAPH BEAT (one sub-agent per call) ────────────
    // Frontend invokes this once per beat with `beat_index` and the running
    // `segments` array. We design ONE beat using context from prior beats
    // (so each sub-agent makes a real-time decision, not a batch).
    if (step === 'choreograph_beat') {
      const {
        beat_index, segments = [],
        choreograph_setup, vibe, analysis, research,
      } = state;

      if (!choreograph_setup) {
        return Response.json({ error: 'Missing choreograph_setup state' }, { status: 400 });
      }
      const i = parseInt(beat_index);
      if (Number.isNaN(i) || i < 0) {
        return Response.json({ error: 'Invalid beat_index' }, { status: 400 });
      }

      const {
        script_lines = [],
        segment_count: segCount,
        segment_length: segLen,
        keyframes_per_segment: kfPerSeg,
      } = choreograph_setup;

      const progress = i / Math.max(1, segCount - 1);
      const phase = progress < 0.2 ? 'opener'
        : progress < 0.6 ? 'build'
        : progress < 0.85 ? 'climax'
        : 'resolve';
      const palette = PALETTES[phase];

      const previous = segments.slice(-3).map((s, idx) =>
        `Beat ${segments.length - 3 + idx + 1}: presets=[${(s.preset_ids || []).join('+')}] text="${s.text}" anim=${s.text_animation} pos=${s.text_position_id}`
      ).join('\n');

      // Tally overused presets across all prior beats
      const counts = {};
      segments.forEach(s => (s.preset_ids || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; }));
      const overusedMax = segCount * kfPerSeg / 6;
      const overused = Object.entries(counts).filter(([, c]) => c >= overusedMax).map(([id]) => id);

      const usedPositions = segments.slice(-3).map(s => s.text_position_id).filter(Boolean);
      const usedAnimations = segments.map(s => s.text_animation).filter(Boolean);
      const recentAnims = usedAnimations.slice(-2);

      const myLine = script_lines[i] || '';
      const shouldOfferImage = (i % 4 === 0) && i > 0;

      const subAgent = await base44.integrations.Core.InvokeLLM({
        prompt: `You are sub-agent #${i + 1} of ${segCount} choreographing one beat of a motion ad. Make it distinct from the recent beats.

OVERALL VIBE: "${vibe}"
SUBJECT: ${analysis?.subject || ''}
PACE: ${research?.recommended_pace || 'medium'}

NARRATIVE PHASE: ${phase.toUpperCase()} (${i + 1}/${segCount})
${phase === 'opener' ? '→ HOOK: subject ENTERS from off-screen. Energetic.' : ''}
${phase === 'build' ? '→ BUILD: subject is on-screen — rhythmic in-place motion.' : ''}
${phase === 'climax' ? '→ PEAK: bold rotations, max energy.' : ''}
${phase === 'resolve' ? '→ RESOLUTION: settle into a confident showcase pose.' : ''}

TASK: Choose all of the following for this beat:

1) MOTION PRESETS — pick EXACTLY ${kfPerSeg} ids from this pool (most must come from the primary pool):
   PRIMARY POOL (this phase): ${palette.join(', ')}
   FALLBACK POOL (use sparingly): ${MOTION_PRESETS.filter(p => !palette.includes(p)).join(', ')}
   - No two consecutive presets identical.
   - Avoid these (overused): ${overused.length ? overused.join(', ') : '(none yet)'}

2) TEXT — your beat's script line is ALREADY WRITTEN: "${myLine}". Use it verbatim. Do not change it.

3) TEXT ANIMATION — pick ONE that is DIFFERENT from the last two beats (${recentAnims.length ? recentAnims.join(', ') : 'none yet'}):
   - "typewriter" — types char-by-char (best for setup/teaser lines, OPENER)
   - "pop" — punchy word-by-word scale-bounce (best for punchy callouts, BUILD)
   - "slide-up" — words slide up smoothly from below (modern, clean — BUILD/RESOLVE)
   - "blur-in" — words emerge from a soft blur (premium / cinematic — BUILD/RESOLVE)
   - "glow-pop" — words pop with a bright neon glow halo (max energy — CLIMAX)
   - "glitch" — words glitch/skew in with cyan+magenta chroma split (edgy — CLIMAX)
   - "3d" — bold extruded 3D text (dramatic claims — CLIMAX)
   - "none" — instant on (best for very short hits, less than 3 words)
   PHASE GUIDANCE: opener → typewriter/none. build → pop/slide-up/blur-in. climax → glow-pop/glitch/3d. resolve → blur-in/slide-up/pop.

3b) TEXT STYLE — choose font_weight (400, 600, 700, 800, or 900) and emphasis ("uppercase" or "normal").
   - Climax / hero claims: weight 900, uppercase.
   - Build / feature callouts: weight 700-800, uppercase.
   - Soft openers / questions: weight 600, normal.
   - Resolve / CTA: weight 800-900, uppercase.

3c) FONT FAMILY — pick ONE id from this list, matching the beat's intent. VARY across beats so the ad feels alive (don't reuse the same font more than ~40% of the ad). AVOID repeating the font used in the previous beat.
${FONT_FAMILIES.map(f => `   - "${f.id}" — ${f.intent}`).join('\n')}
   PHASE GUIDANCE: opener → inter/space/montserrat. build → bebas/oswald/archivo. climax → anton/archivo. resolve → playfair/montserrat/inter. Use "caveat" sparingly (max 1-2 beats per ad, only for personal/playful moments).

4) TEXT POSITION — pick ONE from this list. AVOID positions used in the last 3 beats (${usedPositions.length ? usedPositions.join(', ') : 'none yet'}). The device occupies the entire vertical middle of the frame, so text MUST stay in the TOP band or BOTTOM band. Pick from:
   ${TEXT_POSITIONS.map(p => `${p.id} (x:${p.x}, y:${p.y})`).join(', ')}

5) CAMERA (optional) — empty string or one of: cam_dolly_in, cam_zoom_to_target, cam_pull_back, cam_pan_lr, cam_pan_rl, cam_orbit, cam_punch_in, cam_handheld

${shouldOfferImage ? `6) IMAGE OVERLAY (optional but encouraged for THIS beat) — to add cinematic depth, you may request a generated image overlay. If you want one, fill these:
   - image_prompt: a detailed cinematic prompt for the supporting image (mood / texture / abstract — NOT the product itself)
   - image_role: "background" (full canvas behind device) or "accent" (small overlay floating in a corner)
   Otherwise leave both empty.` : '6) IMAGE OVERLAY — leave empty for this beat.'}

7) TEXT-ONLY MODE — for ~25-35% of beats (especially openers, transitions, and pure-statement climax beats), set text_only=true. When text_only=true the device is HIDDEN for this beat and the text takes over the whole frame — like real TV ads that intercut product shots with bold text-only kinetic typography cards. NEVER set text_only=true on the very last beat (need a clean product resolution). Vary so the ad has rhythm: device → device → TEXT-ONLY → device → device → TEXT-ONLY etc. Don't put two text-only beats back-to-back.

8) DEVICE FOR THIS BEAT — pick ONE device frame that should hold the product for this beat:
   ${DEVICES.join(', ')}
   - "iphone"/"android" = mobile portrait (default for app/social products)
   - "macbook"/"imac"/"browser" = desktop landscape (for SaaS, dashboards, websites)
   - "ipad" = tablet
   - "none" = bare image, no chrome (for hero shots, logos, lifestyle photos)
   You MAY swap devices across beats to add visual variety (e.g. iphone → macbook → iphone). If you have no preference for this beat, repeat what was used recently.

9) BACKGROUND VIBE FOR THIS BEAT (optional) — describe a MODERN AI-generated background that fits this beat's energy in 4-12 words. Examples: "soft pastel gradient with floating glass orbs", "neon cyan grid receding into purple fog", "warm ivory studio with caustic light". Leave bg_prompt empty if the existing background still works.

RECENT BEATS:
${previous || '(this is the first beat)'}

Return JSON with: preset_ids, intent, camera_preset, text_animation, font_weight, emphasis, font_family, text_position_id, image_prompt, image_role, text_only, device, bg_prompt.`,
        response_json_schema: {
          type: 'object',
          properties: {
            preset_ids: { type: 'array', items: { type: 'string' } },
            intent: { type: 'string' },
            camera_preset: { type: 'string' },
            text_animation: { type: 'string' },
            font_weight: { type: 'number' },
            emphasis: { type: 'string' },
            font_family: { type: 'string' },
            text_position_id: { type: 'string' },
            image_prompt: { type: 'string' },
            image_role: { type: 'string' },
            text_only: { type: 'boolean' },
            device: { type: 'string' },
            bg_prompt: { type: 'string' },
          },
          required: ['preset_ids', 'intent', 'text_animation', 'text_position_id'],
        },
      });

      // ── Sanitize sub-agent output ────────────────────────────────
      const fallbacks = ['showcase', 'pop', 'float', 'tilt', 'reveal', 'bounce'];
      let ids = (Array.isArray(subAgent.preset_ids) ? subAgent.preset_ids : [])
        .map(id => MOTION_PRESETS.includes(id) ? id : null)
        .filter(Boolean);
      let fb = 0;
      while (ids.length < kfPerSeg) {
        const cand = fallbacks[fb++ % fallbacks.length];
        if (ids[ids.length - 1] !== cand) ids.push(cand);
      }
      ids = ids.slice(0, kfPerSeg);
      for (let j = 1; j < ids.length; j++) {
        if (ids[j] === ids[j - 1]) {
          ids[j] = fallbacks.find(f => f !== ids[j - 1]) || 'pop';
        }
      }

      let anim = TEXT_ANIMATIONS.includes(subAgent.text_animation) ? subAgent.text_animation : 'pop';
      if (recentAnims[recentAnims.length - 1] === anim) {
        anim = TEXT_ANIMATIONS.find(a => a !== anim) || 'pop';
      }

      // Auto-style fallbacks per narrative phase if the agent didn't decide.
      const ALLOWED_WEIGHTS = [400, 600, 700, 800, 900];
      const phaseWeight = phase === 'climax' ? 900 : phase === 'build' ? 800 : phase === 'resolve' ? 900 : 700;
      const fontWeight = ALLOWED_WEIGHTS.includes(subAgent.font_weight) ? subAgent.font_weight : phaseWeight;
      const emphasis = (subAgent.emphasis === 'uppercase' || subAgent.emphasis === 'normal')
        ? subAgent.emphasis
        : (phase === 'opener' ? 'normal' : 'uppercase');

      let posId = subAgent.text_position_id;
      let pos = TEXT_POSITIONS.find(p => p.id === posId);
      if (!pos) {
        pos = TEXT_POSITIONS.find(p => !usedPositions.includes(p.id)) || TEXT_POSITIONS[i % TEXT_POSITIONS.length];
        posId = pos.id;
      }

      // ── Font family resolution ────────────────────────────────────────
      // Pick the font the sub-agent chose. Fall back to a phase-appropriate
      // font if the agent's choice is invalid. Avoid using the SAME font as
      // the previous beat so consecutive beats look distinct.
      const phaseFonts = {
        opener:  ['inter', 'space', 'montserrat'],
        build:   ['bebas', 'oswald', 'archivo'],
        climax:  ['anton', 'archivo'],
        resolve: ['playfair', 'montserrat', 'inter'],
      };
      const prevFontId = segments[segments.length - 1]?.font_family_id;
      let fontId = FONT_FAMILIES.find(f => f.id === subAgent.font_family)?.id;
      if (!fontId || fontId === prevFontId) {
        const pool = (phaseFonts[phase] || ['inter']).filter(f => f !== prevFontId);
        fontId = pool[i % pool.length] || 'inter';
      }
      const fontCss = (FONT_FAMILIES.find(f => f.id === fontId) || FONT_FAMILIES[4]).css;

      // ── Text-only sanitization: not on last beat, not back-to-back ───
      const prevBeat = segments[segments.length - 1];
      const isLastBeat = (i + 1) >= segCount;
      let textOnly = !!subAgent.text_only;
      if (isLastBeat) textOnly = false;                    // last beat must show product
      if (textOnly && prevBeat?.text_only) textOnly = false; // no two text-only back-to-back

      // ── Device sanitization: fall back to plan's device if invalid ───
      const planDevice = state.plan?.device || 'iphone';
      const beatDevice = DEVICES.includes(subAgent.device) ? subAgent.device : planDevice;

      // ── Background prompt: only keep if it's a real string ──────────
      const bgPrompt = (typeof subAgent.bg_prompt === 'string' && subAgent.bg_prompt.trim().length > 4)
        ? subAgent.bg_prompt.trim().slice(0, 200)
        : '';

      const segment = {
        beat: i + 1,
        phase,
        preset_ids: ids,
        preset_id: ids[0],
        intent: subAgent.intent || '',
        camera_preset: CAMERA_PRESETS.includes(subAgent.camera_preset) ? subAgent.camera_preset : '',
        duration: segLen,
        keyframes_per_slide: kfPerSeg,
        text: emphasis === 'uppercase' ? (myLine || '').toUpperCase() : myLine,
        text_animation: anim,
        font_weight: fontWeight,
        font_family_id: fontId,
        font_family_css: fontCss,
        emphasis,
        text_position_id: posId,
        text_x: pos.x,
        text_y: pos.y,
        image_prompt: shouldOfferImage && subAgent.image_prompt ? subAgent.image_prompt : '',
        image_role: shouldOfferImage && (subAgent.image_role === 'background' || subAgent.image_role === 'accent')
          ? subAgent.image_role : '',
        text_only: textOnly,
        device: beatDevice,
        bg_prompt: bgPrompt,
      };

      const isLast = (i + 1) >= segCount;
      return Response.json({
        step: 'choreograph_beat',
        output: { segment, beat_index: i, is_last: isLast, segment_count: segCount },
        next_step: isLast ? 'choreograph_finalize' : 'choreograph_beat',
      });
    }

    // ── STEP 4.5c: CHOREOGRAPH FINALIZE (assemble segments into output) ──
    if (step === 'choreograph_finalize') {
      const { segments = [], choreograph_setup } = state;
      if (!choreograph_setup) {
        return Response.json({ error: 'Missing choreograph_setup state' }, { status: 400 });
      }
      return Response.json({
        step: 'choreograph_finalize',
        output: {
          segments,
          script_lines: choreograph_setup.script_lines || [],
          total_duration: choreograph_setup.total_duration,
          segment_count: choreograph_setup.segment_count,
          keyframes_per_segment: choreograph_setup.keyframes_per_segment,
        },
        next_step: 'sequence',
      });
    }

    // ── STEP 4.6: SEQUENCE (master director reorder) ───────────────────
    if (step === 'sequence') {
      const { choreograph, vibe, research, analysis } = state;
      if (!choreograph?.segments?.length) {
        return Response.json({ step: 'sequence', output: null, next_step: 'camera_director' });
      }

      const flat = [];
      choreograph.segments.forEach((seg, beatIdx) => {
        const ids = Array.isArray(seg.preset_ids) ? seg.preset_ids : [seg.preset_id];
        ids.forEach((id, slot) => {
          if (MOTION_PRESETS.includes(id)) flat.push({ id, beat: beatIdx + 1, slot });
        });
      });

      const directorOutput = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the MASTER director of a long-form motion ad. Decide the best GLOBAL order for all ${flat.length} chained presets to give a coherent narrative arc.

VIBE: "${vibe}"
SUBJECT: ${analysis?.subject || ''}
PACE: ${research?.recommended_pace || 'medium'}
TOTAL DURATION: ${choreograph.total_duration}s

CURRENT CHAIN (sub-agent order):
${flat.map((f, i) => `${i + 1}. ${f.id} (from beat ${f.beat})`).join('\n')}

ARC RULES:
- OPENING (first 20%): slide-in-*, drop-in, fly-across, zoomin, reveal
- BUILD (20-60%): pop, bounce, wobble, tilt, float, showcase
- CLIMAX (60-85%): spin, barrel, orbit, swoop, shake, flip
- RESOLUTION (last 15%): showcase, chat-zoom, zoomout, tilt-up, pop

No two identical presets back-to-back. Vary direction.

Return JSON:
- ordered_preset_ids: permutation of input list (every input appears exactly once)
- reasoning: 1-2 sentences`,
        response_json_schema: {
          type: 'object',
          properties: {
            ordered_preset_ids: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' },
          },
          required: ['ordered_preset_ids'],
        },
      });

      const inputCounts = {};
      flat.forEach(f => { inputCounts[f.id] = (inputCounts[f.id] || 0) + 1; });
      const proposed = (directorOutput.ordered_preset_ids || []).filter(id => MOTION_PRESETS.includes(id));
      const proposedCounts = {};
      proposed.forEach(id => { proposedCounts[id] = (proposedCounts[id] || 0) + 1; });
      const isValidPermutation = proposed.length === flat.length &&
        Object.keys(inputCounts).every(k => inputCounts[k] === proposedCounts[k]);

      const arcFallback = () => {
        const POOL = {
          opener:  new Set(['slide-in-left', 'slide-in-right', 'slide-up', 'drop-in', 'fly-across', 'swoop', 'reveal', 'zoomin']),
          climax:  new Set(['spin', 'barrel', 'orbit', 'shake', 'flip', 'chat-zoom']),
          resolve: new Set(['showcase', 'tilt-up', 'zoomout']),
        };
        const buckets = { opener: [], build: [], climax: [], resolve: [] };
        flat.forEach(f => {
          if (POOL.opener.has(f.id)) buckets.opener.push(f.id);
          else if (POOL.climax.has(f.id)) buckets.climax.push(f.id);
          else if (POOL.resolve.has(f.id)) buckets.resolve.push(f.id);
          else buckets.build.push(f.id);
        });
        const splay = (arr) => {
          const groups = {};
          arr.forEach(id => { (groups[id] ||= []).push(id); });
          const out = [];
          let any = true;
          while (any) {
            any = false;
            for (const id of Object.keys(groups)) {
              if (groups[id].length) { out.push(groups[id].pop()); any = true; }
            }
          }
          return out;
        };
        return [...splay(buckets.opener), ...splay(buckets.build), ...splay(buckets.climax), ...splay(buckets.resolve)];
      };
      const finalOrder = isValidPermutation ? proposed : arcFallback();

      return Response.json({
        step: 'sequence',
        output: {
          ordered_preset_ids: finalOrder,
          reasoning: isValidPermutation
            ? (directorOutput.reasoning || '')
            : 'Director permutation invalid — applied deterministic narrative arc.',
          used_director_order: isValidPermutation,
        },
        next_step: 'camera_director',
      });
    }

    // ── STEP 4.7: CAMERA DIRECTOR ──────────────────────────────────────
    // A single director designs a real camera plan: 4-8 cinematic cuts with
    // intentional pacing. Sub-agents can request camera moves, but the
    // director has the final say on the GLOBAL camera arc.
    if (step === 'camera_director') {
      const { choreograph, vibe, research, analysis } = state;
      const totalDur = choreograph?.total_duration || 12;
      const segCount = choreograph?.segment_count || 8;

      // How many camera cuts? ~1 cut per ~5s, min 4, max 8
      const cutCount = Math.max(4, Math.min(8, Math.round(totalDur / 4)));

      const director = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the CINEMATOGRAPHER for a ${totalDur}-second motion ad. Design a professional ${cutCount}-cut camera plan.

VIBE: "${vibe}"
SUBJECT: ${analysis?.subject || ''}
PACE: ${research?.recommended_pace || 'medium'}

You have these camera presets:
- cam_dolly_in: slow forward push (great for openers / hero reveals)
- cam_zoom_to_target: punchy zoom into the focal point
- cam_pull_back: reveal the wider scene (great for resolutions)
- cam_pan_lr: pan left → right (great for builds)
- cam_pan_rl: pan right → left (great for builds, alternates with lr)
- cam_orbit: circle around the subject (great for climax)
- cam_punch_in: sudden zoom-in (great for impacts at the climax)
- cam_handheld: subtle shake (great for energetic builds)

PROFESSIONAL CINEMATOGRAPHY RULES:
- OPEN with a movement that introduces the subject (dolly_in or zoom_to_target).
- BUILD with horizontal movement or handheld energy.
- CLIMAX with one bold move (orbit, punch_in).
- RESOLVE with stillness or a slow pull_back.
- Never repeat the same cut back-to-back.
- Vary cut LENGTHS — don't make every cut the same duration. Quick cuts (1-2s) build energy, slow cuts (4-6s) breathe.
- Cuts must total exactly ${totalDur}s.

Return JSON:
- cuts: array of EXACTLY ${cutCount} entries, each:
  { camera_preset, duration_sec (number), intent (1 short phrase) }
- reasoning: 1 sentence on the overall cinematic arc.

The cuts must be in PLAYBACK ORDER and their durations must sum to ${totalDur}s.`,
        response_json_schema: {
          type: 'object',
          properties: {
            cuts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  camera_preset: { type: 'string' },
                  duration_sec: { type: 'number' },
                  intent: { type: 'string' },
                },
                required: ['camera_preset', 'duration_sec'],
              },
            },
            reasoning: { type: 'string' },
          },
          required: ['cuts'],
        },
      });

      // Sanitize: keep only valid cuts, normalize durations to fit totalDur
      let cuts = (director.cuts || [])
        .filter(c => CAMERA_PRESETS.includes(c.camera_preset) && c.duration_sec > 0);
      if (cuts.length === 0) {
        // Deterministic fallback
        cuts = [
          { camera_preset: 'cam_dolly_in', duration_sec: totalDur * 0.25, intent: 'open' },
          { camera_preset: 'cam_pan_lr',   duration_sec: totalDur * 0.25, intent: 'build' },
          { camera_preset: 'cam_orbit',    duration_sec: totalDur * 0.25, intent: 'climax' },
          { camera_preset: 'cam_pull_back',duration_sec: totalDur * 0.25, intent: 'resolve' },
        ];
      }
      // Avoid back-to-back duplicates
      for (let i = 1; i < cuts.length; i++) {
        if (cuts[i].camera_preset === cuts[i - 1].camera_preset) {
          const alt = CAMERA_PRESETS.find(c => c !== cuts[i - 1].camera_preset);
          cuts[i] = { ...cuts[i], camera_preset: alt };
        }
      }
      // Normalize durations to sum to totalDur
      const sum = cuts.reduce((a, c) => a + c.duration_sec, 0);
      if (sum > 0 && Math.abs(sum - totalDur) > 0.1) {
        const scale = totalDur / sum;
        cuts = cuts.map(c => ({ ...c, duration_sec: c.duration_sec * scale }));
      }

      return Response.json({
        step: 'camera_director',
        output: { cuts, reasoning: director.reasoning || '' },
        next_step: 'refine',
      });
    }

    // ── STEP 5: REFINE ─────────────────────────────────────────────────
    if (step === 'refine') {
      const { plan, critique, vibe, choreograph, target_duration } = state;

      const refined = await base44.integrations.Core.InvokeLLM({
        prompt: `Apply the director's critique and produce v2 of the plan.

ORIGINAL PLAN:
${JSON.stringify(plan, null, 2)}

CRITIQUE:
- Issues: ${(critique?.issues || []).join(' · ')}
- Improvements: ${(critique?.improvements || []).join(' · ')}

Goal vibe: "${vibe}"

Return final JSON with the same shape:
- tagline: 2-6 words
- preset_id: ONE of: ${MOTION_PRESETS.join(', ')}
- camera_preset: ONE of: ${CAMERA_PRESETS.join(', ')} (or empty)
- background: ONE of: ${BACKGROUNDS.join(', ')}
- device: ONE of: ${DEVICES.join(', ')}
- duration: integer 3-8
- reasoning: one sentence`,
        response_json_schema: {
          type: 'object',
          properties: {
            tagline: { type: 'string' },
            preset_id: { type: 'string' },
            camera_preset: { type: 'string' },
            background: { type: 'string' },
            device: { type: 'string' },
            duration: { type: 'number' },
            reasoning: { type: 'string' },
          },
          required: ['preset_id', 'background', 'device', 'duration'],
        },
      });

      const realDuration = choreograph?.total_duration || target_duration || refined.duration;
      const finalRefined = { ...refined, duration: realDuration };

      return Response.json({ step: 'refine', output: finalRefined, next_step: 'done' });
    }

    // ── STEP 6: DONE ───────────────────────────────────────────────────
    if (step === 'done') {
      const { plan, media_url, email, choreograph, sequence, speed } = state;
      if (!plan || !media_url) {
        return Response.json({ error: 'Missing plan or media_url' }, { status: 400 });
      }

      const preset = MOTION_PRESETS.includes(plan.preset_id) ? plan.preset_id : 'showcase';
      const background = BACKGROUNDS.includes(plan.background) ? plan.background : 'sunset';
      const device = DEVICES.includes(plan.device) ? plan.device : 'iphone';
      const playSpeed = Math.max(0.25, Math.min(4, Number(speed) || 1));

      let duration;
      const params = new URLSearchParams({
        auto: '1',
        text: plan.tagline || '',
        device,
        background,
        media: media_url,
      });

      if (choreograph?.segments?.length) {
        let chainIds;
        if (Array.isArray(sequence?.ordered_preset_ids) && sequence.ordered_preset_ids.length > 0) {
          chainIds = sequence.ordered_preset_ids.map(id => MOTION_PRESETS.includes(id) ? id : 'showcase');
        } else {
          chainIds = [];
          for (const seg of choreograph.segments) {
            const ids = Array.isArray(seg.preset_ids) ? seg.preset_ids : [seg.preset_id];
            for (const id of ids) chainIds.push(MOTION_PRESETS.includes(id) ? id : 'showcase');
          }
        }
        duration = Math.max(8, Math.min(60, Math.round(choreograph.total_duration || 12)));
        params.set('chain', chainIds.join(','));
        params.set('duration', String(duration));
        const firstCam = choreograph.segments.find(s => CAMERA_PRESETS.includes(s.camera_preset))?.camera_preset;
        if (firstCam) params.set('camera', firstCam);

        // Encode per-beat narrative fields (text + animation + position + duration
        // + text_only flag + per-beat device swap + font family) so UltraMock can
        // stream them sequentially.
        const beats = choreograph.segments.map((s) => ({
          t: s.text || '',
          a: s.text_animation || 'pop',
          x: s.text_x ?? 50,
          y: s.text_y ?? 12,
          d: s.duration || 1.5,
          to: !!s.text_only,
          dv: DEVICES.includes(s.device) ? s.device : '',
          fw: s.font_weight || 900,
          ff: s.font_family_css || '',
        }));
        try {
          // base64-encode the JSON so newlines/quotes survive URL encoding
          const blob = btoa(unescape(encodeURIComponent(JSON.stringify(beats))));
          params.set('beats', blob);
        } catch { /* ignore */ }

        // Pick the dominant background prompt for a single AI-generated modern
        // background that the whole ad uses. Prefer the first non-empty one.
        const dominantBg = (choreograph.segments.find(s => s.bg_prompt)?.bg_prompt || '').trim();
        if (dominantBg) params.set('bg_prompt', dominantBg.slice(0, 200));
      } else {
        duration = Math.max(3, Math.min(8, parseInt(plan.duration) || 4));
        params.set('preset', preset);
        params.set('duration', String(duration));
        if (plan.camera_preset && CAMERA_PRESETS.includes(plan.camera_preset)) {
          params.set('camera', plan.camera_preset);
        }
      }

      if (playSpeed !== 1) params.set('speed', String(playSpeed));
      if (email) params.set('email', email);

      return Response.json({
        step: 'done',
        output: { plan: { ...plan, preset_id: preset, background, device, duration }, segments: choreograph?.segments || [], speed: playSpeed },
        render_url: `/UltraMock?${params.toString()}`,
      });
    }

    return Response.json({ error: `Unknown step: ${step}` }, { status: 400 });
  } catch (error) {
    console.error('[katagamiMasterAgent] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});