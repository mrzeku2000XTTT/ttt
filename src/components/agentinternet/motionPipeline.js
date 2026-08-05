import { base44 } from "@/api/base44Client";

/**
 * The real motion pipeline — no orchestration theatre.
 * Scrape the actual site → live research → write the actual scenes →
 * render a real still per scene with our own image engine.
 * Everything it returns is a saveable asset.
 */

const URL_RE = /((?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?)/i;

export function extractUrl(text) {
  const m = (text || "").match(URL_RE);
  if (!m) return null;
  const raw = m[1].replace(/[.,)]+$/, "");
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export const SCENE_COUNT = { 4: 2, 6: 3, 8: 4 };

const SCENE_SCHEMA = {
  type: "object",
  properties: {
    concept: { type: "string", description: "one line: the through-line of the whole piece" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "short scene name" },
          shot: { type: "string", description: "what the camera sees and how it moves" },
          copy: { type: "string", description: "on-screen text, max 6 words" },
          prompt: { type: "string", description: "the full production image prompt for this frame, max 90 words" },
        },
        required: ["title", "shot", "prompt"],
      },
    },
  },
  required: ["scenes"],
};

export async function runMotionPipeline({ text, spec, onProgress }) {
  const url = extractUrl(text);
  let brand = null;
  let research = "";

  if (url) {
    onProgress?.(`reading ${url.replace(/^https?:\/\//, "")}`);
    try {
      const res = await base44.functions.invoke("brandSiteScraper", { url });
      const d = res?.data || res;
      if (d && !d.error) {
        brand = {
          url: d.url || url,
          name: d.site_name || d.title,
          description: d.description,
          image: d.og_image,
          copy: (d.root_text || "").slice(0, 2500),
          pages: (d.sub_pages || []).map((p) => p.title).filter(Boolean).slice(0, 6),
        };
      }
    } catch {}
  }

  onProgress?.("researching live");
  try {
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Research ${url || text} right now. Return 5 tight factual bullets: what it actually is, who it's for, its real product surfaces/screens, its visual identity (colours, type feel), and one current fact with a number or date.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
    });
    research = (typeof r === "string" ? r : JSON.stringify(r)).slice(0, 2000);
  } catch {}

  const count = SCENE_COUNT[spec.duration] || 3;
  onProgress?.(`writing ${count} scenes`);
  const sceneRes = await base44.integrations.Core.InvokeLLM({
    prompt: `Write the scene-by-scene plan for a ${spec.duration}-second ${spec.aspect_ratio} browser-UI animation for ${brand?.name || url || text}.

Real site data: ${JSON.stringify(brand || {}).slice(0, 1800)}
Live research: ${research || "none"}
User asked: "${text}"

Rules:
- EXACTLY ${count} scenes, each about ${(spec.duration / count).toFixed(1)}s.
- This is a browser UI animation: real browser chrome, the site's actual pages and screens gliding, scrolling, snapping and punching in. Cursor moves, panels slide, cards land.
- Use the brand's REAL name, real page names and real colour feel — never generic placeholders.
- "prompt" must be a complete standalone image prompt for that single frame: subject, browser framing, camera move, lighting, exact palette, texture, mood, ${spec.aspect_ratio} composition. Max 90 words, no preamble.
- Cuts are punchy zoom punch-ins between scenes — write that escalation into the prompts.`,
    response_json_schema: SCENE_SCHEMA,
    model: "gemini_3_flash",
  });
  const parsed = typeof sceneRes === "string" ? JSON.parse(sceneRes) : sceneRes;
  const scenes = (parsed.scenes || []).slice(0, count);
  if (!scenes.length) throw new Error("no scenes");

  onProgress?.(`rendering ${scenes.length} frames`);
  const rendered = await Promise.all(
    scenes.map((s) =>
      base44.integrations.Core.GenerateImage({ prompt: `${s.prompt} ${spec.aspect_ratio} aspect ratio.` })
        .then((r) => ({ ...s, url: r?.url || null }))
        .catch(() => ({ ...s, url: null }))
    )
  );

  return { url, brand, research, concept: parsed.concept || "", scenes: rendered };
}