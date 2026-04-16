import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function absolutize(base, href) {
  try { return new URL(href, base).toString(); } catch { return null; }
}

async function fetchText(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,text/css,*/*;q=0.8' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
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

function extractLinkedCSS(html, baseUrl) {
  const links = [];
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  const matches = html.match(linkRe) || [];
  for (const tag of matches) {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      const abs = absolutize(baseUrl, hrefMatch[1]);
      if (abs) links.push(abs);
    }
  }
  return links.slice(0, 5); // cap to 5 stylesheets to stay fast
}

function extractInlineStyles(html) {
  const styles = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html)) !== null) styles.push(m[1]);
  return styles.join('\n');
}

function extractColors(css) {
  const hex = new Set((css.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || []));
  const rgb = new Set((css.match(/rgba?\([^)]+\)/g) || []));
  const hsl = new Set((css.match(/hsla?\([^)]+\)/g) || []));
  return {
    hex: Array.from(hex).slice(0, 20),
    rgb: Array.from(rgb).slice(0, 10),
    hsl: Array.from(hsl).slice(0, 10),
  };
}

function extractFonts(css) {
  const fonts = new Set();
  const re = /font-family\s*:\s*([^;}"']+)/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    const clean = m[1].trim().replace(/["']/g, '').split(',')[0].trim();
    if (clean && clean.length < 60) fonts.add(clean);
  }
  return Array.from(fonts).slice(0, 8);
}

function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBodyStructure(html) {
  // Extract just <body> content and keep class names + visible text structure
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  body = body
    .replace(/<svg[\s\S]*?<\/svg>/gi, '<svg/>')
    .replace(/<img([^>]*?)>/gi, (_, attrs) => {
      const alt = (attrs.match(/alt=["']([^"']*)["']/i) || [,''])[1];
      const src = (attrs.match(/src=["']([^"']*)["']/i) || [,''])[1];
      return `<img src="${src}" alt="${alt}"/>`;
    });
  return body;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin gate
  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload;
  try { payload = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { url } = payload || {};
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  try {
    // 1. Fetch main HTML
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });
    if (!res.ok) return Response.json({ error: `Failed to fetch: ${res.status} ${res.statusText}` }, { status: 400 });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return Response.json({ error: 'URL does not return HTML' }, { status: 400 });

    const rawHtml = await res.text();
    const finalUrl = res.url || url;

    // 2. Extract metadata
    const title = extractTag(rawHtml, 'title').slice(0, 200);
    const description = extractMeta(rawHtml, 'description') || extractMeta(rawHtml, 'og:description');
    const ogImage = extractMeta(rawHtml, 'og:image');

    // 3. Fetch linked CSS files in parallel (capped)
    const cssUrls = extractLinkedCSS(rawHtml, finalUrl);
    const cssContents = await Promise.all(cssUrls.map(u => fetchText(u, 5000)));
    const externalCss = cssContents.filter(Boolean).join('\n\n').slice(0, 40000);
    const inlineCss = extractInlineStyles(rawHtml).slice(0, 20000);
    const allCss = (inlineCss + '\n' + externalCss).slice(0, 50000);

    // 4. Extract design tokens from CSS
    const colors = extractColors(allCss);
    const fonts = extractFonts(allCss);

    // 5. Real screenshot via thum.io, then upload to base44 storage so it has a proper .png URL
    // thum.io free tier can be slow on first render; allow up to 45s
    let screenshotUrl = null;
    try {
      const thumUrl = `https://image.thum.io/get/width/1280/noanimate/${finalUrl}`;
      const shotRes = await fetch(thumUrl, { signal: AbortSignal.timeout(45000) });
      if (shotRes.ok) {
        const blob = await shotRes.blob();
        if (blob.size > 1000) { // skip tiny error images
          const file = new File([blob], 'screenshot.png', { type: 'image/png' });
          const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          screenshotUrl = uploaded?.file_url || null;
          console.log('screenshot uploaded:', screenshotUrl);
        } else {
          console.log('screenshot too small, skipping');
        }
      } else {
        console.log('screenshot service returned:', shotRes.status);
      }
    } catch (e) {
      console.error('screenshot failed:', e.message);
    }

    // 6. Cleaned structural HTML for the LLM
    const cleanHtml = stripHtml(extractBodyStructure(rawHtml)).slice(0, 18000);

    return Response.json({
      url: finalUrl,
      title,
      description,
      og_image: ogImage,
      html: cleanHtml,
      css_sample: allCss.slice(0, 8000),
      design_tokens: {
        colors,
        fonts,
        stylesheets_found: cssUrls.length,
      },
      screenshot_url: screenshotUrl,
    });

  } catch (err) {
    console.error('uiClonerScrape error:', err);
    return Response.json({ error: err.message || 'Scrape failed' }, { status: 500 });
  }
});