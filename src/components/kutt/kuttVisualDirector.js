import { base44 } from "@/api/base44Client";

/**
 * KUTT Visual Director — kills generic backgrounds.
 * Takes the scriptwriter's rough visual_prompt and rewrites it as a
 * real cinematography order: lens, camera move, lighting, palette,
 * texture, subject blocking. Grounded in the site's real visual identity.
 */

const VISUAL_SCHEMA = {
  type: "object",
  properties: {
    look: { type: "string", description: "the one locked look for the whole piece — palette, grade, lens language" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          visual_prompt: { type: "string", description: "the full cinematic prompt, 60-110 words" },
          motion: { type: "string", description: "the camera/subject motion for video generation, one line" },
        },
        required: ["visual_prompt"],
      },
    },
  },
  required: ["look", "scenes"],
};

const BANNED = [
  "abstract background", "generic tech background", "swirling particles",
  "blue gradient", "digital network lines", "glowing orb", "stock footage look",
  "person typing on laptop", "floating cubes", "binary code rain",
];

export async function directVisuals({ scenes, brief, topic, visualIdentity, consistencyMode, onStep }) {
  if (!scenes.length) return scenes;

  onStep?.({ label: "🎥 Visual Director locking the look…", status: "running", agent: "director" });

  let out;
  try {
    out = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a commercial cinematographer and visual director. Rewrite each scene's visual prompt into a real shot order that a top-tier generator will render as a STUNNING, specific frame — never a generic background.

TOPIC: ${topic}
DIRECTOR'S BRIEF: ${brief}
REAL BRAND VISUAL IDENTITY (use these actual colours/type/imagery): ${visualIdentity || "not established — invent one cohesive designed look and hold it"}
CONSISTENCY: ${consistencyMode === "strict" ? "STRICT — identical palette, grade, lens family and subject treatment across every scene" : "flexible — same world, different angles"}

SCENES TO DIRECT:
${scenes.map((s, i) => `${i + 1}. (${s.duration}s, ${s.media}) ${s.visual_prompt}${s.caption ? ` | caption: "${s.caption}"` : ""}`).join("\n")}

Every rewritten visual_prompt MUST contain, concretely:
- A specific SUBJECT doing something specific in a specific real place — never a mood with no subject.
- LENS + FRAMING: e.g. "35mm anamorphic, low three-quarter angle, subject filling left third".
- CAMERA MOVE: e.g. "slow dolly-in with a whip-pan settle", "crane rise", "handheld push".
- LIGHTING: named and motivated — e.g. "hard low-key sidelight from a practical neon sign, deep falloff".
- PALETTE: 2-3 exact colours from the brand identity.
- TEXTURE/GRADE: e.g. "fine 35mm grain, halation on highlights, matte blacks".
- DEPTH: foreground element + midground subject + background layer.
- No text, logos or UI labels rendered in the image.

ABSOLUTELY BANNED (instant rejection): ${BANNED.join("; ")}. If the original prompt was one of these, replace it with a bold, concrete, art-directed scene instead.

Write "motion" for each scene as the single most cinematic movement in that shot.
Return exactly ${scenes.length} scenes, in order.`,
      response_json_schema: VISUAL_SCHEMA,
      model: "claude_sonnet_4_6",
    });
  } catch {
    onStep?.({ label: "🎥 Visual Director locking the look…", status: "error", agent: "director" });
    return scenes;
  }

  const directed = out?.scenes || [];
  onStep?.({ label: `🎥 Look locked — ${directed.length} shots art-directed`, status: "done", agent: "director" });

  return scenes.map((s, i) => {
    const d = directed[i];
    if (!d?.visual_prompt) return s;
    return {
      ...s,
      visual_prompt: `${d.visual_prompt}${d.motion ? ` Camera: ${d.motion}.` : ""} Consistent look: ${out.look}. Cinematic, photoreal, no text or logos.`,
      motion: d.motion || "",
    };
  });
}