// Fetches trending Kaspa content using LLM web search. The LLM searches the
// web and returns REAL URLs it found — we parse each URL to extract the
// source, handle, and content. No metrics are fabricated. Cached per ISO week.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function getWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const weekNum = 1 + Math.round(
    ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const weekKey = getWeekKey();

    // 1. Check for cached results from this week
    const cached = await base44.asServiceRole.entities.KaspaHotTopic.filter(
      { week_key: weekKey },
      '-impressions',
      20
    );
    if (cached.length > 0) {
      return Response.json({ topics: cached, source: 'cache', weekKey });
    }

    // 2. Use LLM with web search to find REAL content about Kaspa
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Search the web for recent, popular content about Kaspa ($KAS cryptocurrency) from the past week.

Look for real articles, blog posts, Reddit discussions, YouTube videos, and X/Twitter posts about Kaspa.

For each result, return:
- url: the ACTUAL URL you found via web search (must be real — do NOT invent URLs)
- title: the title of the page or post
- content: a 1-2 sentence excerpt of what the content is about
- source: the domain name (e.g. "reddit.com", "youtube.com", "x.com", "newsbtc.com")

CRITICAL RULES:
- Only return URLs that you ACTUALLY found in your web search results
- Do NOT generate, invent, or fabricate any URLs
- Do NOT make up engagement metrics
- If you found fewer than 15 results, return only what you actually found
- Prioritize content from the past 7 days

Return JSON:
{
  "topics": [
    {
      "url": "https://example.com/article",
      "title": "Title here",
      "content": "Brief excerpt of the content",
      "source": "example.com"
    }
  ]
}`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          topics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
                source: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const data = typeof res === 'string' ? JSON.parse(res) : res;
    const rawTopics = data.topics || [];

    // 3. Parse URLs and build records — only keep entries with valid URLs
    const records = [];
    for (const t of rawTopics) {
      const url = (t.url || '').trim();
      if (!url || !url.startsWith('http')) continue;

      let host = '';
      try { host = new URL(url).host.replace(/^www\./, ''); } catch { continue; }

      // Extract X/Twitter handle if it's an X URL
      const xMatch = url.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/);
      const xProfileMatch = !xMatch && url.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/);

      const handle = xMatch ? xMatch[1] : (xProfileMatch ? xProfileMatch[1] : '');
      const tweetId = xMatch ? xMatch[2] : '';

      records.push({
        tweet_id: tweetId,
        author_handle: handle || host,
        author_name: t.title || handle || host,
        profile_image_url: handle ? `https://unavatar.io/x/${handle}` : '',
        content: (t.content || t.title || '').slice(0, 500),
        tweet_url: url,
        posted_at: new Date().toISOString(),
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        app_views: 0,
        week_key: weekKey,
        scraped_at: new Date().toISOString(),
      });
    }

    // 4. Store
    if (records.length > 0) {
      await base44.asServiceRole.entities.KaspaHotTopic.bulkCreate(records);
    }

    // 5. Return stored records
    const stored = await base44.asServiceRole.entities.KaspaHotTopic.filter(
      { week_key: weekKey },
      '-impressions',
      20
    );

    return Response.json({ topics: stored, source: 'web_search', weekKey, found: rawTopics.length, parsed: records.length });
  } catch (error) {
    console.error('[fetchKaspaHotTopics] error', error);
    return Response.json({ error: error.message, topics: [] }, { status: 500 });
  }
}