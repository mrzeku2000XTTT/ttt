// Agent Internet directory search — translates a natural-language query into
// directory keywords + a category filter.
// Narrow guest-facing operation: the prompt lives server-side and the query is
// capped, so clients can't run arbitrary LLM prompts.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const MAX_QUERY = 300;
const CATEGORIES = ['Ecosystem', 'Resources', 'Exchanges', 'Wallets', 'Merchant Solutions', 'Developer Tools', 'Community Chats', 'News Sources', 'X Profiles'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const query = String(body.query || '').trim().slice(0, MAX_QUERY);
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `A user searched a Kaspa app directory with this natural-language query: "${query}"

Return the 1-3 best short keywords to match against app names, descriptions and tags, and the single best matching category from this list (or empty string if none fits): ${CATEGORIES.join(', ')}.
Keywords must be plain single words or short phrases, no punctuation.`,
      response_json_schema: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
        },
      },
    });

    const data = typeof res === 'string' ? JSON.parse(res) : res;
    return Response.json({
      keywords: Array.isArray(data?.keywords) ? data.keywords.slice(0, 3) : [],
      category: CATEGORIES.includes(data?.category) ? data.category : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}