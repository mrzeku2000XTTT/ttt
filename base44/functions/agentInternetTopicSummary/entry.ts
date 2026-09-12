// Agent Internet hot-topic summaries — a 1-2 sentence summary of a single
// Kaspa hot topic fetched from the public topics feed.
// Narrow guest-facing operation: the prompt lives server-side and inputs are
// capped, so clients can't run arbitrary LLM prompts.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const MAX_TITLE = 200;
const MAX_CONTENT = 1200;
const MAX_SOURCE = 200;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const title = String(body.title || '').slice(0, MAX_TITLE);
    const content = String(body.content || '').slice(0, MAX_CONTENT);
    const source = String(body.source || '').slice(0, MAX_SOURCE);
    if (!content) return Response.json({ error: 'content required' }, { status: 400 });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Summarize this content about Kaspa in 1-2 clear sentences. Focus on the key point or announcement:\n\nTitle: ${title}\nContent: ${content}\nSource: ${source}`,
    });

    const summary = typeof res === 'string' ? res : (res?.text || '');
    return Response.json({ summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}