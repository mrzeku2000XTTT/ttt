import { base44 } from "@/api/base44Client";

const URL_REGEX = /https?:\/\/[^\s]+/i;

const NO_TEXT =
  " ABSOLUTELY NO TEXT: no words, no letters, no numbers, no labels, no logos, no captions, no watermarks, no UI copy anywhere in the frame.";

const RESEARCH_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "What this URL/page is about" },
    key_visuals: { type: "string", description: "Key visual elements, layout, imagery" },
    brand_colors: { type: "string", description: "Primary brand colors as hex values" },
    tone: { type: "string", description: "Tone and mood of the brand/content" },
  },
  required: ["summary"],
};

const ART_DIRECTOR_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short 2-4 word title" },
    image_prompt: { type: "string", description: "ONE detailed background image prompt — Apple aesthetic, NO text in image" },
    image_prompt_2: { type: "string", description: "Optional second image for crossfade. Empty string if not needed." },
    overlay_text: { type: "string", description: "1-3 word text to animate over the graphic" },
    accent_color: { type: "string", description: "Hex color e.g. #0A84FF" },
    motion_style: { type: "string", enum: ["ken_burns", "crossfade"] },
    reasoning: { type: "string", description: "Brief reasoning for the design choices" },
    is_edit: { type: "boolean", description: "Whether this is an edit of a previous spec" },
  },
  required: ["title", "image_prompt", "overlay_text", "accent_color"],
};

const COPYWRITER_SCHEMA = {
  type: "object",
  properties: {
    response: { type: "string", description: "Brief conversational response to the user (1-2 sentences, friendly, Apple-style)" },
    style_notes: { type: "string", description: "Optional style notes for the user" },
  },
  required: ["response"],
};

/**
 * Multi-agent orchestrator for HunterBeat.
 * Runs Researcher (if URL), Art Director, and Copywriter agents.
 * Calls onThought(agent, text) as each agent completes.
 */
export async function orchestrate({
  userInput,
  conversation = [],
  skills = [],
  notes = [],
  durationSeconds = 6,
  lastSpec = null,
  onThought,
}) {
  const url = userInput.match(URL_REGEX)?.[0];
  const learnedSkills = skills.map((s) => `### ${s.title}\n${(s.content || "").slice(0, 2000)}`).join("\n\n");
  const userNotes = notes.map((n) => n.text).join("\n- ");
  const conversationContext = conversation
    .slice(-8)
    .map((m) => `${m.role}: ${m.text || m.response || ""}`)
    .join("\n");
  const lastSpecContext = lastSpec
    ? `Previous motion spec (edit if user asks for changes):\n${JSON.stringify(lastSpec, null, 2)}`
    : "";

  let researchContext = "";
  let researchColors = "";

  // Phase 1: Researcher (if URL detected)
  if (url) {
    onThought?.("Researcher", `Researching ${url}…`);
    try {
      const research = await base44.integrations.Core.InvokeLLM({
        prompt: `Research this URL for a motion graphic design:\nURL: ${url}\n\nExtract: what it is, key visual elements, brand colors (as hex), tone/mood.`,
        response_json_schema: RESEARCH_SCHEMA,
        add_context_from_internet: true,
      });
      researchContext = `Research results:\nSummary: ${research.summary}\nKey visuals: ${research.key_visuals || ""}\nBrand colors: ${research.brand_colors || ""}\nTone: ${research.tone || ""}`;
      researchColors = research.brand_colors || "";
      onThought?.("Researcher", `Analyzed — ${research.summary?.slice(0, 120)}`);
    } catch {
      onThought?.("Researcher", `Couldn't reach ${url}, proceeding without research.`);
    }
  }

  // Phase 2: Art Director + Copywriter in parallel
  const [art, copy] = await Promise.all([
    base44.integrations.Core.InvokeLLM({
      prompt:
        `You are the Art Director for HunterBeat, an Apple-style motion graphics studio.\n\n` +
        (researchContext ? `${researchContext}\n\n` : "") +
        (researchColors ? `Suggested brand colors: ${researchColors}\n` : "") +
        `Conversation so far:\n${conversationContext}\n\n` +
        (lastSpecContext ? `${lastSpecContext}\n\n` : "") +
        (learnedSkills ? `User's ingested skills (follow their principles):\n${learnedSkills}\n\n` : "") +
        (userNotes ? `User preferences:\n- ${userNotes}\n\n` : "") +
        `Duration: ${durationSeconds} seconds\n\n` +
        `User request: "${userInput}"\n\n` +
        `Design a motion-graphic spec. If the user is asking to edit a previous spec, modify it accordingly.\n` +
        `Style: Apple HIG, SF typography, frosted glass, soft depth, neutral palette with one accent, rounded corners, generous whitespace.\n` +
        `Image prompts: 2-4 sentences, highly visual, NO text in the image.\n` +
        `Return the full spec.`,
      response_json_schema: ART_DIRECTOR_SCHEMA,
      model: "claude_sonnet_4_6",
    }).then((r) => {
      onThought?.("Art Director", r.reasoning || "Motion spec designed");
      return r;
    }),

    base44.integrations.Core.InvokeLLM({
      prompt:
        `You are the Copywriter for HunterBeat. Write a brief, warm, conversational response to the user.\n\n` +
        `Conversation so far:\n${conversationContext}\n\n` +
        `User input: "${userInput}"\n\n` +
        (lastSpecContext ? `${lastSpecContext}\n\n` : "") +
        `Keep it 1-2 sentences, friendly, Apple-style. If editing, acknowledge the change. Be specific about what you changed.`,
      response_json_schema: COPYWRITER_SCHEMA,
    }).then((r) => {
      onThought?.("Copywriter", "Response crafted");
      return r;
    }),
  ]);

  const imagePrompts = [art.image_prompt, art.image_prompt_2].filter(Boolean);

  return {
    spec: {
      title: art.title,
      overlay_text: art.overlay_text,
      accent_color: art.accent_color || "#0A84FF",
      motion_style: art.motion_style || "ken_burns",
      background: "#000000",
      durationSeconds,
    },
    imagePrompts,
    response: copy.response,
    styleNotes: copy.style_notes,
    isEdit: art.is_edit || !!lastSpec,
  };
}