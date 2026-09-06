import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL required' }, { status: 400 });
    }

    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    // X/Twitter post links: the page is JS-only and returns generic metadata.
    // Use the public oEmbed endpoint to get the exact post text instead.
    const xMatch = normalized.match(/(?:x|twitter)\.com\/[^/]+\/status(?:es)?\/(\d+)/i);
    if (xMatch) {
      // Public JSON mirrors of the post — full text and author without a login
      // wall. Try them before the oEmbed endpoint, which often rate-limits.
      for (const apiUrl of [
        `https://api.fxtwitter.com/status/${xMatch[1]}`,
        `https://api.vxtwitter.com/status/${xMatch[1]}`,
      ]) {
        try {
          const mres = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
          if (!mres.ok) continue;
          const j = await mres.json();
          const t = j?.tweet || j?.data || {};
          const tweetText = String(t?.text || '').replace(/\s+/g, ' ').trim();
          if (tweetText) {
            return Response.json({
              url: normalized,
              host: 'x.com',
              status: 200,
              title: `Post by ${t?.author?.name || t?.user?.name || 'X user'}`,
              metaDescription: tweetText,
              siteName: 'X (Twitter)',
              headings: [],
              textContent: tweetText,
              contentLength: tweetText.length,
              isXPost: true,
              authorName: t?.author?.name || t?.user?.name || '',
            });
          }
        } catch { /* try the next mirror */ }
      }
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(`https://twitter.com/i/status/${xMatch[1]}`)}&omit_script=1&dnt=true`;
        const ores = await fetch(oembedUrl, { signal: AbortSignal.timeout(12000) });
        if (ores.ok) {
          const o = await ores.json();
          const tweetText = String(o?.html || '')
            .split('&mdash;')[0]
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
          if (tweetText) {
            return Response.json({
              url: normalized,
              host: 'x.com',
              status: 200,
              title: `Post by ${o?.author_name || 'X user'}`,
              metaDescription: tweetText,
              siteName: 'X (Twitter)',
              headings: [],
              textContent: tweetText,
              contentLength: tweetText.length,
              isXPost: true,
              authorName: o?.author_name || '',
            });
          }
        }
      } catch { /* fall through to the generic fetch below */ }
    }

    const strategies = [
      {
        name: 'Desktop',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      {
        name: 'Mobile',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    ];

    let html = '';
    let fetchStatus = 0;
    let finalUrl = normalized;

    for (const s of strategies) {
      try {
        const res = await fetch(normalized, {
          headers: s.headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(12000),
        });
        if (res.ok) {
          html = await res.text();
          fetchStatus = res.status;
          finalUrl = res.url || normalized;
          break;
        }
        fetchStatus = res.status;
      } catch { /* try next strategy */ }
    }

    if (!html) {
      return Response.json({
        error: `Could not fetch URL (status ${fetchStatus})`,
        url: normalized,
      }, { status: 200 });
    }

    const decodeEntities = (s) => s
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'");

    const title = decodeEntities(
      (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim()
    ).slice(0, 300);
    const desc = decodeEntities(
      (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim()
    ).slice(0, 500);
    const ogTitle = decodeEntities(
      (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim()
    ).slice(0, 300);
    const ogDesc = decodeEntities(
      (html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim()
    ).slice(0, 500);
    const ogSite = decodeEntities(
      (html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim()
    ).slice(0, 200);

    // Extract headings for structure
    const headings = [];
    for (const m of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
      const h = m[1].replace(/<[^>]+>/g, '').trim();
      if (h) headings.push(decodeEntities(h).slice(0, 200));
    }

    // Clean body text — strip scripts, styles, nav, footer, then tags
    const text = decodeEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<header[\s\S]*?<\/header>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    ).slice(0, 5000);

    let host = '';
    try { host = new URL(finalUrl).hostname; } catch { /* ignore */ }

    return Response.json({
      url: finalUrl,
      host,
      status: fetchStatus,
      title: title || ogTitle,
      metaDescription: desc || ogDesc,
      siteName: ogSite,
      headings: headings.slice(0, 20),
      textContent: text,
      contentLength: html.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}