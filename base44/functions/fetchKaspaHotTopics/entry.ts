// Fetches trending $KAS X (Twitter) posts using the REAL X API v2 recent
// search endpoint. Returns actual tweets with real URLs, engagement metrics,
// and profile images. Cached per ISO week.
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

    // 2. Fetch real tweets from X API v2
    const X_API_KEY = process.env.X_API_KEY;
    if (!X_API_KEY) {
      return Response.json({ error: 'X_API_KEY not configured', topics: [] }, { status: 500 });
    }

    const query = encodeURIComponent('$KAS OR #Kaspa -is:retweet lang:en');
    const tweetFields = 'public_metrics,created_at,author_id,entities';
    const userFields = 'name,username,profile_image_url';
    const expansions = 'author_id';

    let allTweets = [];
    let userMap = {};
    let nextToken = null;

    // Fetch up to 3 pages (up to 300 tweets) to find the most popular ones
    for (let page = 0; page < 3; page++) {
      let url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=${tweetFields}&expansions=${expansions}&user.fields=${userFields}&max_results=100`;
      if (nextToken) {
        url += `&next_token=${encodeURIComponent(nextToken)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${X_API_KEY}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('X API error:', response.status, errorText);
        break;
      }

      const data = await response.json();
      if (data.data) allTweets = allTweets.concat(data.data);
      if (data.includes?.users) {
        for (const user of data.includes.users) {
          userMap[user.id] = user;
        }
      }

      if (data.meta?.next_token) {
        nextToken = data.meta.next_token;
      } else {
        break;
      }
    }

    if (allTweets.length === 0) {
      return Response.json({ topics: [], source: 'x_api_empty', weekKey });
    }

    // 3. Sort by engagement (weighted: impressions + likes*10 + retweets*20 + replies*5)
    const scored = allTweets.map((t) => {
      const m = t.public_metrics || {};
      const score =
        (m.impression_count || 0) +
        (m.like_count || 0) * 10 +
        (m.retweet_count || 0) * 20 +
        (m.reply_count || 0) * 5;
      return { tweet: t, score, metrics: m };
    });
    scored.sort((a, b) => b.score - a.score);

    // 4. Take top 20 and build records
    const top = scored.slice(0, 20);
    const records = top.map(({ tweet, metrics }) => {
      const user = userMap[tweet.author_id] || {};
      const handle = user.username || 'unknown';
      const tweetId = tweet.id;
      // Upgrade profile image from _normal (48px) to _bigger (73px) for clarity
      const profileImage = (user.profile_image_url || '').replace('_normal', '_bigger');
      return {
        tweet_id: tweetId,
        author_handle: handle,
        author_name: user.name || handle,
        profile_image_url: profileImage,
        content: (tweet.text || '').slice(0, 500),
        tweet_url: `https://x.com/${handle}/status/${tweetId}`,
        posted_at: tweet.created_at || new Date().toISOString(),
        impressions: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        app_views: 0,
        week_key: weekKey,
        scraped_at: new Date().toISOString(),
      };
    });

    // 5. Store
    if (records.length > 0) {
      await base44.asServiceRole.entities.KaspaHotTopic.bulkCreate(records);
    }

    // 6. Return stored records sorted by impressions
    const result = await base44.asServiceRole.entities.KaspaHotTopic.filter(
      { week_key: weekKey },
      '-impressions',
      20
    );

    return Response.json({ topics: result, source: 'x_api', weekKey });
  } catch (error) {
    console.error('[fetchKaspaHotTopics] error', error);
    return Response.json({ error: error.message, topics: [] }, { status: 500 });
  }
}