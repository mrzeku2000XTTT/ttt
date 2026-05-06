import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// urlDeepResearchImages
// ---------------------
// Takes a URL, deeply researches it (scraping the page + web context),
// extracts brand/topic essence, then generates 10 themed images that can be
// dropped into UltraMock as slide objects.
//
// Pipeline:
//   1) Scrape the URL's HTML and pull title/description/keywords/text snippet.
//   2) LLM with internet context analyzes WHAT this URL is really about
//      (brand, product, mood, palette, story) and drafts 10 distinct image
//      prompts — each a different angle on the brand (hero, lifestyle,
//      texture, abstract, detail shot, environment, etc.).
//   3) Generate all 10 images in parallel via Core.GenerateImage.
//
// Returns:
//   {
//     research: { title, summary, brand_voice, palette, keywords },
//     images: [{ url, prompt, role, label }] x10
//   }

const ROLE_LABELS = [
  "Hero",
  "Lifestyle",
  "Detail",
  "Texture",
  "Environment",
  "Abstract",
  "Product",
  "Mood",
  "Palette",
  "Statement",
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'Missing url' }, { status: 400 });
    }
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    // ── 1) Scrape the page (best-effort; fall back to URL-only research) ──
    let pageContext = '';
    try {
      const r = await fetch(normalized, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Cháoxiào/1.0; +https://base44.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const html = await r.text();
        const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
        const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim();
        const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim();
        const ogDesc = (html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim();
        // Strip tags + collapse whitespace, take first ~3000 chars
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 3000);
        pageContext = [
          title && `TITLE: ${title}`,
          (ogTitle && ogTitle !== title) && `OG_TITLE: ${ogTitle}`,
          desc && `META: ${desc}`,
          (ogDesc && ogDesc !== desc) && `OG_DESC: ${ogDesc}`,
          text && `BODY: ${text}`,
        ].filter(Boolean).join('\n');
      }
    } catch (e) {
      console.warn('[urlDeepResearchImages] scrape failed:', e?.message);
    }

    // ── 2) Deep-research + image-prompt drafting ──────────────────────────
    const research = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an art director researching a URL deeply to generate 10 cinematic images for a motion ad.

URL: ${normalized}

SCRAPED PAGE CONTEXT:
${pageContext || '(scrape failed — research from the URL alone using the web)'}

YOUR JOB:
Step 1 — DEEP RESEARCH: figure out what this URL is REALLY about. Use the web to find the brand, product, vibe, audience, color palette, and story. Don't just paraphrase the meta — go deeper.

Step 2 — DRAFT 10 IMAGE PROMPTS: each prompt is a distinct angle on the same brand/topic. The 10 roles MUST cover (in this order):
  1) HERO       — the iconic product shot or signature visual
  2) LIFESTYLE  — a person/scene using the product naturally
  3) DETAIL     — close-up macro / craft / texture detail
  4) TEXTURE    — an abstract texture surface that fits the palette
  5) ENVIRONMENT — wide environmental shot of the world the product lives in
  6) ABSTRACT   — an abstract conceptual visual that captures the FEELING
  7) PRODUCT    — a clean studio product shot on a contextual surface
  8) MOOD       — a moody atmospheric image (lighting/weather/mood)
  9) PALETTE    — a pure color-palette composition (gradient/forms/light)
 10) STATEMENT  — a single bold visual that could be a campaign poster

EVERY prompt MUST:
  - Be 30-60 words, cinematic, specific.
  - Reference the brand's actual palette and aesthetic from research.
  - Specify lighting, composition, camera, and mood.
  - Be SAFE for advertising (no people's faces in close-up if avoidable, no copyrighted logos).
  - Have NO TEXT in the image (we'll add text in the editor).

Return JSON:
{
  "research": {
    "title": "short brand/topic title",
    "summary": "2-3 sentence summary of what this URL is",
    "brand_voice": "1 phrase",
    "palette": ["#hex","#hex","#hex","#hex"],
    "keywords": ["kw1","kw2","kw3","kw4","kw5"]
  },
  "image_prompts": [
    { "role": "hero",       "label": "short 2-4 word headline", "prompt": "..." },
    { "role": "lifestyle",  "label": "...", "prompt": "..." },
    { "role": "detail",     "label": "...", "prompt": "..." },
    { "role": "texture",    "label": "...", "prompt": "..." },
    { "role": "environment","label": "...", "prompt": "..." },
    { "role": "abstract",   "label": "...", "prompt": "..." },
    { "role": "product",    "label": "...", "prompt": "..." },
    { "role": "mood",       "label": "...", "prompt": "..." },
    { "role": "palette",    "label": "...", "prompt": "..." },
    { "role": "statement",  "label": "...", "prompt": "..." }
  ]
}`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          research: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              brand_voice: { type: 'string' },
              palette: { type: 'array', items: { type: 'string' } },
              keywords: { type: 'array', items: { type: 'string' } },
            },
          },
          image_prompts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string' },
                label: { type: 'string' },
                prompt: { type: 'string' },
              },
              required: ['role', 'prompt'],
            },
          },
        },
        required: ['research', 'image_prompts'],
      },
    });

    const prompts = (research?.image_prompts || []).slice(0, 10);
    if (prompts.length < 10) {
      // Pad with generic role prompts if the LLM returned fewer
      const need = 10 - prompts.length;
      for (let i = 0; i < need; i++) {
        prompts.push({
          role: ROLE_LABELS[prompts.length].toLowerCase(),
          label: ROLE_LABELS[prompts.length],
          prompt: `Cinematic editorial photograph capturing the essence of "${research?.research?.title || normalized}". ${research?.research?.summary || ''}. Studio lighting, high quality, detailed, professional.`,
        });
      }
    }

    // ── 3) Generate all 10 images in parallel ─────────────────────────────
    const imageResults = await Promise.all(
      prompts.map(async (p, idx) => {
        try {
          const fullPrompt = `${p.prompt} High-resolution, cinematic, advertising-grade, ${p.role} shot. NO text, NO logos, NO watermarks, NO captions.`;
          const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
          return {
            url: res?.url || '',
            prompt: p.prompt,
            role: p.role || ROLE_LABELS[idx]?.toLowerCase() || `image_${idx}`,
            label: p.label || ROLE_LABELS[idx] || `Image ${idx + 1}`,
            index: idx,
          };
        } catch (e) {
          console.warn(`[urlDeepResearchImages] image ${idx} failed:`, e?.message);
          return { url: '', prompt: p.prompt, role: p.role, label: p.label, index: idx, error: e?.message };
        }
      })
    );

    return Response.json({
      success: true,
      url: normalized,
      research: research?.research || {},
      images: imageResults.filter((i) => i.url), // only return successful ones
      total_attempted: prompts.length,
      total_succeeded: imageResults.filter((i) => i.url).length,
    });
  } catch (error) {
    console.error('[urlDeepResearchImages] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});