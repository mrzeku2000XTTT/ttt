import { base44 } from "@/api/base44Client";
import { etaAdvancedSchema } from "@/lib/etaAdvancedSchema";
import { buildETADirectorPrompt } from "@/lib/etaDirectorPrompt";
export { ETA_COMPONENTS } from "@/lib/etaComponents";

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
    advanced: etaAdvancedSchema,
  },
  required: ["component", "purpose", "duration", "headline", "voiceover", "visual", "motion", "transition", "hyperframe_animation", "advanced"],
};

export async function createETAPlan(brief, files, onStatus) {
  onStatus("Preparing reference media");
  const uploads = await Promise.all(files.map((file) =>
    base44.integrations.Core.UploadPrivateFile({ file }).then((result) => result.file_uri)
  ));
  onStatus("Directing real components and frame motion");
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: buildETADirectorPrompt(brief),
    file_urls: uploads.length ? uploads : undefined,
    response_json_schema: {
      type: "object",
      properties: { title: { type: "string" }, narrative: { type: "string" }, scenes: { type: "array", items: sceneSchema } },
      required: ["title", "narrative", "scenes"],
    },
  });
  return { ...result, scenes: result.scenes.map((scene) => ({ ...scene, advanced: scene.advanced || {} })) };
}