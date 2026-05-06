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
      const { vibe, research, analysis } = state;

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

      return Response.json({
        step: 'plan',
        output: plan,
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

    // ── STEP 5: REFINE ─────────────────────────────────────────────────
    if (step === 'refine') {
      const { plan, critique, vibe } = state;

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

      return Response.json({
        step: 'refine',
        output: refined,
        next_step: 'done',
      });
    }

    // ── STEP 6: DONE — build render URL ────────────────────────────────
    if (step === 'done') {
      const { plan, media_url, email } = state;
      if (!plan || !media_url) {
        return Response.json({ error: 'Missing plan or media_url for done step' }, { status: 400 });
      }

      // Sanitize against allowed values
      const preset = MOTION_PRESETS.includes(plan.preset_id) ? plan.preset_id : 'showcase';
      const background = BACKGROUNDS.includes(plan.background) ? plan.background : 'sunset';
      const device = DEVICES.includes(plan.device) ? plan.device : 'iphone';
      const duration = Math.max(3, Math.min(8, parseInt(plan.duration) || 4));

      const params = new URLSearchParams({
        auto: '1',
        text: plan.tagline || '',
        device,
        background,
        preset,
        duration: String(duration),
        media: media_url,
      });
      if (plan.camera_preset && CAMERA_PRESETS.includes(plan.camera_preset)) {
        params.set('camera', plan.camera_preset);
      }
      if (email) params.set('email', email);

      return Response.json({
        step: 'done',
        output: { plan: { ...plan, preset_id: preset, background, device, duration } },
        render_url: `/UltraMock?${params.toString()}`,
      });
    }

    return Response.json({ error: `Unknown step: ${step}` }, { status: 400 });
  } catch (error) {
    console.error('[katagamiMasterAgent] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});