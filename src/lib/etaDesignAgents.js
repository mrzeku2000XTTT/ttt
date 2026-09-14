import { base44 } from "@/api/base44Client";
import { ETA_COMPONENTS } from "@/lib/etaComponents";
import { buildETAComponentRules } from "@/lib/etaDirectorComponentPrompt";

const compact = (scene) => scene ? { component: scene.component, purpose: scene.purpose, duration: scene.duration, headline: scene.headline, motion: scene.motion, transition: scene.transition } : null;

// Live search for high-quality, award-winning motion design references for one scene type.
export async function searchAnimationReferences(brief, scene) {
  const query = `award-winning motion design animation examples ${scene.component} ${scene.purpose} ${brief.style || ""}`.replace(/\s+/g, " ").trim().slice(0, 240);
  try {
    const res = await base44.functions.invoke("openWebSearch", { query });
    const payload = res?.data ?? res;
    const results = payload?.results || [];
    return results.slice(0, 6)
      .map((r) => ({ title: r.title || "", host: r.host || "", snippet: (r.snippet || "").replace(/\s+/g, " ").slice(0, 220) }))
      .filter((r) => r.title || r.snippet);
  } catch {
    // Search is an enhancement — generation continues without live references.
    return [];
  }
}

const analyzerSchema = {
  type: "object", additionalProperties: false,
  properties: {
    designBrief: { type: "string" },
    palette: { type: "array", items: { type: "string" } },
    typography: { type: "string" },
    motionLanguage: { type: "string" },
    animationPatterns: { type: "array", items: { type: "string" } },
    layoutNotes: { type: "string" },
    inspirationSources: { type: "array", items: { type: "string" } },
  },
  required: ["designBrief", "palette", "typography", "motionLanguage", "animationPatterns", "layoutNotes", "inspirationSources"],
};

export function buildDesignAnalyzerPrompt({ brief, scene, index, total, references, searchResults }) {
  return `You are the ETA Design Analyzer, agent ${index + 1} of ${total} — one design analyzer per scene, running before the Scene Engineer.
FILM BRIEF: ${JSON.stringify(brief)}
YOUR SCENE: ${JSON.stringify(compact(scene))}
${references.length ? `
REFERENCE IMAGES (${references.length} supplied by the user as the design guide): extract their exact design language — color palette as hex values, typography feel, layout structure, texture/material, spacing rhythm, and any motion cues implied by the composition. The finished scene must feel like it belongs to this design system; treat these images as the source of truth for look and feel.` : `
No reference images were supplied — derive a premium, cohesive design language from the brief and the researched animation references.`}
${searchResults.length ? `
HIGH-QUALITY ANIMATION RESEARCH (live search of award-winning motion design for this scene type):
${searchResults.map((r, i) => `${i + 1}. ${r.title} (${r.host}): ${r.snippet}`).join("\n")}
Distill concrete, executable animation patterns from this research — named techniques, timing, easing, staging, rhythm — not generic praise.` : ""}
Return a binding design brief the Engineer agent must implement exactly.`;
}

export async function runDesignAnalyzerAgent({ brief, scene, index, total, referenceUrls, searchResults }) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: buildDesignAnalyzerPrompt({ brief, scene, index, total, references: referenceUrls, searchResults }),
    ...(referenceUrls.length ? { file_urls: referenceUrls } : {}),
    response_json_schema: analyzerSchema,
  });
  return {
    designBrief: result?.designBrief || "",
    palette: result?.palette || [],
    typography: result?.typography || "",
    motionLanguage: result?.motionLanguage || "",
    animationPatterns: result?.animationPatterns || [],
    layoutNotes: result?.layoutNotes || "",
    inspirationSources: result?.inspirationSources || [],
  };
}

export function buildEngineerPrompt({ brief, scene, index, total, previous, next, round, totalRounds, designBrief, morphDigest = "" }) {
  return `You are the ETA Scene Engineer, agent ${index + 1} of ${total}, working in parallel with one engineer per scene after the Design Analyzer.
REFINEMENT ROUND: ${round}/${totalRounds}
FILM BRIEF: ${JSON.stringify(brief)}
YOUR SCENE: ${JSON.stringify(scene)}
PREVIOUS SCENE: ${JSON.stringify(compact(previous))}
NEXT SCENE: ${JSON.stringify(compact(next))}
DESIGN BRIEF (binding — implement this design language, palette, typography, layout notes, and animation patterns exactly): ${JSON.stringify(designBrief)}
${morphDigest ? `\nUSER MORPH PREFERENCES (learned from this user's manual ShapeMorph edits — follow them whenever you build ShapeMorph scenes):\n${morphDigest}\n` : ""}
Return exactly one complete scene object matching the supplied response schema. Preserve this scene's narrative purpose, duration, and component unless the component is impossible for the intent. Work only on this scene, but make its opening and ending visually compatible with the neighboring scenes.

Use advanced_json as a strict JSON-encoded string containing an exhaustive, production-ready implementation for the selected component. Fully populate every relevant HTML element, UI data field, motion control, camera position, keyframe, cursor step, style, timing, and Match Cut value rather than relying on defaults. Keyframe times must fit inside the scene duration. Apply the design brief's palette and typography inside every HTML document you author. BrowserWindow scenes must include a complete self-contained browserHtml document with inline CSS plus browserViewportWidth and browserViewportHeight; preserve supplied HTML faithfully and target its real selectors with controlled Product Demo camera choreography. PhoneWindow scenes without supplied screen media must include bespoke phoneHtml that directly visualizes the brief as a realistic mobile app screen, with scoped CSS and ordered data-eta-step elements for frame-driven reveals; never fall back to generic promotional cards. Do not return placeholders, markdown, explanations, comments, or fields belonging to unrelated components.

${buildETAComponentRules(ETA_COMPONENTS)}`;
}