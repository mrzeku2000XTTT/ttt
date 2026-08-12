// Per-site AI agent. Grounds answers in the actual site's page text (home +
// common docs paths) plus live web knowledge, so users can chat about any
// indexed Kaspa ecosystem site.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function grab(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TTTAgent/1.0)' },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return '';
    const text = stripHtml(await res.text());
    return text.slice(0, 4000);
  } catch {
    return '';
  }
}

// Home + about/docs, fetched in parallel. Cached client-side after the first turn.
async function buildKnowledge(url: string) {
  let origin = url;
  try { origin = new URL(url).origin; } catch { /* keep */ }
  const chunks = await Promise.all([grab(url), grab(origin + '/about'), grab(origin + '/docs')]);
  return chunks.filter(Boolean).join('\n\n---\n\n').slice(0, 9000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const base44 = createClientFromRequest(req);
    const { url, name, description, category, messages, knowledge: cached, fast } = await req.json();
    if (!url) return Response.json({ success: false, error: 'url required' }, { status: 400, headers: CORS });

    // Reuse knowledge the client already has — skips all scraping on follow-ups.
    const knowledge = cached || (await buildKnowledge(url));
    const history = (messages || [])
      .slice(-10)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n');

    const answer = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the dedicated AI agent for "${name || url}" — a site indexed in the Kaspa ecosystem directory.

SITE
Name: ${name || 'Unknown'}
URL: ${url}
Category: ${category || 'Ecosystem'}
Indexed description: ${description || 'n/a'}

CONTENT SCRAPED FROM THE SITE (home / about / docs / faq):
${knowledge || '(no readable text — the site may be a JS app; rely on web knowledge)'}

CONVERSATION SO FAR:
${history || '(new conversation)'}

Answer the user's latest message about this site. Be concrete and helpful: what it does, how to use it, tokens, fees, safety, how it relates to Kaspa. Prefer the scraped content; say when you are unsure. ${fast ? 'Answer in ONE short sentence, max 25 words.' : 'Answer in 2-4 short plain sentences.'} No markdown headings, no bullet lists.`,
      // Web search only when the site itself gave us nothing — it's the slow path (skipped in fast mode).
      add_context_from_internet: !knowledge && !fast,
      model: 'gemini_3_flash',
    });

    return Response.json(
      { success: true, answer: typeof answer === 'string' ? answer.trim() : '', knowledge, grounded: !!knowledge },
      { headers: CORS },
    );
  } catch (error) {
    console.error('siteAgentChat error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500, headers: CORS });
  }
});