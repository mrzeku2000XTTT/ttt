import { base44 } from "@/api/base44Client";
import { etaAdvancedSchema } from "@/lib/etaAdvancedSchema";
import { buildETADirectorPrompt } from "@/lib/etaDirectorPrompt";
export { ETA_COMPONENTS } from "@/lib/etaComponents";

export const createBlankETAScene = (component = "TitleCard") => ({
  component, purpose: "New scene", duration: 3, headline: "New scene",
  voiceover: "Add the narration for this scene.", visual: "Describe the visual direction.",
  motion: "Ease in", transition: "Match cut", hyperframe_animation: "slide_up", advanced: {},
});

const PASS_LABELS = [
  "Analyzing intent and narrative",
  "Filling component direction",
  "Generating motion and keyframes",
  "Coordinating scene continuity",
  "Validating and repairing the plan",
];

const getETAPassCount = (brief, files) => {
  const length = String(brief.description || "").trim().length;
  let passes = 1;
  if (length > 60 || brief.url || brief.style) passes = 2;
  if (length > 180 || files.length > 0) passes = 3;
  if (length > 400 || Number(brief.duration) > 30) passes = 4;
  if (length > 800 || (files.length > 2 && Number(brief.duration) >= 60)) passes = 5;
  return passes;
};

const sceneSchema = {
  type: "object",
  properties: {
    component: { type: "string" }, purpose: { type: "string" },
    duration: { type: "number" }, headline: { type: "string" },
    voiceover: { type: "string" }, visual: { type: "string" },
    motion: { type: "string" }, transition: { type: "string" },
    hyperframe_animation: { type: "string", enum: ["fade_in", "fade_out", "slide_up", "slide_left", "pop", "typewriter", "zoom", "shake"] },
    advanced: etaAdvancedSchema,
  },
  required: ["component", "purpose", "duration", "headline", "voiceover", "visual", "motion", "transition", "hyperframe_animation", "advanced"],
};

export async function createETAPlan(brief, files, onStatus) {
  onStatus("Preparing reference media");
  const uploads = await Promise.all(files.map((file) =>
    base44.integrations.Core.UploadPrivateFile({ file }).then((result) => result.file_uri)
  ));
  const maxPasses = getETAPassCount(brief, files);
  let currentPlan = null;
  for (let passIndex = 1; passIndex <= maxPasses; passIndex += 1) {
    onStatus(`Pass ${passIndex}/${maxPasses}: ${PASS_LABELS[passIndex - 1]}`);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildETADirectorPrompt(brief, { passIndex, maxPasses, currentPlan }),
      file_urls: uploads.length ? uploads : undefined,
      response_json_schema: {
        type: "object",
        properties: { title: { type: "string" }, narrative: { type: "string" }, scenes: { type: "array", items: sceneSchema } },
        required: ["title", "narrative", "scenes"],
      },
    });
    currentPlan = { ...result, scenes: result.scenes.map((scene) => ({ ...scene, advanced: scene.advanced || {} })) };
  }
  return currentPlan;
}