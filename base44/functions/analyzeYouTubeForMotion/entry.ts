// Analyzes a YouTube video and produces a motion plan the UltraMock AI agent
// can execute on the canvas. We pull the title/description/transcript context
// via the LLM (with web search), plus several thumbnail frames so the model
// gets actual visual data of the animation style. The output is a structured
// plan: scene beats, recommended motion + camera presets, timing, and a
// short list of tool calls the agent should run on the canvas.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Extract a YouTube video ID from any common URL form
function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
        /^([A-Za-z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
        const m = String(url).match(p);
        if (m) return m[1];
    }
    return null;
}

const MOTION_PRESET_IDS = [
    "spin","tilt","pop","float","reveal","flip","wobble","zoomin","zoomout",
    "tilt-up","showcase","shake","barrel","slide-in-left","slide-in-right",
    "slide-up","drop-in","fly-across","orbit","bounce","pendulum","zigzag",
    "swoop","chat-zoom","typewriter-zoom","words-pop"
];
const CAMERA_PRESET_IDS = [
    "cam_dolly_in","cam_zoom_to_target","cam_pull_back","cam_pan_lr",
    "cam_pan_rl","cam_orbit","cam_punch_in","cam_handheld"
];

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { url, focus_hint } = await req.json();
        const videoId = extractVideoId(url);
        if (!videoId) {
            return Response.json({ error: 'Could not parse a YouTube video ID from that URL.' }, { status: 400 });
        }

        // YouTube hosts up to 4 thumbnail frames per video at predictable URLs.
        // 0 = mid-frame, 1 = first third, 2 = mid, 3 = last third. Plus the cover.
        const thumbs = [
            `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            `https://img.youtube.com/vi/${videoId}/1.jpg`,
            `https://img.youtube.com/vi/${videoId}/2.jpg`,
            `https://img.youtube.com/vi/${videoId}/3.jpg`,
        ];

        const prompt = `You are analyzing a YouTube video to recreate its motion design inside a 3D device-mockup canvas tool called UltraMock. Watch the video (use web search for transcript / metadata) and study the attached thumbnail frames (sampled across the video timeline).

VIDEO: https://www.youtube.com/watch?v=${videoId}
${focus_hint ? `USER FOCUS: ${focus_hint}` : ""}

Your job:
1. Identify the core animation style (e.g. "smooth zoom-in to a chat bubble", "fast slide-ins with bouncy text pops", "slow cinematic dolly + barrel roll").
2. Produce a FRAME-BY-FRAME breakdown describing what's happening visually at each sampled moment — camera position, subject motion, transitions, easing, speed. Be specific (e.g. "0:00–0:02 — fast dolly-in toward phone, screen punches up by 1.4×, subtle barrel roll on Y axis"). This is the most important field — the user wants to see HOW the motion was constructed.
3. Break the video into 3-6 scene beats with approximate timing and the dominant motion preset for each.
4. For each beat, recommend ONE motion preset (acts on a single device) and/or ONE camera preset (acts on the whole scene).
5. Produce a short, ready-to-run plan the AI agent will execute on the canvas. The agent already has a device on screen — your plan should ASSUME a device is already selected and chain presets/camera moves to recreate the video's feel.

AVAILABLE MOTION PRESETS (one item at a time): ${MOTION_PRESET_IDS.join(", ")}
AVAILABLE CAMERA PRESETS (whole scene): ${CAMERA_PRESET_IDS.join(", ")}

Return JSON:
{
  "title": "...",
  "style_summary": "1-2 sentence description of the animation style",
  "frame_breakdown": [
    { "timestamp": "0:00", "camera": "static wide shot", "subject_motion": "phone slides in from right with slight tilt", "easing": "ease-out", "notes": "screen flashes white at end" },
    { "timestamp": "0:02", "camera": "slow dolly-in", "subject_motion": "phone scales up 1.2×, rotates -8° on Y", "easing": "ease-in-out", "notes": "..." }
  ],
  "total_duration_seconds": 4-12,
  "background": "sunset|ocean|forest|peach|mono|ivory|midnight|candy|white|black",
  "tagline": "optional short text overlay (or empty)",
  "beats": [
    { "t_start": 0, "t_end": 1.5, "description": "...", "motion_preset": "slide-in-left", "camera_preset": null }
  ],
  "agent_plan": [
    { "name": "set_background", "args": { "background": "midnight" } },
    { "name": "set_duration", "args": { "seconds": 6 } },
    { "name": "chain_presets", "args": { "preset_ids": ["slide-in-left","chat-zoom","words-pop"] } },
    { "name": "apply_camera_preset", "args": { "preset_id": "cam_dolly_in", "mode": "replace" } }
  ]
}

Rules:
- Only use preset IDs from the lists above.
- agent_plan must contain ONLY tool calls the agent supports: set_background, set_duration, chain_presets, apply_camera_preset, clear_camera, add_text, update_item.
- NEVER include render_mp4 in agent_plan.
- Keep agent_plan short (3-6 calls max).`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            file_urls: thumbs,
            add_context_from_internet: true,
            model: "gemini_3_1_pro",
            response_json_schema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    style_summary: { type: "string" },
                    frame_breakdown: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                timestamp: { type: "string" },
                                camera: { type: "string" },
                                subject_motion: { type: "string" },
                                easing: { type: "string" },
                                notes: { type: "string" },
                            }
                        }
                    },
                    total_duration_seconds: { type: "number" },
                    background: { type: "string" },
                    tagline: { type: "string" },
                    beats: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                t_start: { type: "number" },
                                t_end: { type: "number" },
                                description: { type: "string" },
                                motion_preset: { type: "string" },
                                camera_preset: { type: "string" },
                            }
                        }
                    },
                    agent_plan: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                args: {
                                    type: "object",
                                    additionalProperties: true,
                                    properties: {
                                        background: { type: "string" },
                                        seconds: { type: "number" },
                                        preset_id: { type: "string" },
                                        preset_ids: { type: "array", items: { type: "string" } },
                                        mode: { type: "string" },
                                        text: { type: "string" },
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        fontSize: { type: "number" },
                                        color: { type: "string" },
                                        animation: { type: "string" },
                                    }
                                },
                            },
                            required: ["name"],
                        }
                    }
                },
                required: ["style_summary", "agent_plan"],
            }
        });

        // Sanitize: strip any agent_plan call that uses unknown presets or banned tools
        const ALLOWED_TOOLS = new Set([
            "set_background","set_duration","chain_presets","apply_camera_preset",
            "clear_camera","clear_timeline","add_text","update_item","apply_preset"
        ]);
        const cleanPlan = (response.agent_plan || []).filter((c) => {
            if (!c?.name || !ALLOWED_TOOLS.has(c.name)) return false;
            if (c.name === "apply_camera_preset") {
                return CAMERA_PRESET_IDS.includes(c.args?.preset_id);
            }
            if (c.name === "apply_preset") {
                return MOTION_PRESET_IDS.includes(c.args?.preset_id);
            }
            if (c.name === "chain_presets") {
                const ids = (c.args?.preset_ids || []).filter((id) => MOTION_PRESET_IDS.includes(id));
                if (!ids.length) return false;
                c.args.preset_ids = ids;
            }
            return true;
        });

        return Response.json({
            success: true,
            video_id: videoId,
            title: response.title || "",
            style_summary: response.style_summary || "",
            frame_breakdown: response.frame_breakdown || [],
            total_duration_seconds: response.total_duration_seconds || 6,
            background: response.background || null,
            tagline: response.tagline || "",
            beats: response.beats || [],
            agent_plan: cleanPlan,
            thumbnails: thumbs,
        });
    } catch (error) {
        console.error('analyzeYouTubeForMotion failed:', error);
        return Response.json({ error: error.message || 'Failed to analyze video' }, { status: 500 });
    }
});