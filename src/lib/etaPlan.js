import { base44 } from "@/api/base44Client";
import { buildETADirectorPrompt } from "@/lib/etaDirectorPrompt";
import { buildEngineerPrompt, runDesignAnalyzerAgent, searchAnimationReferences } from "@/lib/etaDesignAgents";
import parseEtaAdvanced, { normalizeEtaValue } from "@/lib/parseEtaAdvanced";
import { summarizeMorphLearnings } from "@/lib/etaShapeMorph";
export { ETA_COMPONENTS } from "@/lib/etaComponents";

export const createBlankETAScene = (component = "TitleCard") => ({
  component, purpose: "New scene", duration: 3, headline: "New scene",
  voiceover: "Add the narration for this scene.", visual: "Describe the visual direction.",
  motion: "Ease in", transition: "Match cut", hyperframe_animation: "slide_up", advanced: {},
});

const getETAPassCount = (brief, files) => {
  const length = String(brief.description || "").trim().length;
  let passes = 2;
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
    advanced_json: { type: "string" },
  },
  required: ["component", "purpose", "duration", "headline", "voiceover", "visual", "motion", "transition", "hyperframe_animation", "advanced_json"],
};

export async function createETAPlan(brief, files, onStatus) {
  onStatus("Preparing reference media");
  // Private uploads are signed so the director, analyzer, and engineer agents can actually see them.
  const uploads = await Promise.all(files.map(async (file) => {
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
    return signed_url;
  }));
  const maxPasses = getETAPassCount(brief, files);
  onStatus("Director agent: building the master scene blueprint");
  const blueprint = await base44.integrations.Core.InvokeLLM({
    prompt: buildETADirectorPrompt(brief, { passIndex: 1, maxPasses, currentPlan: null, referenceMediaCount: uploads.length }),
    file_urls: uploads.length ? uploads : undefined,
    response_json_schema: {
      type: "object", additionalProperties: false,
      properties: { title: { type: "string" }, narrative: { type: "string" }, scenes: { type: "array", items: sceneSchema } },
      required: ["title", "narrative", "scenes"],
    },
  });
  const normalized = normalizeEtaValue(blueprint);
  let currentPlan = { ...normalized, format: brief.format, fps: 60, scenes: normalized.scenes.map(({ advanced_json, ...scene }) => ({ ...scene, advanced: parseEtaAdvanced(advanced_json) })) };
  let morphDigest = "";
  try {
    const learnings = await base44.entities.ETAMorphLearning.list("-created_date", 10);
    morphDigest = summarizeMorphLearnings(learnings);
  } catch {
    // First run or guest session — nothing learned from manual morph edits yet.
  }
  const totalRounds = maxPasses - 1;
  const designBriefs = []; // one Design Analyzer brief per scene, reused across rounds
  const searchCache = []; // per-scene high-quality animation research from round 1
  for (let round = 1; round <= totalRounds; round += 1) {
    const sourceScenes = currentPlan.scenes;
    if (round === 1) {
      onStatus(`Design research: sourcing high-quality animation references for ${sourceScenes.length} scenes`);
      await Promise.all(sourceScenes.map(async (scene, index) => {
        searchCache[index] = await searchAnimationReferences(brief, scene);
      }));
      onStatus(`Design Analyzers: reading your reference images · ${sourceScenes.length} agents`);
      await Promise.all(sourceScenes.map(async (scene, index) => {
        designBriefs[index] = await runDesignAnalyzerAgent({ brief, scene, index, total: sourceScenes.length, referenceUrls: uploads, searchResults: searchCache[index] || [] });
      }));
    }
    onStatus(`Scene Engineers: building production scenes · ${sourceScenes.length} agents · round ${round}/${totalRounds}`);
    const refinedScenes = await Promise.all(sourceScenes.map(async (scene, index) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildEngineerPrompt({ brief, scene, index, total: sourceScenes.length, previous: sourceScenes[index - 1], next: sourceScenes[index + 1], round, totalRounds, designBrief: designBriefs[index], morphDigest }),
        file_urls: uploads.length ? uploads : undefined,
        response_json_schema: sceneSchema,
      });
      const { advanced_json, ...refined } = normalizeEtaValue(result);
      return { ...refined, advanced: parseEtaAdvanced(advanced_json) };
    }));
    currentPlan = { ...currentPlan, scenes: refinedScenes };
  }
  return currentPlan;
}