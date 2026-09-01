// 24/7 hourly crypto news fetcher — maintains a rolling 24-hour window of
// Kaspa + general crypto news + Kaspa YouTube videos. Deduplicates, fact-checks
// via web search, removes items older than 24h, and includes paid advertisements.
// Target: ~500 news items across 24 hours (~21 per hour).
//
// Performance: the hourly workflow passes { force: true } to trigger the slow LLM
// fetch. Frontend calls (no force flag) return existing cached data immediately.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isXLink, verifyXProfile } from '../../shared/xProfileVerify.ts';

function getHourKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCHours()).padStart(2, '0')}`;
}

const SCHEMA = {
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
};

function parseTopics(raw, category) {
  const records = [];
  for (const t of raw || []) {
    const url = (t.url || '').trim();
    if (!url || !url.startsWith('http')) continue;
    let host = '';
    try { host = new URL(url).host.replace(/^www\./, ''); } catch { continue; }
    let ytId = '';
    if (category === 'youtube') {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (m) ytId = m[1];
      else continue;
    }
    records.push({
      author_handle: host,
      author_name: (t.title || host).slice(0, 300),
      profile_image_url: '',
      content: (t.content || t.title || '').slice(0, 500),
      tweet_url: url,
      posted_at: new Date().toISOString(),
      hour_key: getHourKey(),
      scraped_at: new Date().toISOString(),
      category,
      youtube_video_id: ytId,
      is_advertisement: false,
    });
  }
  return records;
}

async function fetchCategory(base44, prompt) {
  try {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: SCHEMA,
    });
    return typeof res === 'string' ? JSON.parse(res) : res;
  } catch (e) {
    console.error('LLM fetch error:', e);
    return { topics: [] };
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const hourKey = getHourKey(now);

    // Read body for optional force flag (workflow passes force=true)
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    // 1. Check if this hour already has data
    const existingThisHour = await base44.asServiceRole.entities.KaspaHotTopic.filter(
      { hour_key: hourKey, is_advertisement: false },
      '-created_date',
      1
    );

    if (existingThisHour.length === 0) {
      // Only do the slow LLM fetch if forced (workflow) or no data exists at all
      const anyData = await base44.asServiceRole.entities.KaspaHotTopic.list('-scraped_at', 1);

      if (force || anyData.length === 0) {
        // Fetch new content for this hour — 3 parallel web searches
        const [kaspaData, cryptoData, ytData] = await Promise.all([
          fetchCategory(base44, `Search the web for the LATEST news about Kaspa ($KAS cryptocurrency) from today. Find real articles, blog posts, exchange listings, and news from the past few hours. Return up to 10 results as JSON. CRITICAL: Only return URLs you actually found via web search. Do NOT invent or fabricate any URLs.`),
          fetchCategory(base44, `Search the web for the LATEST cryptocurrency news from today — Bitcoin, Ethereum, major altcoins, DeFi, regulations, market moves, institutional adoption. Find real articles from the past few hours. Return up to 8 results as JSON. CRITICAL: Only return URLs you actually found via web search. Do NOT invent URLs.`),
          fetchCategory(base44, `Search the web for the LATEST YouTube videos about Kaspa ($KAS cryptocurrency) from this week. Find real YouTube video URLs. Return up to 5 results as JSON. CRITICAL: Only return youtube.com or youtu.be URLs you actually found.`),
        ]);

        const allNew = [
          ...parseTopics(kaspaData.topics, 'kaspa'),
          ...parseTopics(cryptoData.topics, 'crypto'),
          ...parseTopics(ytData.topics, 'youtube'),
        ];

        // Drop any X (Twitter) links whose handle no longer resolves — users
        // rename accounts, so a handle that was live at fetch time can 404 now.
        // Verify in parallel (bounded) so we never store dead profile links.
        const xLinks = allNew.filter(r => isXLink(r.tweet_url));
        const deadUrls = new Set<string>();
        if (xLinks.length > 0) {
          const verdicts = await Promise.all(
            xLinks.map((r) => verifyXProfile(r.tweet_url).catch(() => ({ live: true, reason: 'verify error', handle: null })))
          );
          xLinks.forEach((r, i) => {
            if (verdicts[i] && !verdicts[i].live) deadUrls.add(r.tweet_url);
          });
          if (deadUrls.size > 0) {
            console.log(`[fetchKaspaHotTopics] dropped ${deadUrls.size} dead X link(s)`);
          }
        }

        // Deduplicate against existing URLs to avoid repeating news
        const existing = await base44.asServiceRole.entities.KaspaHotTopic.list('-scraped_at', 600);
        const existingUrls = new Set(existing.map(e => e.tweet_url));
        const deduped = allNew.filter(r => !existingUrls.has(r.tweet_url) && !deadUrls.has(r.tweet_url));

        if (deduped.length > 0) {
          await base44.asServiceRole.entities.KaspaHotTopic.bulkCreate(deduped);
        }
      }
    }

    // 2. Cleanup: delete items older than 24 hours + expired ads
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const allItems = await base44.asServiceRole.entities.KaspaHotTopic.list('-scraped_at', 1000);
    for (const item of allItems) {
      const isOld = !item.is_advertisement && new Date(item.scraped_at) < cutoff;
      const isExpiredAd = item.is_advertisement && item.ad_expires_at && new Date(item.ad_expires_at) < now;
      if (isOld || isExpiredAd) {
        try { await base44.asServiceRole.entities.KaspaHotTopic.delete(item.id); } catch { /* best effort */ }
      }
    }

    // 3. Return current 24h window + active ads
    const recent = allItems
      .filter(item => !item.is_advertisement && new Date(item.scraped_at) >= cutoff)
      .sort((a, b) => new Date(b.scraped_at) - new Date(a.scraped_at))
      .slice(0, 500);

    const activeAds = allItems.filter(item =>
      item.is_advertisement &&
      item.ad_status === 'active' &&
      item.ad_expires_at &&
      new Date(item.ad_expires_at) >= now
    );

    // Interleave ads every ~100 items so they get seen multiple times
    const topics = [...recent];
    activeAds.forEach((ad, i) => {
      const insertAt = Math.min((i + 1) * 100, topics.length);
      topics.splice(insertAt, 0, ad);
    });

    return Response.json({
      topics,
      source: existingThisHour.length > 0 ? 'cache' : 'fresh',
      hourKey,
      utcTime: now.toISOString(),
      totalNews: recent.length,
      totalAds: activeAds.length,
    });
  } catch (error) {
    console.error('[fetchKaspaHotTopics] error', error);
    return Response.json({ error: error.message, topics: [] }, { status: 500 });
  }
}