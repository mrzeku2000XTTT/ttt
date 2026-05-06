import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Katagami Master Motion-Ad Agent
// Single endpoint that runs ONE step at a time of a self-improving motion-ad
// pipeline. The frontend calls it repeatedly with the running `state`, so the
// chat UI can stream every thought / search / critique to the user.
//
// Steps:
//   1. research        — websearch motion ad references for the vibe
//   2. analyze_media   — vision-pass on the uploaded media (subject, mood, palette)
//   3. plan            — design v1 motion plan (preset, camera, tagline, bg, duration)
//   4. critique        — score the plan against pro motion-ad principles
//   5. refine          — produce final v2 plan based on critique
//   6. done            — return render URL
//
// Each step returns { step, output, next_step, render_url? }.

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
const DEVICES = ["iphone","android","macbook","ipad"];

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
- trends: array of 4-6 short trend bullets (e.g. "punchy 0.4s text pops", "dolly-in into product hero")
- references: array of 3 example references (title + why it works)
- key_principles: array of 3-5 craft rules to follow (timing, easing, hierarchy)
- recommended_pace: "fast" | "medium" | "slow"
- recommended_mood: short phrase (e.g. "moody cinematic", "energetic playful")`,
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

      return Response.json({
        step: 'research',
        output: research,
        next_step: 'analyze_media',
      });
    }

    // ── STEP 2: ANALYZE MEDIA ──────────────────────────────────────────
    if (step === 'analyze_media') {
      const { media_url, media_type } = state;
      if (!media_url) return Response.json({ error: 'Missing media_url' }, { status: 400 });

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${media_type || 'image'} for a motion ad. Look at composition, subject, mood, palette, and what makes it visually interesting.

Return JSON:
- subject: what is the main subject (1 short phrase)
- mood: dominant mood (1 phrase)
- palette: 3-4 dominant colors as descriptive names
- composition: short phrase (centered, off-center, full-bleed, etc)
- best_motion_angle: which animation style would best showcase this (1 sentence)
- suggested_focal_point: where the eye should land first`,
        file_urls: [media_url],
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            mood: { type: 'string' },
            palette: { type: 'array', items: { type: 'string' } },
            composition: { type: 'string' },
            best_motion_angle: { type: 'string' },
            suggested_focal_point: { type: 'string' },
          },
          required: ['subject', 'mood', 'best_motion_angle'],
        },
      });

      return Response.json({
        step: 'analyze_media',
        output: analysis,
        next_step: 'plan',
      });
    }

    // ── STEP 3: PLAN V1 ────────────────────────────────────────────────
    if (step === 'plan') {
      const { vibe, research, analysis, target_duration } = state;

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
- Mood: ${analysis?.mood || ''}
- Best motion angle: ${analysis?.best_motion_angle || ''}
- Focal point: ${analysis?.suggested_focal_point || ''}

Design a motion ad plan. Return JSON:
- tagline: punchy 2-6 word headline (or empty string)
- preset_id: ONE of: ${MOTION_PRESETS.join(', ')}
- camera_preset: ONE of: ${CAMERA_PRESETS.join(', ')} (or empty for none)
- background: ONE of: ${BACKGROUNDS.join(', ')}
- device: ONE of: ${DEVICES.join(', ')}
- duration: integer 3-8 (seconds)
- reasoning: one sentence on why this combo serves the goal`,
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

      // For long-form ads (target_duration > 8), override the LLM's 3-8s suggestion
      // with the user's actual target duration so the plan card shows the truth.
      const planDuration = target_duration && target_duration > 8 ? target_duration : plan.duration;
      const finalPlan = { ...plan, duration: planDuration };

      return Response.json({
        step: 'plan',
        output: finalPlan,
        next_step: 'critique',
      });
    }

    // ── STEP 4: CRITIQUE ───────────────────────────────────────────────
    if (step === 'critique') {
      const { plan, research, analysis, vibe } = state;

      const critique = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior motion-design director reviewing a junior's motion ad plan. Be honest, sharp, and specific.

GOAL VIBE: "${vibe}"
SUBJECT: "${analysis?.subject}"
PRINCIPLES TO HONOR: ${(research?.key_principles || []).join(' · ')}

THE PLAN:
${JSON.stringify(plan, null, 2)}

Return JSON:
- score: integer 0-100
- strengths: array of 2-3 short bullets
- issues: array of 2-4 short bullets identifying weak choices (timing, preset fit, background mood, tagline punch, camera choice)
- improvements: array of 2-4 concrete fixes (e.g. "swap preset to slide-in-left for stronger reveal", "shorten to 4s for ad pacing", "drop camera_preset — it competes with subject motion")
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

      return Response.json({
        step: 'critique',
        output: critique,
        next_step: 'refine',
      });
    }

    // ── STEP 4.5: CHOREOGRAPH (sub-agent loop) ────────────────────────
    // Spawned by the master when the user wants a LONGER ad. Each sub-agent
    // designs ONE segment (4-10 keyframes worth of motion). We loop, calling
    // a fresh sub-agent for every beat, and stitch their outputs into a
    // multi-segment preset chain the timeline can play back-to-back.
    if (step === 'choreograph') {
      const { plan, research, analysis, vibe, target_duration, segment_count, keyframes_per_segment } = state;
      // User-controlled: 4–30 sub-agents (slides). Default 20.
      const segCount = Math.max(4, Math.min(30, parseInt(segment_count) || 20));
      const totalDur = Math.max(4, Math.min(60, parseInt(target_duration) || 12));
      const segLen = totalDur / segCount;
      // Keyframes per slide — controls how many chained motion presets each
      // sub-agent picks. 1 = simple single move, 6 = rich multi-flourish.
      const kfPerSeg = Math.max(1, Math.min(6, parseInt(keyframes_per_segment) || 3));

      // ── Beat-position preset palettes ────────────────────────────────
      // Force each sub-agent to pick from a DIFFERENT pool depending on its
      // position in the narrative arc. Without this, every sub-agent picks
      // the same generic "pop → tilt → zoomin → reveal" pattern.
      const PALETTES = {
        opener:  ['slide-in-left', 'slide-in-right', 'slide-up', 'drop-in', 'fly-across', 'swoop', 'reveal', 'zoomin'],
        build:   ['pop', 'bounce', 'wobble', 'tilt', 'float', 'showcase', 'pendulum', 'tilt-up'],
        climax:  ['spin', 'barrel', 'orbit', 'shake', 'flip', 'zigzag', 'chat-zoom', 'fly-across'],
        resolve: ['showcase', 'tilt-up', 'zoomout', 'pop', 'float', 'chat-zoom', 'tilt'],
      };
      const segments = [];
      // Sub-agent loop — each call is a fresh director designing ONE beat
      // with `kfPerSeg` chained motion presets, so each beat has rich motion.
      for (let i = 0; i < segCount; i++) {
        const progress = i / Math.max(1, segCount - 1);
        const phase = progress < 0.2 ? 'opener'
          : progress < 0.6 ? 'build'
          : progress < 0.85 ? 'climax'
          : 'resolve';
        const palette = PALETTES[phase];
        const previous = segments.slice(-3).map((s, idx) => `Beat ${segments.length - 3 + idx + 1}: ${s.preset_ids.join('+')}`).join(' · ');
        // Tally most-overused presets so far so we can ban them in this beat
        const overused = (() => {
          const counts = {};
          segments.forEach(s => s.preset_ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; }));
          const max = segCount * kfPerSeg / 6; // rough cap
          return Object.entries(counts).filter(([, c]) => c >= max).map(([id]) => id);
        })();

        const subAgent = await base44.integrations.Core.InvokeLLM({
          prompt: `You are sub-agent #${i + 1} of ${segCount} choreographing one beat of a long-form motion ad. Design beat ${i + 1} with EXACTLY ${kfPerSeg} chained motion preset${kfPerSeg === 1 ? '' : 's'}.

OVERALL VIBE: "${vibe}"
SUBJECT: ${analysis?.subject || ''}
PACE: ${research?.recommended_pace || 'medium'}

NARRATIVE PHASE: ${phase.toUpperCase()} (${i + 1}/${segCount}, progress ${(progress * 100).toFixed(0)}%)
${phase === 'opener' ? '→ This is the HOOK. Make it ENTER from off-screen with energy. Use motion that introduces the subject.' : ''}
${phase === 'build' ? '→ This is the DEVELOPMENT. The subject is on-screen — keep it alive with rhythmic in-place motion.' : ''}
${phase === 'climax' ? '→ This is the PEAK. Maximum energy — bold rotations, fast motion, dramatic flourishes.' : ''}
${phase === 'resolve' ? '→ This is the RESOLUTION. Settle confidently — final showcase, calmer motion, end on a hold.' : ''}

PRIMARY POOL FOR THIS PHASE (pick MOST of your presets from here):
${palette.join(', ')}

RECENT BEATS (avoid repeating these exact patterns):
${previous || '(this is the first beat)'}

${overused.length > 0 ? `OVERUSED — DO NOT PICK: ${overused.join(', ')}` : ''}

Hard rules:
- Pick EXACTLY ${kfPerSeg} preset${kfPerSeg === 1 ? '' : 's'} in play order.
- At least ${Math.max(1, Math.ceil(kfPerSeg * 0.7))} must come from the PRIMARY POOL above.
- No two consecutive presets can be identical.
- Make this beat VISUALLY DIFFERENT from the recent beats above.

Return JSON:
- preset_ids: array of EXACTLY ${kfPerSeg} preset ids
- intent: 1 short phrase describing this beat
- camera_preset: optional camera move from: cam_dolly_in, cam_zoom_to_target, cam_pull_back, cam_pan_lr, cam_pan_rl, cam_orbit, cam_punch_in, cam_handheld (or empty)`,
          response_json_schema: {
            type: 'object',
            properties: {
              preset_ids: { type: 'array', items: { type: 'string' } },
              intent: { type: 'string' },
              camera_preset: { type: 'string' },
            },
            required: ['preset_ids', 'intent'],
          },
        });
        // Sanitize: ensure exactly kfPerSeg valid, non-repeating-adjacent presets
        const fallbacks = ['showcase', 'pop', 'float', 'tilt', 'reveal', 'bounce'];
        let ids = (Array.isArray(subAgent.preset_ids) ? subAgent.preset_ids : [])
          .map(id => MOTION_PRESETS.includes(id) ? id : null)
          .filter(Boolean);
        // Pad with fallbacks if LLM returned too few
        let fb = 0;
        while (ids.length < kfPerSeg) {
          const cand = fallbacks[fb++ % fallbacks.length];
          if (ids[ids.length - 1] !== cand) ids.push(cand);
        }
        // Trim if too many
        ids = ids.slice(0, kfPerSeg);
        // Break adjacent duplicates
        for (let j = 1; j < ids.length; j++) {
          if (ids[j] === ids[j - 1]) {
            ids[j] = fallbacks.find(f => f !== ids[j - 1]) || 'pop';
          }
        }
        segments.push({
          beat: i + 1,
          preset_ids: ids,
          preset_id: ids[0],
          intent: subAgent.intent || '',
          camera_preset: CAMERA_PRESETS.includes(subAgent.camera_preset) ? subAgent.camera_preset : '',
          duration: segLen,
          keyframes_per_slide: kfPerSeg,
        });
      }

      return Response.json({
        step: 'choreograph',
        output: {
          segments,
          total_duration: totalDur,
          segment_count: segCount,
          keyframes_per_segment: kfPerSeg,
        },
        // For long-form ads we run an extra "sequence" pass that lets a
        // master director reorder all chained presets into a globally
        // coherent narrative arc before critique.
        next_step: 'sequence',
      });
    }

    // ── STEP 4.6: SEQUENCE (master director reorder) ───────────────────
    // Sub-agents only see their own beat. This step gives a SINGLE master
    // director the full list of chained presets and asks it to decide the
    // BEST GLOBAL ORDER — opener → build → climax → close — so the ad
    // feels intentional instead of like 10 disconnected mini-loops.
    if (step === 'sequence') {
      const { choreograph, vibe, research, analysis } = state;
      if (!choreograph?.segments?.length) {
        // Nothing to reorder — skip straight to critique
        return Response.json({ step: 'sequence', output: null, next_step: 'critique' });
      }

      // Flatten all chained presets into one ordered list with their origin beat
      const flat = [];
      choreograph.segments.forEach((seg, beatIdx) => {
        const ids = Array.isArray(seg.preset_ids) ? seg.preset_ids : [seg.preset_id];
        ids.forEach((id, slot) => {
          if (MOTION_PRESETS.includes(id)) flat.push({ id, beat: beatIdx + 1, slot });
        });
      });

      const directorOutput = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the MASTER director of a long-form motion ad. ${choreograph.segment_count} sub-agents each picked 2 presets for their beat. Now YOU decide the BEST GLOBAL ORDER for all ${flat.length} presets so the final ad has a coherent narrative arc.

OVERALL VIBE: "${vibe}"
SUBJECT: ${analysis?.subject || ''}
PACE: ${research?.recommended_pace || 'medium'}
TOTAL DURATION: ${choreograph.total_duration}s

CURRENT SUB-AGENT CHAIN (in beat order):
${flat.map((f, i) => `${i + 1}. ${f.id} (from beat ${f.beat})`).join('\n')}

Your job: pick the optimal play order. Reasoning to apply:
- OPENING (first 20%): grab attention with a strong entrance — slide-in-*, drop-in, fly-across, zoomin, reveal
- BUILD (20-60%): rhythmic motion that holds interest — pop, bounce, wobble, tilt, float, showcase
- CLIMAX (60-85%): peak energy — spin, barrel, orbit, swoop, shake, flip
- RESOLUTION (last 15%): land the message confidently — showcase, chat-zoom, zoomout, tilt-up, pop

Avoid putting two identical presets back-to-back. Vary direction (left/right/up/down). Don't drift in one direction the whole time.

Return JSON:
- ordered_preset_ids: array of EXACTLY ${flat.length} preset ids — must be a permutation of the input list (every input preset appears exactly once)
- reasoning: 1-2 sentences on the narrative arc you chose`,
        response_json_schema: {
          type: 'object',
          properties: {
            ordered_preset_ids: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' },
          },
          required: ['ordered_preset_ids'],
        },
      });

      // Validate: every returned id must be a real preset, and the multiset
      // must match the input (so nothing is dropped/duplicated). If invalid,
      // fall back to the original sub-agent order.
      const inputCounts = {};
      flat.forEach(f => { inputCounts[f.id] = (inputCounts[f.id] || 0) + 1; });
      const proposed = (directorOutput.ordered_preset_ids || []).filter(id => MOTION_PRESETS.includes(id));
      const proposedCounts = {};
      proposed.forEach(id => { proposedCounts[id] = (proposedCounts[id] || 0) + 1; });
      const isValidPermutation = proposed.length === flat.length &&
        Object.keys(inputCounts).every(k => inputCounts[k] === proposedCounts[k]);

      // Deterministic narrative-arc fallback: if the LLM's permutation is invalid,
      // bucket every preset into opener/build/climax/resolve by its identity, then
      // lay them out across the timeline in narrative order. This GUARANTEES the
      // final ad has variety even when the LLM director fails.
      const arcFallback = () => {
        const POOL = {
          opener:  new Set(['slide-in-left', 'slide-in-right', 'slide-up', 'drop-in', 'fly-across', 'swoop', 'reveal', 'zoomin']),
          climax:  new Set(['spin', 'barrel', 'orbit', 'shake', 'flip', 'zigzag', 'chat-zoom']),
          resolve: new Set(['showcase', 'tilt-up', 'zoomout']),
        };
        const buckets = { opener: [], build: [], climax: [], resolve: [] };
        flat.forEach(f => {
          if (POOL.opener.has(f.id))      buckets.opener.push(f.id);
          else if (POOL.climax.has(f.id)) buckets.climax.push(f.id);
          else if (POOL.resolve.has(f.id))buckets.resolve.push(f.id);
          else                             buckets.build.push(f.id);
        });
        // Splay each bucket so identical presets aren't back-to-back
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
        return [
          ...splay(buckets.opener),
          ...splay(buckets.build),
          ...splay(buckets.climax),
          ...splay(buckets.resolve),
        ];
      };
      const finalOrder = isValidPermutation ? proposed : arcFallback();

      return Response.json({
        step: 'sequence',
        output: {
          ordered_preset_ids: finalOrder,
          reasoning: isValidPermutation
            ? (directorOutput.reasoning || '')
            : 'Director permutation invalid — applied deterministic narrative arc (opener → build → climax → resolve).',
          used_director_order: isValidPermutation,
        },
        next_step: 'critique',
      });
    }

    // ── STEP 5: REFINE ─────────────────────────────────────────────────
    if (step === 'refine') {
      const { plan, critique, vibe, choreograph, target_duration } = state;

      const refined = await base44.integrations.Core.InvokeLLM({
        prompt: `Apply the director's critique and produce v2 of the plan. Keep what works; fix every issue called out.

ORIGINAL PLAN:
${JSON.stringify(plan, null, 2)}

CRITIQUE:
- Issues: ${(critique?.issues || []).join(' · ')}
- Improvements: ${(critique?.improvements || []).join(' · ')}

Goal vibe: "${vibe}"

Return the FINAL JSON plan with the same shape:
- tagline: 2-6 words or empty
- preset_id: ONE of: ${MOTION_PRESETS.join(', ')}
- camera_preset: ONE of: ${CAMERA_PRESETS.join(', ')} (or empty)
- background: ONE of: ${BACKGROUNDS.join(', ')}
- device: ONE of: ${DEVICES.join(', ')}
- duration: integer 3-8
- reasoning: one sentence on what changed and why it's now better`,
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

      // For long-form ads, the refine LLM only knows about the v1 single-preset
      // duration (3-8s). Override with the REAL total duration from choreograph
      // so the plan card shows the truth (e.g. 30s, not 4s).
      const realDuration = choreograph?.total_duration || target_duration || refined.duration;
      const finalRefined = { ...refined, duration: realDuration };

      return Response.json({
        step: 'refine',
        output: finalRefined,
        next_step: 'done',
      });
    }

    // ── STEP 6: DONE — build render URL ────────────────────────────────
    if (step === 'done') {
      const { plan, media_url, email, choreograph, sequence, speed } = state;
      if (!plan || !media_url) {
        return Response.json({ error: 'Missing plan or media_url for done step' }, { status: 400 });
      }

      // Sanitize against allowed values
      const preset = MOTION_PRESETS.includes(plan.preset_id) ? plan.preset_id : 'showcase';
      const background = BACKGROUNDS.includes(plan.background) ? plan.background : 'sunset';
      const device = DEVICES.includes(plan.device) ? plan.device : 'iphone';
      const playSpeed = Math.max(0.25, Math.min(4, Number(speed) || 1));

      // If a choreograph (sub-agent loop) ran, use its segments as a chain.
      let duration;
      const params = new URLSearchParams({
        auto: '1',
        text: plan.tagline || '',
        device,
        background,
        media: media_url,
      });

      if (choreograph?.segments?.length) {
        // Prefer the master director's globally-sequenced order if available.
        // Otherwise fall back to the raw sub-agent beat order.
        let chainIds;
        if (Array.isArray(sequence?.ordered_preset_ids) && sequence.ordered_preset_ids.length > 0) {
          chainIds = sequence.ordered_preset_ids
            .map(id => MOTION_PRESETS.includes(id) ? id : 'showcase');
        } else {
          chainIds = [];
          for (const seg of choreograph.segments) {
            const ids = Array.isArray(seg.preset_ids) ? seg.preset_ids : [seg.preset_id];
            for (const id of ids) {
              chainIds.push(MOTION_PRESETS.includes(id) ? id : 'showcase');
            }
          }
        }
        const chain = chainIds.join(',');
        duration = Math.max(8, Math.min(60, Math.round(choreograph.total_duration || 12)));
        params.set('chain', chain);
        params.set('duration', String(duration));
        // Use the first segment's camera if any
        const firstCam = choreograph.segments.find(s => CAMERA_PRESETS.includes(s.camera_preset))?.camera_preset;
        if (firstCam) params.set('camera', firstCam);
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