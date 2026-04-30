import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function absolutize(base, href) {
  try { return new URL(href, base).toString(); } catch { return null; }
}

async function fetchText(url, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.5' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extractTag(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  return m ? m[1] : '';
}

function extractText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractInternalLinks(html, baseUrl) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const baseHost = (() => { try { return new URL(baseUrl).host; } catch { return ''; } })();
  const links = [];
  const seen = new Set();
  const re = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    const abs = absolutize(baseUrl, href);
    if (!abs) continue;
    try {
      const u = new URL(abs);
      if (u.host !== baseHost) continue;
      if (u.pathname === '/' || u.pathname === '') continue;
      // Skip likely-noisy paths
      if (/\.(png|jpg|jpeg|gif|webp|svg|pdf|zip|mp4|mp3|css|js)(\?|$)/i.test(u.pathname)) continue;
      const clean = `${u.origin}${u.pathname}`;
      if (seen.has(clean)) continue;
      seen.add(clean);
      links.push({ href: clean, label: text.slice(0, 60) });
    } catch { /* skip */ }
  }
  return links.slice(0, 5);
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Auth (any logged-in user)
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload;
  try { payload = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { url } = payload || {};
  if (!url || typeof url !== 'string') return Response.json({ error: 'Missing url' }, { status: 400 });

  // Normalize
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

  try {
    const rootHtml = await fetchText(target, 9000);
    if (!rootHtml) return Response.json({ error: 'Could not fetch site' }, { status: 400 });

    const title = extractTag(rootHtml, 'title').slice(0, 200);
    const description = (extractMeta(rootHtml, 'description') || extractMeta(rootHtml, 'og:description') || '').slice(0, 500);
    const ogImage = extractMeta(rootHtml, 'og:image');
    const ogSiteName = extractMeta(rootHtml, 'og:site_name');

    const rootText = extractText(rootHtml).slice(0, 6000);
    const subLinks = extractInternalLinks(rootHtml, target);

    // Fetch up to 5 subpages in parallel
    const subs = await Promise.all(
      subLinks.map(async (l) => {
        const html = await fetchText(l.href, 6000);
        if (!html) return null;
        return {
          url: l.href,
          label: l.label,
          title: extractTag(html, 'title').slice(0, 150),
          text: extractText(html).slice(0, 3000),
        };
      })
    );

    return Response.json({
      url: target,
      title,
      description,
      og_image: ogImage,
      site_name: ogSiteName,
      root_text: rootText,
      sub_pages: subs.filter(Boolean),
    });
  } catch (err) {
    return Response.json({ error: err.message || 'Scrape failed' }, { status: 500 });
  }
});