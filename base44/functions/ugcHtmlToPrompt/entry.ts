// UGC Factory — HTML-to-Prompt converter.
// Reuses the prompt-skill library master prompt (base44/shared/ugcMasterPrompt)
// to turn any HTML into a clean, self-contained prompt. The LLM does the
// noise-stripping and structuring in one pass; we cap input size and require
// auth so only logged-in users can run it.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildUGCMasterPrompt } from '../../shared/ugcMasterPrompt.ts';

const MAX_HTML = 60000;
const MODES = ['recreate', 'animate', 'video'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const html = String(body.html || '').trim();
    const mode = MODES.includes(body.mode) ? body.mode : 'recreate';
    if (!html) return Response.json({ error: 'html required' }, { status: 400 });
    if (html.length > MAX_HTML) return Response.json({ error: `html too large (max ${MAX_HTML} chars)` }, { status: 400 });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildUGCMasterPrompt(mode) + '\n\nHTML:\n"""' + html + '"""',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          layout_type: { type: 'string' },
          palette: { type: 'array', items: { type: 'string' } },
          content_summary: { type: 'string' },
          prompt: { type: 'string' },
        },
        required: ['title', 'layout_type', 'palette', 'content_summary', 'prompt'],
      },
    });

    const data = typeof res === 'string' ? JSON.parse(res) : res;
    return Response.json({ ...data, mode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}