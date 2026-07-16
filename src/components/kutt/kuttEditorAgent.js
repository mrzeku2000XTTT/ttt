import { base44 } from "@/api/base44Client";

const EDITOR_SCHEMA = {
  type: "object",
  properties: {
    clips: {
      type: "array",
      description: "Scene placements on the timeline",
      items: {
        type: "object",
        properties: {
          scene_index: { type: "number", description: "Index into the scenes array this editor received (0-based)" },
          track: { type: "number", description: "0=V1 main story, 1=V2 overlay/B-roll" },
          start: { type: "number", description: "Start time in seconds within this segment (0-based, clips should be back-to-back)" },
          duration: { type: "number", description: "Duration in seconds (2-6 for images, 4/6/8 for video)" },
        },
        required: ["scene_index", "track", "start"],
      },
    },
    hyperframes: {
      type: "array",
      description: "Text overlays and animations to engage viewers",
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text overlay content (short, punchy, 3-8 words)" },
          start: { type: "number", description: "Start time within this segment (0-based)" },
          duration: { type: "number", description: "How long the text stays on screen" },
          animation: { type: "string", enum: ["fade_in", "fade_out", "slide_up", "slide_left", "pop", "typewriter", "zoom", "shake"] },
          style_preset: { type: "string", enum: ["bold_white", "caption", "hook", "cta", "advice"] },
        },
        required: ["text", "start", "duration"],
      },
    },
    notes: { type: "string", description: "Editor's reasoning for these edit decisions" },
  },
  required: ["clips"],
};

// Run a single editor agent on its segment of scenes.
// Each editor receives its scenes + the Director's brief and uses tools to
// place clips, layer B-roll, and add text/animation hyperframes.
export async function runEditorAgent({ editorId, brief, scenes, consistencyMode, onStep }) {
  const label = `✂️ Editor #${editorId} cutting ${scenes.length} scene${scenes.length > 1 ? "s" : ""}…`;
  onStep?.({ label, status: "running", agent: `editor-${editorId}` });

  const scenesJson = scenes.map((s, i) => ({
    index: i,
    visual_prompt: s.visual_prompt,
    media: s.media,
    voiceover: s.voiceover,
    caption: s.caption,
    duration: s.duration,
  }));

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are Editor Agent #${editorId}, a professional video editor working under the KUTT Director in a multi-agent pipeline.

DIRECTOR'S CREATIVE BRIEF:
${brief}

CONSISTENCY MODE: ${consistencyMode}
${consistencyMode === "strict" ? "ALL scenes must maintain a consistent visual style and subject. Do not deviate from the topic." : "Some variation between scenes is acceptable — different angles/types within the topic are fine."}

YOUR SCENES (media already generated for each):
${JSON.stringify(scenesJson, null, 2)}

YOUR JOB: Place these scenes on the timeline and add text overlays (hyperframes) for maximum engagement.

TOOLS YOU HAVE:
- Place scenes on track 0 (V1 main story) or track 1 (V2 overlay/B-roll)
- Add text hyperframes with animations: fade_in, slide_up, pop, typewriter, zoom, shake
- Style presets: "hook" (cyan, bold, top), "caption" (white, bottom), "cta" (magenta, center), "bold_white" (center), "advice" (center, subtle)

EDITING PRINCIPLES:
- Keep clips back-to-back on V1 (no gaps) unless intentionally layering B-roll on V2
- Start times are 0-based within your segment (the system offsets them later)
- Add 1-2 text hyperframes per scene: hooks for the opening, captions for clarity, CTAs for the end
- Match animation energy to the scene: "pop" for energetic hooks, "slide_up" for captions, "typewriter" for emphasis, "fade_in" for smooth intros
- Keep text SHORT and punchy (3-8 words max per overlay)

Return your edit plan.`,
    response_json_schema: EDITOR_SCHEMA,
  });

  onStep?.({ label, status: "done", agent: `editor-${editorId}` });
  return { plan: result, notes: result.notes || "" };
}