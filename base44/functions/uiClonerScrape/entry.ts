import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { url } = await req.json();
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  try {
    // Fetch the raw HTML
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!fetchRes.ok) {
      return Response.json({ error: `Failed to fetch URL: ${fetchRes.status} ${fetchRes.statusText}` }, { status: 400 });
    }

    const contentType = fetchRes.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return Response.json({ error: 'URL does not return HTML content' }, { status: 400 });
    }

    const rawHtml = await fetchRes.text();

    // Clean up HTML — strip scripts, keep structure + class names
    const cleanHtml = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Use LLM to take a "screenshot" description + capture inline styles/css vars
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extract the complete visual design system from this HTML. Return a JSON with:
- color_palette: array of hex colors found in inline styles or common CSS classes
- typography: font families, sizes used
- layout: describe the main sections (navbar, hero, features, pricing, footer etc.)
- components: list of UI components present (buttons, cards, badges etc.)
- css_framework: detected framework (Tailwind, Bootstrap, custom, etc.)

HTML (truncated):
${cleanHtml.slice(0, 6000)}`,
      response_json_schema: {
        type: "object",
        properties: {
          color_palette: { type: "array", items: { type: "string" } },
          typography: { type: "object" },
          layout: { type: "string" },
          components: { type: "array", items: { type: "string" } },
          css_framework: { type: "string" },
        }
      }
    });

    return Response.json({
      html: cleanHtml.slice(0, 15000),
      design_analysis: llmRes,
      screenshot_url: null, // real screenshot would need a headless browser service
    });

  } catch (err) {
    console.error('uiClonerScrape error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});