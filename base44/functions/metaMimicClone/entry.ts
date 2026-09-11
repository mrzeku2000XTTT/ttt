import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, instructions, cloneMode, currentHtml, instruction, imageWidth, imageHeight } = await req.json();
    const width = Number(imageWidth);
    const height = Number(imageHeight);
    const hasDimensions = Number.isFinite(width) && width > 0 && width <= 20000 && Number.isFinite(height) && height > 0 && height <= 50000;
    const isRefine = !!(currentHtml && instruction);
    if (!imageUrl && !isRefine) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const clonePrompt = `You are MetaMimic in EXACT 1:1 CLONE mode. Study the attached image and reproduce it in HTML as a strict, pixel-faithful 1:1 clone — nothing else.

OUTPUT RULES:
- Output ONE complete HTML document (<!DOCTYPE html> ... </html>).
- Inline ALL CSS inside a <style> tag in the <head>. No external stylesheets or frameworks (a Google Fonts <link> is allowed if the image shows a distinctive font).
- Return ONLY the raw HTML. No markdown fences, no explanation.

ABSOLUTE 1:1 RULES:
- Render ONLY what is actually visible in the image. If the image shows a single pill button, the HTML contains ONLY that pill button — no hero, no headline, no paragraph, no nav, no footer, no extra sections.
- NEVER add, guess, invent, or "complete" content. Any element or text not present in the image is FORBIDDEN.
- Copy the image's text EXACTLY, character for character, preserving per-word colors, weights and emphasis spans.
- Match exact geometry: element width/height ratios, padding, border-radius, font-size, font-weight, letter-spacing, line-height, exact hex colors, borders, shadows. Estimate proportions carefully from the image.
- Position elements exactly as in the image (centering, spacing, and the image's own background color).
- Preserve the SOURCE layout, columns and aspect ratio. Do NOT rearrange this desktop screenshot into a mobile layout. The preview scales the source canvas to fit smaller screens.
- Put all content in a single source-sized canvas with position:relative and every visible section retained top to bottom. Never hide the lower content with overflow:hidden on body.
- NO animations, NO hover effects, NO scroll effects, NO JavaScript. Static, exact reproduction only.
- If the image shows only a fragment of a page, clone only that fragment.
${instructions ? `\nEXTRA USER INSTRUCTIONS: ${instructions}` : ''}

Return ONLY the raw HTML document.`;

    const refinePrompt = `You are MetaMimic's edit mode. You are given an existing self-contained HTML document (a UI clone) and ONE edit instruction from the user.

EDIT RULES:
- Apply ONLY the requested change (text, color, background, font, gradient, size, layout, etc.).
- Do NOT change anything else: keep every other element, style, text, size and structure exactly as it is.
- Do NOT add new sections or content beyond what the instruction asks.
- Keep it ONE complete self-contained HTML document with inline CSS, no external frameworks. Return ONLY the raw HTML, no markdown fences, no explanation.
- Preserve the existing source canvas dimensions, section markers and artwork crops. Do not force a new mobile layout. Use the attached original image as reference when available.

CURRENT HTML:
${currentHtml}

USER EDIT INSTRUCTION: ${instruction}

Return the full updated HTML document.`;

    const prompt = currentHtml && instruction
      ? refinePrompt
      : cloneMode
        ? clonePrompt
        : `You are MetaMimic, a world-class front-end engineer and motion designer. Study the attached screenshot/image of a web page or UI and recreate it as a single, self-contained, premium-quality HTML file that looks like a polished, animated production website (think Framer / motion-design landing pages).

OUTPUT RULES:
- Output ONE complete HTML document (<!DOCTYPE html> ... </html>).
- Inline ALL CSS inside a <style> tag in the <head>, and ALL JS inside a <script> tag before </body>. No external stylesheets or frameworks.
- Return ONLY the raw HTML. No markdown fences, no explanation.

VISUAL FIDELITY:
- Match the layout, color palette, spacing, typography, hierarchy and component structure as closely as possible to the image.
- Pull real fonts from Google Fonts via <link> to match the look (e.g. Inter, Poppins, Space Grotesk, etc.).
- Use precise hex colors, gradients, shadows, border-radius and glassmorphism where the image shows them.
- Reproduce buttons, cards, navs, hero sections, badges and icons faithfully. Use inline SVG for icons/logos.
- Use placeholder text only where the image text is genuinely unreadable.

MOTION & POLISH (make it feel alive like a motion site):
- Add smooth scroll-reveal animations using IntersectionObserver (fade/slide-up as sections enter the viewport).
- Add tasteful hover transitions on buttons, cards and links (transform, glow, color).
- Add a subtle animated hero element (gradient shift, floating orb, or parallax) consistent with the design.
- Respect prefers-reduced-motion.
- Keep all animations performant (transform/opacity only).

RESPONSIVE:
- Fully responsive and mobile-friendly with a working mobile layout. Semantic HTML throughout.
${instructions ? `\nEXTRA USER INSTRUCTIONS: ${instructions}` : ''}

Return ONLY the raw HTML document.`;

    const fidelityRules = `
SOURCE REFERENCE:
${hasDimensions ? `The screenshot is ${width}px wide by ${height}px high. In exact mode use a canvas of precisely these dimensions; use these coordinates for artwork crops.` : 'Infer the source canvas dimensions from the attached screenshot.'}
${imageUrl ? `The actual source image URL is: ${JSON.stringify(imageUrl)}. For photographic artwork, hero illustrations, and card images, reuse the ORIGINAL pixels: crop regions of this URL with overflow-hidden containers and an absolutely positioned source image sized to the screenshot dimensions (offset by negative crop x/y). Do not invent image URLs, substitute gradients/emojis, or omit the artwork. Do not stretch the whole screenshot into each image slot. Crop only artwork regions, keeping the rest of the UI as editable HTML/CSS. Never use the entire screenshot as the page or as a full-page background.` : ''}
COMPLETENESS:
Inspect the ENTIRE screenshot, including its bottom edge, before writing HTML. Inventory every visible section, every card in each row, header, hero artwork, floating badge, timer and lower grid. Recreate ALL visible content, not just the first viewport. Keep CSS compact and shared across repeated cards so the complete document fits. No placeholders, ellipses, TODOs or omitted sections. Keep text and controls editable.
For each source section, supply an id (letters/numbers/hyphens only), label and itemCount (number of repeated cards/items, zero if none). Its HTML container MUST have data-source-section="id". Inside it mark each repeated item with data-source-item="id-1", "id-2", etc. Include every source card, not only a sample. In edit mode inventory the retained sections of the existing HTML.
OUTPUT FORMAT OVERRIDE: Return a JSON object with sections (the inventory), usesSourceArtwork (boolean), and html (the entire document including closing body/html tags). Do not return markdown.`;
    const responseSchema = {
      type: 'object',
      properties: {
        sections: { type: 'array', items: { type: 'object', properties: {
          id: { type: 'string' }, label: { type: 'string' }, itemCount: { type: 'integer' }
        }, required: ['id', 'label', 'itemCount'] } },
        usesSourceArtwork: { type: 'boolean' }, html: { type: 'string' }
      }, required: ['sections', 'usesSourceArtwork', 'html']
    };
    const clean = (raw) => String(raw || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const validate = (result) => {
      const html = clean(result?.html);
      if (!/^<!doctype html>/i.test(html) || !/<head[\s>]/i.test(html) || !/<\/head>/i.test(html) || !/<body[\s>]/i.test(html) || !/<\/body>\s*<\/html>\s*$/i.test(html)) return 'HTML document is incomplete.';
      if (!Array.isArray(result.sections) || !result.sections.length) return 'Source section inventory is missing.';
      const ids = new Set();
      for (const section of result.sections) {
        if (!/^[a-z0-9-]+$/i.test(section.id) || ids.has(section.id) || !Number.isInteger(section.itemCount) || section.itemCount < 0 || section.itemCount > 500) return 'Invalid source section inventory.';
        ids.add(section.id);
        if (!new RegExp(`data-source-section=["']${section.id}["']`).test(html)) return `Missing section: ${section.label}`;
        for (let i = 1; i <= section.itemCount; i++) {
          if (!new RegExp(`data-source-item=["']${section.id}-${i}["']`).test(html)) return `Missing item ${i} in ${section.label}`;
        }
      }
      if (result.usesSourceArtwork && imageUrl && !html.includes(imageUrl.replace(/&/g, '&amp;')) && !html.includes(imageUrl)) return 'Original artwork is missing.';
      return '';
    };
    let failure = '';
    for (const model of ['claude-sonnet-5', 'gpt_5_6_luna']) {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: prompt + fidelityRules + (failure ? `\nPrevious attempt was rejected: ${failure}. Return a fresh COMPLETE document, not a continuation.` : ''),
          model,
          ...(imageUrl ? { file_urls: [imageUrl] } : {}),
          response_json_schema: responseSchema
        });
        failure = validate(result);
        if (failure) { console.warn('Clone rejected:', failure); continue; }
        return Response.json({ html: clean(result.html), sections: result.sections, imageWidth: hasDimensions ? width : null, imageHeight: hasDimensions ? height : null });
      } catch (error) {
        failure = error.message || 'Generation failed.';
        console.warn('Clone attempt failed:', failure);
      }
    }
    return Response.json({ error: 'A complete clone could not be produced. Please retry; no partial result was accepted.' }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}