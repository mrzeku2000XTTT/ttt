import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function timeAgo(dateStr) {
  try {
    const d = new Date(dateStr), s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  } catch { return ""; }
}

async function scrapePage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim() : url;
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'')
      .replace(/<[^>]+>/g,' ')
      .replace(/&nbsp;/g,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
    if (text.length > 8000) text = text.substring(0,8000) + '... [truncated]';
    return { title, content: text };
  } catch(_) { return null; }
}

async function fetchTweet(tweetUrl) {
  const apiUrl = tweetUrl
    .replace(/^https?:\/\/(www\.)?x\.com/, 'https://api.fxtwitter.com')
    .replace(/^https?:\/\/(www\.)?twitter\.com/, 'https://api.fxtwitter.com')
    .split('?')[0];
  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaiBot/1.0)', 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error('Tweet fetch failed');
  const data = await res.json();
  const tweet = data.tweet;
  if (!tweet || data.code !== 200) throw new Error('Tweet not found');
  const handle = tweet.author?.screen_name ? `@${tweet.author.screen_name}` : '';
  const text = tweet.text || '';
  const externalLinks = (tweet.links || [])
    .map(l => l.expanded || l.url)
    .filter(u => u && !u.includes('x.com') && !u.includes('twitter.com') && !u.includes('t.co'));
  let out = `Author: ${tweet.author?.name||''} (${handle})\nPosted: ${tweet.created_at||''}\n\nTweet:\n${text}`;
  if (externalLinks.length) out += `\n\nExternal links:\n${externalLinks.map(u => `  🔗 ${u}`).join('\n')}`;
  const stats = [
    tweet.likes ? `❤️ ${tweet.likes}` : '',
    tweet.retweets ? `🔁 ${tweet.retweets}` : '',
    tweet.views ? `👁 ${tweet.views}` : ''
  ].filter(Boolean).join('  ');
  if (stats) out += `\n\nEngagement: ${stats}`;
  return { content: out.trim(), title: `${handle}: ${text.substring(0,80)}`, externalLinks };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
  });
  try {
    const base44 = createClientFromRequest(req);
    const reqUrl = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const transcripts = base44.asServiceRole.entities.KaiTranscript;

    // Tweet mode
    const tweetParam = reqUrl.searchParams.get("tweet") || body.tweet || "";
    if (tweetParam) {
      const existing = await transcripts.filter({ url: tweetParam });
      if (existing?.length > 0) {
        const c = existing[0];
        return Response.json({ success: true, cached: true, title: c.title, content: c.transcript, formatted: `🐦 Cached\n${c.transcript}` }, { headers: { "Access-Control-Allow-Origin": "*" } });
      }
      const tweetResult = await fetchTweet(tweetParam);
      const linkedPages = [];
      for (const linkUrl of tweetResult.externalLinks.slice(0,3)) {
        const page = await scrapePage(linkUrl);
        if (page && page.content.length > 100) linkedPages.push({ url: linkUrl, title: page.title, content: page.content });
      }
      let fullContent = tweetResult.content;
      for (const page of linkedPages) fullContent += `\n\n${'─'.repeat(40)}\n📄 LINKED: "${page.title}"\n🔗 ${page.url}\n\n${page.content}`;
      const wordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
      await transcripts.create({
        video_id: `tweet_${Date.now()}`,
        url: tweetParam,
        title: tweetResult.title,
        transcript: fullContent,
        word_count: wordCount,
        status: 'ready',
        language: 'en',
        is_generated: false,
        chunk_count: 1 + linkedPages.length,
        chunks: [tweetResult.content, ...linkedPages.map(p => `${p.title}\n${p.url}\n${p.content}`)]
      });
      return Response.json({
        success: true,
        title: tweetResult.title,
        content: fullContent,
        linked_pages: linkedPages.map(p => ({ title: p.title, url: p.url, content: p.content })),
        word_count: wordCount,
        chunks_stored: 1 + linkedPages.length
      }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // News feed mode
    const feed = reqUrl.searchParams.get("feed") || body.feed || "focused";
    const format = reqUrl.searchParams.get("format") || body.format || "feed";
    const limit = parseInt(reqUrl.searchParams.get("limit") || body.limit || "5");
    const q = reqUrl.searchParams.get("q") || body.q || "";
    const newsEntity = base44.asServiceRole.entities.KaspaNewsItem;

    let items;
    if (q) {
      const all = await newsEntity.list();
      const ql = q.toLowerCase();
      items = (Array.isArray(all) ? all : [])
        .filter(i => (i.text||'').toLowerCase().includes(ql) || (i.author_username||'').toLowerCase().includes(ql))
        .slice(0, limit);
    } else if (feed === "all") {
      const all = await newsEntity.list();
      items = (Array.isArray(all) ? all : [])
        .sort((a, b) => new Date(b.published_at||0).getTime() - new Date(a.published_at||0).getTime())
        .slice(0, limit);
    } else {
      const filtered = await newsEntity.filter({ feed });
      items = (Array.isArray(filtered) ? filtered : [])
        .sort((a, b) => new Date(b.published_at||0).getTime() - new Date(a.published_at||0).getTime())
        .slice(0, limit);
    }

    if (format === "json") {
      return Response.json({ feed, items, count: items.length }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (format === "prompt") {
      const lines = items.map(i => `@${i.author_username||'?'} · ${timeAgo(i.published_at)}\n${i.text||''}\n${i.url ? `🔗 ${i.url}` : ''}\n❤️ ${i.likes||0}  🔁 ${i.reposts||0}  👁 ${i.views||0}`);
      const prompt = `LIVE KASPA ${feed.toUpperCase()} CONTEXT — ${items.length} items as of ${new Date().toUTCString()}\n${'─'.repeat(40)}\n${lines.join('\n\n'+'─'.repeat(40)+'\n')}`;
      return new Response(prompt, { headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" } });
    }

    const lines = items.map(i => `@${i.author_username||'?'} · ${timeAgo(i.published_at)}\n${i.text||''}\n${i.url ? `🔗 ${i.url}` : ''}\n❤️ ${i.likes||0}  🔁 ${i.reposts||0}  👁 ${i.views||0}`);
    const formatted = `📰 KASPA ${feed.toUpperCase()} — ${items.length} items\n${'─'.repeat(40)}\n${lines.join('\n\n'+'─'.repeat(40)+'\n')}`;
    return Response.json({ feed, count: items.length, formatted, items }, { headers: { "Access-Control-Allow-Origin": "*" } });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});