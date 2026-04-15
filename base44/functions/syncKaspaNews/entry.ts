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

    // Load existing tweet_ids for dedup
    let existingIds = new Set();
    try {
      const allExisting = await entity.list('-created_date', 500);
      (Array.isArray(allExisting) ? allExisting : []).forEach(i => {
        if (i.tweet_id) existingIds.add(String(i.tweet_id));
      });
    } catch (e) {
      console.log('Preload IDs failed:', e.message);
    }

    // Fetch all feeds in parallel
    const feedEntries = Object.entries(FEEDS);
    const feedResults = await Promise.allSettled(
      feedEntries.map(async ([feedKey, endpoint]) => {
        const res = await fetch(`${BASE}/${endpoint}?limit=10`, {
          headers: { 'User-Agent': 'KaiBot/1.0' },
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items = data.data || data.tweets || data.posts || data.videos || data.reports || [];
        return { feedKey, items };
      })
    );

    // Build new records to create
    const toCreate = [];
    for (const result of feedResults) {
      if (result.status === 'rejected') {
        results.errors.push(result.reason?.message || 'Feed fetch failed');
        continue;
      }
      const { feedKey, items } = result.value;
      for (const item of items) {
        const tweet_id = String(item.id || item.tweet_id || item._id || `${feedKey}_${Date.now()}_${Math.random()}`);
        if (existingIds.has(tweet_id)) { results.skipped++; continue; }

        const authorObj = typeof item.author === 'object' && item.author !== null ? item.author : null;
        const authorUsername = String(authorObj?.username || authorObj?.screen_name || (typeof item.author === 'string' ? item.author : '') || item.author_username || item.username || '');
        const authorName = String(authorObj?.name || (typeof item.author_name === 'string' ? item.author_name : '') || authorUsername);

        toCreate.push({
          tweet_id,
          feed: feedKey,
          author_username: authorUsername,
          author_name: authorName,
          text: String(item.text || item.content || item.title || item.description || '').slice(0, 2000),
          url: String(item.url || item.tweet_url || item.link || ''),
          likes: Number(item.likes || item.favorite_count || 0),
          reposts: Number(item.reposts || item.retweet_count || 0),
          views: Number(item.views || item.view_count || 0),
          published_at: item.published_at || item.created_at || item.date || new Date().toISOString(),
          thumbnail: String(item.thumbnail || item.image || item.media?.[0]?.url || ''),
        });
        existingIds.add(tweet_id);
      }
    }

    // Create new records sequentially to avoid rate limiting
    for (const record of toCreate) {
      try {
        await entity.create(record);
        results.synced++;
      } catch (e) {
        // Skip duplicates / rate limit errors silently — will retry next run
        if (!e.message?.includes('Rate limit') && !e.message?.includes('duplicate')) {
          results.errors.push(e.message || 'Create failed');
        }
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