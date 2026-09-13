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

const browserKeyframeSchema = { type: "object", properties: { time: { type: "number" }, content: { type: "string" }, x: { type: "number" }, y: { type: "number" }, z: { type: "number" }, scrollY: { type: "number" }, rotate: { type: "boolean" } }, required: ["time", "content"] };
const zoomKeyframeSchema = { type: "object", properties: { time: { type: "number" }, selector: { type: "string" }, x: { type: "number" }, y: { type: "number" }, scale: { type: "number" }, duration: { type: "number" }, easing: { type: "string" } }, required: ["time", "scale"] };
const cursorStepSchema = { type: "object", properties: { time: { type: "number" }, selector: { type: "string" }, duration: { type: "number" }, action: { type: "string" } }, required: ["time", "selector", "duration", "action"] };
const advancedSchema = { type: "object", properties: { subtitle: { type: "string" }, searchText: { type: "string" }, url: { type: "string" }, pageTitle: { type: "string" }, pageSubtitle: { type: "string" }, ctaLabel: { type: "string" }, browserRows: { type: "array", items: { type: "string" } }, browserKeyframes: { type: "array", items: browserKeyframeSchema }, zoomKeyframes: { type: "array", items: zoomKeyframeSchema }, cursorSteps: { type: "array", items: cursorStepSchema }, animatedBorder: { type: "boolean" }, showShell: { type: "boolean" }, backgroundColor: { type: "string" }, cardColor: { type: "string" }, cardRadius: { type: "number" }, centerHeadline: { type: "string" } } };

const sceneSchema = {
  type: "object",
  properties: {
    component: { type: "string" }, purpose: { type: "string" },
    duration: { type: "number" }, headline: { type: "string" },
    voiceover: { type: "string" }, visual: { type: "string" },
    motion: { type: "string" }, transition: { type: "string" },
    hyperframe_animation: { type: "string", enum: ["fade_in", "fade_out", "slide_up", "slide_left", "pop", "typewriter", "zoom", "shake"] },
    advanced: advancedSchema,
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
    prompt: `You are ETA Director, an expert motion designer working with a real frame-driven Remotion component library. The user's free-form prompt may be a product, URL, interface, abstract idea, story, or rough thought. Infer every missing detail instead of rejecting it.

USER PROMPT: ${brief.description}
OPTIONAL CONTEXT: product=${brief.name || "infer from prompt"}; url=${brief.url || "infer if present"}; audience=${brief.audience || "infer"}; style=${brief.style || "infer"}; duration=${brief.duration} seconds; format=${brief.format}.

Use only these implemented components: ${ETA_COMPONENTS.join(", ")}. Choose components for their actual behavior, not as placeholders. BrowserWindow must receive advanced.url, pageTitle, pageSubtitle, ctaLabel, 3 browserRows, at least 2 browserKeyframes, a zoomKeyframe, and a cursorStep so it visibly opens, scrolls, zooms, points, and clicks. UIAnimation must depict a usable dashboard. PhoneWindow/IPhoneAnimated and MacBookAnimated must contain believable interface content. Glass must use layered translucent cards. Cards variants must use their real stack count. SearchAnimation needs advanced.searchText. Every scene must choose a hyperframe_animation and component-specific advanced values. Vary composition, scale, direction, and pacing across scenes; use purposeful match-cut transitions; keep total scene duration close to ${brief.duration} seconds. Build original visuals for deterministic Remotion playback and never claim to copy another product.`, 
    file_urls: uploads.length ? uploads : undefined,
    response_json_schema: {
      type: "object",
      properties: { title: { type: "string" }, narrative: { type: "string" }, scenes: { type: "array", items: sceneSchema } },
      required: ["title", "narrative", "scenes"],
    },
  });
  return { ...result, scenes: result.scenes.map((scene) => ({ ...scene, advanced: scene.advanced || {} })) };
}