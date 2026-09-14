import { ETA_COMPONENTS } from './etaComponents';
import { buildETAComponentRules } from './etaDirectorComponentPrompt';

const summary = (scene) => scene ? {component:scene.component,purpose:scene.purpose,duration:scene.duration,headline:scene.headline,motion:scene.motion,transition:scene.transition} : null;
export function buildETASceneAgentPrompt({ brief, scene, index, total, previous, next, round, totalRounds }) {
  return `You are ETA Scene Specialist ${index + 1} of ${total}, working in parallel with one specialist per scene.
REFINEMENT ROUND: ${round}/${totalRounds}
FILM BRIEF: ${JSON.stringify(brief)}
YOUR SCENE: ${JSON.stringify(scene)}
PREVIOUS SCENE: ${JSON.stringify(summary(previous))}
NEXT SCENE: ${JSON.stringify(summary(next))}

Return exactly one complete scene object matching the supplied response schema. Preserve this scene's narrative purpose, duration, and component unless the component is impossible for the intent. Work only on this scene, but make its opening and ending visually compatible with the neighboring scenes.

Use advanced_json as a strict JSON-encoded string containing an exhaustive, production-ready implementation for the selected component. Fully populate every relevant HTML element, UI data field, motion control, camera position, keyframe, cursor step, style, timing, and Match Cut value rather than relying on defaults. Keyframe times must fit inside the scene duration. BrowserWindow scenes must include a complete self-contained browserHtml document with inline CSS plus browserViewportWidth and browserViewportHeight; preserve supplied HTML faithfully and target its real selectors with controlled Product Demo camera choreography. PhoneWindow scenes without supplied screen media must include bespoke phoneHtml that directly visualizes the brief as a realistic mobile app screen, with scoped CSS and ordered data-eta-step elements for frame-driven reveals; never fall back to generic promotional cards. Do not return placeholders, markdown, explanations, comments, or fields belonging to unrelated components.

${buildETAComponentRules(ETA_COMPONENTS)}`;
}