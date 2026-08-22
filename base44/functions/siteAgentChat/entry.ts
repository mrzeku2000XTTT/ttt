// Per-site AI agent. Grounds answers in the actual site's page text (home +
// common docs paths) plus live web knowledge, so users can chat about any
// indexed Kaspa ecosystem site.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { fetchKcc20Lore, loreToKnowledge } from '../../shared/kcc20Lore.ts';

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

async function grab(url: string, timeout = 3500) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TTTAgent/1.0)' },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return '';
    const text = stripHtml(await res.text());
    return text.slice(0, 4000);
  } catch {
    return '';
  }
}

// Home + about/docs, fetched in parallel. Cached client-side after the first turn.
// Quick mode reads the home page only with a tight timeout — /about and /docs are
// usually 404s that just add seconds.
async function buildKnowledge(url: string, quick = false) {
  if (quick) return await grab(url, 2500);
  let origin = url;
  try { origin = new URL(url).origin; } catch { /* keep */ }
  const chunks = await Promise.all([grab(url), grab(origin + '/about'), grab(origin + '/docs')]);
  return chunks.filter(Boolean).join('\n\n---\n\n').slice(0, 9000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const base44 = createClientFromRequest(req);
    const { url, name, description, category, messages, knowledge: cached, fast, prefetch, tick } = await req.json();
    if (!url) return Response.json({ success: false, error: 'url required' }, { status: 400, headers: CORS });

    // KCC20 covenant tokens get a dedicated, token-specific knowledge base built
    // from the KRON registry (creator address) + a web-grounded lore search.
    // Scraping the kron.technology token page is useless (JS shell), so we never
    // do it for these — the agent must answer about the token, not the platform.
    const isKcc20 = (category || '').toUpperCase().includes('KCC20');
    const kcc20Tick = (tick || '').toString().toUpperCase().trim();

    if (isKcc20 && kcc20Tick) {
      if (prefetch) {
        const lore = await fetchKcc20Lore(kcc20Tick, base44);
        return Response.json({ success: true, knowledge: loreToKnowledge(lore), lore }, { headers: CORS });
      }
      const knowledge = cached || loreToKnowledge(await fetchKcc20Lore(kcc20Tick, base44));
      const thin = !fast && !knowledge;
      const history = (messages || [])
        .slice(-6)
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
        .join('\n');

      const answer = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the dedicated AI agent for the Kaspa KCC-20 token "${name || kcc20Tick}".

This is a SPECIFIC token — NOT the kron.technology platform and NOT the KCC-20 standard. Answer ONLY about this token ($${kcc20Tick}): what it is, what it is used for, who created it, its website, its X (Twitter) profile, its community and lore, and its live market.

ON-CHAIN + WEB RESEARCH ABOUT THIS TOKEN:
${knowledge || '(no lore available — say you could not find project-specific info)'}

CONVERSATION SO FAR:
${history || '(new conversation)'}

Rules:
- Talk about the "${name || kcc20Tick}" ($${kcc20Tick}) token and its creators specifically.
- If asked who the dev/creator is, their recent work, or their vision, use the "Dev profile", "Recent dev posts", "Creator / dev X profile" and "Scraped project website text" in the knowledge above. If those say "not found", say you could not find the dev profile — do NOT invent one and do NOT fall back to describing kron.technology.
- If asked what the token is used for or what the project's vision is, prefer the scraped website text and project lore; if those are empty, say you could not find it.
- Do NOT explain what kron.technology is, what a bonding curve is, or what KCC-20 is unless the user explicitly asks. Never answer a token question by describing the kron platform.
- If the user asks about price or market, use the on-chain numbers above.
- Be direct, concrete, and specific to this token.

${fast ? 'Answer in ONE short sentence, max 25 words.' : 'Answer in 2-4 short plain sentences.'} No markdown headings, no bullet lists, no citation markers like [1].`,
        add_context_from_internet: !!thin,
        model: thin ? 'gemini_3_flash' : fast ? 'gpt_5_mini' : 'gemini_3_flash',
      });

      return Response.json(
        { success: true, answer: typeof answer === 'string' ? answer.trim() : '', knowledge, grounded: !!knowledge },
        { headers: CORS },
      );
    }

    // Warm-up call from the client when the panel opens: read the site, no LLM.
    if (prefetch) {
      const warm = await buildKnowledge(url, !!fast);
      return Response.json({ success: true, knowledge: warm }, { headers: CORS });
    }

    // Reuse knowledge the client already has — skips all scraping on follow-ups.
    const knowledge = cached || (await buildKnowledge(url, !!fast));
    // A JS-app shell ("loading…") yields a few useless words — treat that as no content
    // so we fall back to live web knowledge instead of inventing a status.
    // Web search is the single slowest step (~60s), so quick replies never use it —
    // they answer from the page text plus the model's own knowledge.
    const thin = !fast && (knowledge || '').length < 600;
    const history = (messages || [])
      .slice(-6)
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
${(fast ? (knowledge || '').slice(0, 2500) : knowledge) || '(no readable text — the site may be a JS app; rely on web knowledge)'}

CONVERSATION SO FAR:
${history || '(new conversation)'}

Answer the user's latest message about this site. Be concrete and helpful: what it does, how to use it, tokens, fees, safety, how it relates to Kaspa. Prefer the scraped content; say when you are unsure.

NEVER guess launch status. Do not call a site "upcoming", "coming soon", "in development" or "not yet launched" unless the scraped content or web results explicitly say so. If the page text is just a loading shell or you have no evidence either way, treat the site as live and describe what it does — or say you could not read the page. Never invent dates or roadmap claims.

${fast ? 'Answer in ONE short sentence, max 25 words.' : 'Answer in 2-4 short plain sentences.'} No markdown headings, no bullet lists, and no citation markers like [1].`,
      // Fall back to live web knowledge whenever the page itself gave us little or nothing.
      add_context_from_internet: thin,
      // Quick replies use the fastest model; the web-search path needs gemini.
      model: thin ? 'gemini_3_flash' : fast ? 'gpt_5_mini' : 'gemini_3_flash',
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