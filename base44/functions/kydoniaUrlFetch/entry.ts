import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// KYDONIA fetcher — one pasted URL in, cleaned readable text out.
// Same fetch strategies as fetchUrlContent, but with a much larger text budget
// (the index needs the whole page, not a summary) and a robots.txt decision.
// X/Twitter posts are delegated to fetchUrlContent rather than re-implemented.

const MAX_TEXT = 60000;
const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

const robotsCache = new Map();

const decodeEntities = (s) => String(s)
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#x27;/g, "'")
  .replace(/&mdash;/g, '—')
  .replace(/&ndash;/g, '–')
  .replace(/&hellip;/g, '…');

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

// Read the host's robots.txt once per function instance and answer "may we?".
async function robotsAllows(target) {
  const key = target.host;
  let rules = robotsCache.get(key);
  if (!rules) {
    rules = { disallow: [], allow: [], crawlDelay: 0 };
    try {
      const res = await fetch(`${target.origin}/robots.txt`, {
        headers: { 'User-Agent': UA_DESKTOP, Accept: 'text/plain,*/*' },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const txt = await res.text();
        let applies = false;
        for (const rawLine of txt.split('\n')) {
          const line = rawLine.split('#')[0].trim();
          if (!line) continue;
          const idx = line.indexOf(':');
          if (idx === -1) continue;
          const field = line.slice(0, idx).trim().toLowerCase();
          const value = line.slice(idx + 1).trim();
          if (field === 'user-agent') applies = value === '*';
          else if (applies && field === 'disallow' && value) rules.disallow.push(value);
          else if (applies && field === 'allow' && value) rules.allow.push(value);
          else if (applies && field === 'crawl-delay') rules.crawlDelay = Number(value) || 0;
        }
      }
    } catch {
      // No reachable robots.txt — treat the site as open.
    }
    robotsCache.set(key, rules);
  }
  const path = `${target.pathname}${target.search || ''}`;
  const allowed = rules.allow.some((p) => path.startsWith(p));
  const disallowed = rules.disallow.some((p) => path.startsWith(p));
  return { allowed: allowed || !disallowed, crawlDelay: rules.crawlDelay };
}

function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === 'localhost' || h === '::1' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^0\./.test(h)) return true;
  return /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

function cleanText(html) {
  // Prefer the article/main body when the page marks one up.
  const main = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const source = main ? main[1] : html;
  return decodeEntities(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
      .replace(/<form[\s\S]*?<\/form>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|li|h[1-6]|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim()
  );
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Sign in to index pages', code: 'unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let raw = String(body?.url || '').trim();
    if (!raw) return Response.json({ error: 'A URL is required' }, { status: 400 });
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    let target;
    try {
      target = new URL(raw);
    } catch {
      return Response.json({ error: 'That does not look like a URL' }, { status: 400 });
    }
    if (!/^https?:$/.test(target.protocol)) {
      return Response.json({ error: 'Only http and https pages can be indexed' }, { status: 400 });
    }
    if (isPrivateHost(target.hostname)) {
      return Response.json({ error: 'Private and local addresses cannot be indexed' }, { status: 400 });
    }

    const requestedUrl = target.toString();

    // X/Twitter posts need their own public mirrors — that logic already lives
    // in fetchUrlContent, so delegate instead of duplicating it here.
    if (/(?:^|\.)(x|twitter)\.com$/i.test(target.hostname) && /\/status(?:es)?\//i.test(target.pathname)) {
      try {
        const res = await base44.functions.invoke('fetchUrlContent', { url: requestedUrl });
        const d = res?.data || {};
        if (d?.textContent) {
          return Response.json({
            status: 'ready',
            url: d.url || requestedUrl,
            host: 'x.com',
            title: d.title || 'X post',
            description: d.metaDescription || '',
            headings: [],
            text: d.textContent,
            contentHash: hashString(d.textContent),
            robotsAllowed: true,
            truncated: false,
          });
        }
      } catch {
        // Fall through to the generic fetch below.
      }
    }

    const robots = await robotsAllows(target);
    if (!robots.allowed) {
      return Response.json({
        status: 'blocked',
        url: requestedUrl,
        host: target.hostname,
        robotsAllowed: false,
        error: 'robots.txt asks crawlers to stay out of this page',
      });
    }

    const strategies = [
      {
        headers: {
          'User-Agent': UA_DESKTOP,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      {
        headers: {
          'User-Agent': UA_MOBILE,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    ];

    let html = '';
    let status = 0;
    let finalUrl = requestedUrl;
    let contentType = '';

    for (const strategy of strategies) {
      try {
        const res = await fetch(requestedUrl, {
          headers: strategy.headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
        status = res.status;
        if (res.ok) {
          contentType = (res.headers.get('content-type') || '').toLowerCase();
          finalUrl = res.url || requestedUrl;
          html = await res.text();
          break;
        }
      } catch {
        // Try the next strategy.
      }
    }

    if (!html) {
      return Response.json({
        status: 'failed',
        url: requestedUrl,
        host: target.hostname,
        robotsAllowed: true,
        error: `Could not fetch the page (status ${status || 'no response'})`,
      });
    }

    if (contentType && !/text\/html|application\/xhtml|text\/plain/.test(contentType)) {
      return Response.json({
        status: 'failed',
        url: finalUrl,
        host: target.hostname,
        contentType,
        robotsAllowed: true,
        error: `That link is ${contentType.split(';')[0]} — only HTML pages can be indexed`,
      });
    }

    const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim()).slice(0, 300);
    const description = decodeEntities(
      (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1]
        || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim()
    ).slice(0, 600);
    const ogTitle = decodeEntities(
      (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || '').trim()
    ).slice(0, 300);

    const headings = [];
    for (const match of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
      const heading = decodeEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      if (heading) headings.push(heading.slice(0, 200));
      if (headings.length >= 30) break;
    }

    const full = cleanText(html);
    const text = full.slice(0, MAX_TEXT);

    let host = target.hostname;
    try {
      host = new URL(finalUrl).hostname;
    } catch {
      // Keep the requested host.
    }

    return Response.json({
      status: 'ready',
      url: finalUrl,
      host,
      title: title || ogTitle || host,
      description,
      headings,
      text,
      contentHash: hashString(text),
      robotsAllowed: true,
      truncated: full.length > MAX_TEXT,
      crawlDelay: robots.crawlDelay,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}