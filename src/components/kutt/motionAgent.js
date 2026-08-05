import { base44 } from "@/api/base44Client";
import { partMenu, buildMotionPrompt, findPart, CAMERA_MOVES } from "./motionUILibrary";

/**
 * MOTION — Kutt's UI-motion agent.
 * Picks the right component + text animation + camera per scene from the
 * motion UI library and composes an Apple-minimalist, keyframed render prompt.
 * Used whenever the piece is about an app, website, dashboard or product UI.
 */

const MOTION_SCHEMA = {
  type: "object",
  properties: {
    palette: { type: "string", description: "2-3 exact colours held across every scene, from the real brand identity" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          component: { type: "string", description: "one UI component id from the library" },
          text_animation: { type: "string", description: "one text animation id from the library, or empty" },
          camera: { type: "string", description: "one camera move key from the library" },
          content: { type: "string", description: "what is actually on screen — real page/screen name, the real short labels, the real data shown, and the exact interaction that happens. 30-60 words." },
        },
        required: ["component", "camera", "content"],
      },
    },
  },
  required: ["palette", "scenes"],
};

export async function runMotionAgent({ scenes, brief, topic, visualIdentity, realFeatures, aspect = "16:9", onStep }) {
  if (!scenes.length) return scenes;

  onStep?.({ label: "🧩 Motion agent choosing UI components…", status: "running", agent: "motion" });

  let plan;
  try {
    plan = await base44.integrations.Core.InvokeLLM({
      prompt: `You are MOTION — Kutt's UI-motion director. You build web/app interface animations in a clean minimalist Apple/iOS design language.

You compose from this fixed library. Use ONLY these ids:
${partMenu()}

PRODUCT: ${topic}
BRIEF: ${brief}
REAL BRAND VISUAL IDENTITY: ${visualIdentity || "not established — choose one restrained Apple-like palette and hold it"}
REAL SCREENS/FEATURES (use these actual names on screen, never invent one): ${(realFeatures || []).join(", ") || "unknown — keep on-screen labels generic and short"}

SCENES:
${scenes.map((s, i) => `${i + 1}. (${s.duration}s) ${s.visual_prompt}${s.caption ? ` | caption: "${s.caption}"` : ""}`).join("\n")}

For each scene:
- Pick the single component that best carries that beat. Vary across the piece: open in a browser_window or macbook, use widget_box / card_stack_* for metrics beats, search_animation_* for discovery beats, sidebar_expand or ui_animation for navigation beats, logo_animation_* only for an intro or outro.
- Pick a camera move that matches the beat's energy; do not repeat the same move twice in a row.
- "content" must describe the REAL screen: which page, the real short labels, the real numbers or list rows, and the one specific interaction (click, swipe, scroll, toggle, hover) that happens. Keep on-screen text to short real words — never paragraphs.
- Hold one palette across all scenes.

Return exactly ${scenes.length} scenes, in order.`,
      response_json_schema: MOTION_SCHEMA,
      model: "claude_sonnet_4_6",
    });
  } catch {
    onStep?.({ label: "🧩 Motion agent choosing UI components…", status: "error", agent: "motion" });
    return scenes;
  }

  const picked = plan?.scenes || [];
  const used = picked.map((p) => findPart(p.component)?.label).filter(Boolean);
  onStep?.({
    label: `🧩 Motion built ${used.length} UI shots — ${used.join(" · ")}`,
    status: "done",
    agent: "motion",
  });

  return scenes.map((s, i) => {
    const p = picked[i];
    if (!p) return s;
    return {
      ...s,
      motion_component: p.component,
      motion_camera: p.camera,
      visual_prompt: buildMotionPrompt({
        component: p.component,
        textAnimation: p.text_animation,
        camera: p.camera,
        content: p.content,
        palette: plan.palette,
        aspect,
      }),
      motion: CAMERA_MOVES[p.camera] || "",
    };
  });
}

/** True when the piece is about software UI and should be built by MOTION. */
export function isUIMotionTopic(text) {
  return /\b(ui|ux|interface|app|application|website|web ?site|landing|dashboard|saas|widget|browser|screen|product tour|demo|onboarding|feature)\b/i.test(text || "");
}