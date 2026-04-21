// Core generation engine for SlideFarm.
// Uses built-in InvokeLLM + GenerateImage — no external APIs.
import { base44 } from "@/api/base44Client";

// ───────────────────────────────────────────────────────────────
// Copy generation (hook + body + CTA + caption) via Claude Sonnet
// ───────────────────────────────────────────────────────────────
export async function generateSlideshowCopy({ niche, voice, slideCount = 5, productOrOffer = "" }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a TikTok slideshow copywriter specializing in the viral "static-image-with-text-overlay" format that's driving millions of organic views for DTC brands right now.

NICHE: ${niche}
VOICE: ${voice || "confident, conversational, slightly provocative, Gen-Z friendly"}
${productOrOffer ? `OFFER/PRODUCT: ${productOrOffer}` : ""}
TOTAL SLIDES: ${slideCount} (1 hook + ${slideCount - 2} body slides + 1 CTA)

Write a full slideshow following this proven structure:
- Slide 1 HOOK: a single short punchy line that creates a curiosity gap or pattern interrupt. Max 10 words. No period.
- Slides 2 to ${slideCount - 1}: BODY. Each is ONE short sentence or fragment (8–15 words) that delivers a listicle item, tip, or reveal. Cumulative — each builds tension.
- Slide ${slideCount} CTA: a soft CTA that feels natural, not salesy. Max 12 words.
- CAPTION: a TikTok caption under 150 chars + 4-6 relevant hashtags.

Tone must match voice. Write AS the creator, first-person when natural.`,
    response_json_schema: {
      type: "object",
      properties: {
        hook: { type: "string" },
        body_slides: { type: "array", items: { type: "string" } },
        cta: { type: "string" },
        caption: { type: "string" },
        image_prompts: {
          type: "array",
          items: { type: "string" },
          description: "One on-aesthetic image prompt per slide. Aesthetic, moody, niche-appropriate. NO text in the image — text is overlaid later."
        }
      },
      required: ["hook", "body_slides", "cta", "caption", "image_prompts"]
    },
    model: "claude_sonnet_4_6"
  });
  return res;
}

// ───────────────────────────────────────────────────────────────
// Generate one aesthetic image per slide (replaces Pinterest)
// ───────────────────────────────────────────────────────────────
export async function generateSlideImages(imagePrompts, niche) {
  const results = [];
  for (const p of imagePrompts) {
    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: `Vertical 9:16 TikTok slideshow background image. Niche: ${niche}. ${p}. Aesthetic, moody, cinematic, magazine-quality photography. NO TEXT anywhere in image. Leave visual breathing room in upper and center for text overlay. High contrast so white overlay text will read clearly.`
    });
    results.push(url);
  }
  return results;
}

// ───────────────────────────────────────────────────────────────
// Build slide objects: {image_url, text, role}
// ───────────────────────────────────────────────────────────────
export function buildSlides({ hook, body_slides, cta, images }) {
  const slides = [];
  slides.push({ image_url: images[0], text: hook, role: "hook" });
  body_slides.forEach((t, i) => {
    slides.push({ image_url: images[i + 1] || images[0], text: t, role: "body" });
  });
  slides.push({ image_url: images[images.length - 1] || images[0], text: cta, role: "cta" });
  return slides;
}