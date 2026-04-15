import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE = "https://kaspa.news/api";
const FEEDS = {
  focused:    "focused-tweets",
  builders:   "builder-tweets",
  developers: "developer-tweets",
  videos:     "kaspa-videos",
  reddit:     "reddit-posts",
  pulse:      "reports",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
  });
  try {
    const base44 = createClientFromRequest(req);
    const entity = base44.asServiceRole.entities.KaspaNewsItem;
    const results = { synced: 0, skipped: 0, errors: [] };

    for (const [feedKey, endpoint] of Object.entries(FEEDS)) {
      try {
        const res = await fetch(`${BASE}/${endpoint}?limit=20`, {
          headers: { 'User-Agent': 'KaiBot/1.0' },
          signal: AbortSignal.timeout(15000)
        });
        if (!res.ok) { results.errors.push(`${feedKey}: HTTP ${res.status}`); continue; }
        const data = await res.json();
        const items = data.data || data.tweets || data.posts || data.videos || data.reports || [];

        for (const item of items) {
          const tweet_id = String(item.id || item.tweet_id || item._id || `${feedKey}_${Date.now()}_${Math.random()}`);
          const existing = await entity.filter({ tweet_id });
          if (existing?.length > 0) { results.skipped++; continue; }

          await entity.create({
            tweet_id,
            feed: feedKey,
            author_username: item.author_username || item.username || item.author?.screen_name || item.author || '',
            author_name: item.author_name || item.author?.name || item.author_username || '',
            text: item.text || item.content || item.title || item.description || '',
            url: item.url || item.tweet_url || item.link || '',
            likes: item.likes || item.favorite_count || 0,
            reposts: item.reposts || item.retweet_count || 0,
            views: item.views || item.view_count || 0,
            published_at: item.published_at || item.created_at || item.date || new Date().toISOString(),
            thumbnail: item.thumbnail || item.image || item.media?.[0]?.url || '',
            raw_json: item,
          });
          results.synced++;
        }
      } catch (e) {
        results.errors.push(`${feedKey}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});