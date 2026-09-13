import { base44 } from "@/api/base44Client";

export const ETA_COMPONENTS = [
  "TitleCard", "NumberDisplay", "Glass", "BrowserWindow", "PhoneWindow",
  "Cards", "Cards2", "Cards3", "Cards4", "IPhoneAnimated", "MacBookAnimated",
  "DivMorph", "SearchAnimation", "LogoAnimation", "UIAnimation", "Video",
];

export const createBlankETAScene = (component = "TitleCard") => ({
  component, purpose: "New scene", duration: 3, headline: "New scene",
  voiceover: "Add the narration for this scene.", visual: "Describe the visual direction.",
  motion: "Ease in", transition: "Match cut", hyperframe_animation: "slide_up", advanced: {},
});

const sceneSchema = {
  type: "object",
  properties: {
    component: { type: "string" }, purpose: { type: "string" },
    duration: { type: "number" }, headline: { type: "string" },
    voiceover: { type: "string" }, visual: { type: "string" },
    motion: { type: "string" }, transition: { type: "string" },
    hyperframe_animation: { type: "string", enum: ["fade_in", "fade_out", "slide_up", "slide_left", "pop", "typewriter", "zoom", "shake"] },
  },
  required: ["component", "purpose", "duration", "headline", "voiceover", "visual", "motion", "transition"],
};

export async function createETAPlan(brief, files, onStatus) {
  onStatus("Preparing reference media");
  const uploads = await Promise.all(files.map((file) =>
    base44.integrations.Core.UploadPrivateFile({ file }).then((result) => result.file_uri)
  ));
  onStatus("Directing scenes, pacing, and motion");
  return base44.integrations.Core.InvokeLLM({
    prompt: `You are the creative director for ETA, Enhanced Timeline Animator. Create an original ${brief.duration}-second ${brief.format} product animation plan. Product: ${brief.name}. Link: ${brief.url || "none"}. Audience: ${brief.audience}. Style: ${brief.style}. Brief: ${brief.description}. Use only these components: ${ETA_COMPONENTS.join(", ")}. Every scene must choose a hyperframe_animation from fade_in, fade_out, slide_up, slide_left, pop, typewriter, zoom, or shake. Build a concise narrative for frame-accurate Remotion playback with purposeful camera motion, readable pacing, useful voiceover, and directional transitions. Never mention or imitate another named product.`,
    file_urls: uploads.length ? uploads : undefined,
    response_json_schema: {
      type: "object",
      properties: { title: { type: "string" }, narrative: { type: "string" }, scenes: { type: "array", items: sceneSchema } },
      required: ["title", "narrative", "scenes"],
    },
  });
}