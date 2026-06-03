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

    const prompt = `You are MetaMimic, an expert front-end engineer. Look at the attached screenshot/image of a web page or UI and reproduce it as a single, self-contained, production-ready HTML file.

Requirements:
- Output ONE complete HTML document (<!DOCTYPE html> ... </html>).
- Inline all CSS inside a <style> tag in the <head>. No external stylesheets or frameworks.
- Match layout, colors, spacing, typography, and component structure as closely as possible.
- Make it responsive and mobile-friendly.
- Use semantic HTML. Use placeholder text where the image text is unreadable.
${instructions ? `- Extra instructions from the user: ${instructions}` : ''}

Return ONLY the raw HTML document. Do not wrap it in markdown code fences. Do not add any explanation before or after.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [imageUrl],
      model: 'claude_sonnet_4_6',
    });

    let html = typeof result === 'string' ? result : (result?.html || '');
    // Strip accidental markdown fences if present
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

    if (!html) {
      return Response.json({ error: 'No HTML generated' }, { status: 502 });
    }

    return Response.json({ html });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});