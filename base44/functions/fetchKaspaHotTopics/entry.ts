// Fetches trending $KAS X (Twitter) posts from the past week using web-grounded
// LLM research, caches them in KaspaHotTopic, and returns the top posts by
// engagement. Results are cached per ISO week — the first call in a week
// triggers a fresh scrape; subsequent calls return the cache.
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

    // 2. Fetch fresh data via LLM web search
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Search the web for the most popular and trending X (Twitter) posts about Kaspa ($KAS cryptocurrency) from the past 7 days.

Include posts from: Kaspa core developers, KRC-20 token projects, Kaspa influencers, content creators, news accounts, and notable community members who discuss $KAS or #Kaspa.

For each post provide:
- author_handle: the X handle without @
- author_name: display name
- content: the full tweet text
- tweet_url: full URL to the tweet (https://x.com/handle/status/ID)
- impressions: estimated view count
- likes: like count
- retweets: retweet count
- replies: reply count
- posted_at: ISO date when the tweet was posted

IMPORTANT: Only include REAL posts that actually exist on X. Do not invent or fabricate tweets, handles, or URLs. Rank by total engagement (impressions + likes + retweets). Return the top 15 most popular posts from the past week.

Return JSON:
{
  "topics": [
    {
      "author_handle": "handle",
      "author_name": "Name",
      "content": "tweet text",
      "tweet_url": "https://x.com/handle/status/123",
      "impressions": 50000,
      "likes": 500,
      "retweets": 100,
      "replies": 50,
      "posted_at": "2026-08-20T10:00:00Z"
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
                author_handle: { type: 'string' },
                author_name: { type: 'string' },
                content: { type: 'string' },
                tweet_url: { type: 'string' },
                impressions: { type: 'number' },
                likes: { type: 'number' },
                retweets: { type: 'number' },
                replies: { type: 'number' },
                posted_at: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const data = typeof res === 'string' ? JSON.parse(res) : res;
    const topics = data.topics || [];

    // 3. Store new topics
    const records = topics
      .filter((t) => t.content && t.author_handle)
      .map((t) => ({
        tweet_id: (t.tweet_url || '').split('/status/')[1]?.split('?')[0] || '',
        author_handle: t.author_handle,
        author_name: t.author_name || t.author_handle,
        content: (t.content || '').slice(0, 500),
        tweet_url: t.tweet_url || `https://x.com/${t.author_handle}`,
        posted_at: t.posted_at || new Date().toISOString(),
        impressions: t.impressions || 0,
        likes: t.likes || 0,
        retweets: t.retweets || 0,
        replies: t.replies || 0,
        app_views: 0,
        week_key: weekKey,
        scraped_at: new Date().toISOString(),
      }));

    if (records.length > 0) {
      await base44.asServiceRole.entities.KaspaHotTopic.bulkCreate(records);
    }

    // 4. Return the stored records sorted by impressions
    const result = await base44.asServiceRole.entities.KaspaHotTopic.filter(
      { week_key: weekKey },
      '-impressions',
      20
    );

    return Response.json({ topics: result, source: 'fresh', weekKey });
  } catch (error) {
    console.error('[fetchKaspaHotTopics] error', error);
    return Response.json({ error: error.message, topics: [] }, { status: 500 });
  }
}