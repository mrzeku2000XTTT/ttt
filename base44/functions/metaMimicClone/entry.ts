import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, instructions } = await req.json();
    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const prompt = `You are MetaMimic, a world-class front-end engineer and motion designer. Study the attached screenshot/image of a web page or UI and recreate it as a single, self-contained, premium-quality HTML file that looks like a polished, animated production website (think Framer / motion-design landing pages).

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

    const withTimeout = (p: Promise<any>, ms: number) =>
      Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

    const clean = (r: any) => {
      const raw = typeof r === 'string' ? r : (r?.html || '');
      const stripped = raw.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const start = stripped.search(/<!DOCTYPE|<html/i);
      return start >= 0 ? stripped.slice(start) : '';
    };

    // Fast model first; only fall back to the slower, higher-fidelity model if it fails.
    let html = '';
    try {
      html = clean(await withTimeout(
        base44.integrations.Core.InvokeLLM({ prompt, file_urls: [imageUrl], model: 'gemini_3_flash' }),
        90_000,
      ));
    } catch { /* fall through */ }

    if (!html) {
      try {
        html = clean(await withTimeout(
          base44.integrations.Core.InvokeLLM({ prompt, file_urls: [imageUrl], model: 'claude_sonnet_4_6' }),
          150_000,
        ));
      } catch { /* fall through */ }
    }

    if (!html) {
      return Response.json({ error: 'The model took too long or returned no HTML. Try a smaller / simpler screenshot.' }, { status: 502 });
    }

    return Response.json({ html });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});