import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(normalizedUrl);
    const origin = parsed.origin;
    const host = parsed.hostname;

    const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; SlobzRadar/2.0; SiteAnalyzer)' };

    const analyzeHtml = (html) => {
      const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim().slice(0, 200) || '';
      const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)?.[1]?.slice(0, 300) || '';
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
      const headings = (html.match(/<h[1-6][^>]*>/gi) || []).length;
      const paragraphs = (html.match(/<p[^>]*>/gi) || []).length;
      const links = (html.match(/<a\s[^>]*href=/gi) || []).length;
      const internalLinks = (html.match(/<a\s[^>]*href=["'][#/]/gi) || []).length;
      const images = (html.match(/<img\s[^>]*src=/gi) || []).length;
      const imagesWithoutAlt = (html.match(/<img\s+((?!alt=)[^>])*src=/gi) || []).length;
      const scripts = (html.match(/<script/gi) || []).length;
      const stylesheets = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
      const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ');
      const wordCount = textContent.split(/\s+/).filter(Boolean).length;
      return {
        title, metaDescription, h1Count, h2Count, headings, paragraphs,
        links, internalLinks, externalLinks: links - internalLinks,
        images, imagesWithoutAlt, scripts, stylesheets, wordCount,
        pageSizeKB: Math.round(html.length / 1024),
        hasViewport: /name=["']viewport["']/i.test(html),
        hasOpenGraph: /property=["']og:/i.test(html),
        hasTwitterCard: /name=["']twitter:card["']/i.test(html),
        hasStructuredData: /application\/ld\+json/i.test(html),
        hasCanonical: /rel=["']canonical["']/i.test(html),
      };
    };

    const fetchPage = async (pageUrl, timeout = 12000) => {
      const start = Date.now();
      try {
        const res = await fetch(pageUrl, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
        const loadTime = Date.now() - start;
        const html = await res.text();
        return { url: pageUrl, status: res.status, loadTime, html, headers: res.headers };
      } catch (e) {
        return { url: pageUrl, status: 0, loadTime: Date.now() - start, html: '', error: e.message };
      }
    };

    const safeText = async (u, timeout = 8000) => {
      try {
        const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(timeout) });
        return r.ok ? await r.text() : null;
      } catch { return null; }
    };
    const safeJson = async (u, headers = {}, timeout = 10000) => {
      try {
        const r = await fetch(u, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(timeout) });
        return r.ok ? await r.json() : null;
      } catch { return null; }
    };

    // ---- Source 1: homepage (real fetch) ----
    const home = await fetchPage(normalizedUrl);
    if (!home.html && home.status === 0) {
      return Response.json({ error: `Could not reach ${host}: ${home.error || 'no response'}` }, { status: 400 });
    }

    // ---- Sources 2-8 (in parallel): robots.txt, sitemap.xml, Google PageSpeed (Lighthouse),
    // Wayback Machine (domain age), Cloudflare DNS A + MX, and the internal page crawl ----
    const externalsPromise = Promise.all([
      safeText(`${origin}/robots.txt`),
      safeText(`${origin}/sitemap.xml`),
      safeJson(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices`, {}, 30000),
      safeText(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host)}&limit=1&fl=timestamp`, 10000),
      safeJson(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, { Accept: 'application/dns-json' }),
      safeJson(`https://cloudflare-dns.com/dns-query?name=${host}&type=MX`, { Accept: 'application/dns-json' }),
    ]);

    // Build crawl targets from sitemap + homepage links
    const crawlPromise = (async () => {
      const sitemapXml = await safeText(`${origin}/sitemap.xml`);
      const targets = new Set();
      if (sitemapXml) {
        for (const m of sitemapXml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)) {
          try { const u = new URL(m[1]); if (u.hostname === host && !/\.(xml|jpg|jpeg|png|gif|webp|pdf|zip)$/i.test(u.pathname)) targets.add(u.origin + u.pathname); } catch { /* skip */ }
        }
      }
      for (const m of home.html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
        try {
          const u = new URL(m[1], origin);
          if (u.hostname === host && !/\.(jpg|jpeg|png|gif|webp|pdf|zip|mp4|css|js)$/i.test(u.pathname) && !u.pathname.startsWith('/cdn-') && !m[1].startsWith('mailto:') && !m[1].startsWith('tel:')) {
            targets.add(u.origin + u.pathname);
          }
        } catch { /* skip */ }
      }
      targets.delete(normalizedUrl);
      targets.delete(origin + '/');
      const list = [...targets].slice(0, 11);
      const results = await Promise.all(list.map((u) => fetchPage(u, 10000)));
      return { sitemapUrlCount: sitemapXml ? (sitemapXml.match(/<loc>/gi) || []).length : 0, results };
    })();

    const [[robotsTxt, sitemapXml, pagespeed, waybackTs, dnsA, dnsMX], crawlData] = await Promise.all([externalsPromise, crawlPromise]);

    // Per-page stats from the real crawl
    const pageReport = (p) => {
      const st = p.html ? analyzeHtml(p.html) : {};
      const issues = [];
      if (p.status === 0) issues.push('Unreachable');
      else if (p.status >= 400) issues.push(`Broken (HTTP ${p.status})`);
      if (p.html) {
        if (!st.title) issues.push('Missing title');
        if (!st.metaDescription) issues.push('Missing meta description');
        if (st.h1Count === 0) issues.push('No H1');
        if (st.h1Count > 1) issues.push('Multiple H1s');
        if (st.imagesWithoutAlt > 0) issues.push(`${st.imagesWithoutAlt} images without alt`);
        if (st.wordCount < 150) issues.push('Thin content');
        if (p.loadTime > 3000) issues.push('Slow load');
      }
      return {
        url: p.url, path: new URL(p.url).pathname, status: p.status, loadTime: p.loadTime,
        title: st.title || '', h1Count: st.h1Count ?? 0, wordCount: st.wordCount ?? 0, issues,
      };
    };

    const homeStats = analyzeHtml(home.html);
    const crawledPages = [pageReport(home), ...crawlData.results.map(pageReport)];
    const brokenPages = crawledPages.filter((p) => p.status === 0 || p.status >= 400).length;
    const totalWords = crawledPages.reduce((s, p) => s + p.wordCount, 0);
    const avgLoadTime = Math.round(crawledPages.reduce((s, p) => s + p.loadTime, 0) / crawledPages.length);
    const totalIssues = crawledPages.reduce((s, p) => s + p.issues.length, 0);

    // Security headers (real response headers)
    const hdr = (n) => home.headers?.get(n) || null;
    const securityHeaders = {
      'strict-transport-security': !!hdr('strict-transport-security'),
      'content-security-policy': !!hdr('content-security-policy'),
      'x-frame-options': !!hdr('x-frame-options'),
      'x-content-type-options': !!hdr('x-content-type-options'),
      'referrer-policy': !!hdr('referrer-policy'),
    };
    const securityScore = Object.values(securityHeaders).filter(Boolean).length;
    const server = hdr('server');

    // PageSpeed / Lighthouse (Google's real measurement)
    let lighthouse = null;
    if (pagespeed?.lighthouseResult) {
      const cats = pagespeed.lighthouseResult.categories || {};
      const audits = pagespeed.lighthouseResult.audits || {};
      lighthouse = {
        performance: cats.performance ? Math.round(cats.performance.score * 100) : null,
        seo: cats.seo ? Math.round(cats.seo.score * 100) : null,
        accessibility: cats.accessibility ? Math.round(cats.accessibility.score * 100) : null,
        bestPractices: cats['best-practices'] ? Math.round(cats['best-practices'].score * 100) : null,
        fcp: audits['first-contentful-paint']?.displayValue || null,
        lcp: audits['largest-contentful-paint']?.displayValue || null,
        cls: audits['cumulative-layout-shift']?.displayValue || null,
      };
    }

    // Domain age from Wayback Machine
    let firstSeen = null;
    const ts = waybackTs?.trim().split('\n')[0]?.trim();
    if (ts && /^\d{8,}/.test(ts)) firstSeen = `${ts.slice(0, 4)}-${ts.slice(4, 6)}`;

    const dns = {
      aRecords: (dnsA?.Answer || []).filter((a) => a.type === 1).map((a) => a.data).slice(0, 4),
      hasMx: (dnsMX?.Answer || []).some((a) => a.type === 15),
    };

    // On-page SEO score
    const hasSSL = normalizedUrl.startsWith('https://');
    let onPage = 0;
    if (homeStats.title) onPage += 12;
    if (homeStats.metaDescription) onPage += 12;
    if (homeStats.h1Count >= 1) onPage += 8;
    if (homeStats.headings >= 3) onPage += 8;
    if (homeStats.hasViewport) onPage += 8;
    if (hasSSL) onPage += 8;
    if (homeStats.hasOpenGraph) onPage += 5;
    if (homeStats.hasCanonical) onPage += 5;
    if (homeStats.hasStructuredData) onPage += 5;
    if (homeStats.imagesWithoutAlt === 0 && homeStats.images > 0) onPage += 5;
    if (homeStats.wordCount > 300) onPage += 8;
    if (robotsTxt) onPage += 3;
    if (crawlData.sitemapUrlCount > 0) onPage += 3;
    onPage = Math.min(100, onPage - Math.min(20, brokenPages * 5));
    const seoScore = lighthouse?.seo != null ? Math.round(onPage * 0.5 + lighthouse.seo * 0.5) : onPage;

    // Sources checked (every real fetch made)
    const sourcesList = [
      ...crawledPages.map((p) => ({ name: `Crawled ${p.path}`, ok: p.status > 0 && p.status < 400 })),
      { name: 'robots.txt', ok: !!robotsTxt },
      { name: `sitemap.xml (${crawlData.sitemapUrlCount} URLs)`, ok: crawlData.sitemapUrlCount > 0 },
      { name: 'Google PageSpeed / Lighthouse', ok: !!lighthouse },
      { name: 'Wayback Machine (archive.org)', ok: !!firstSeen },
      { name: 'Cloudflare DNS (A records)', ok: dns.aRecords.length > 0 },
      { name: 'Cloudflare DNS (MX / email)', ok: dnsMX !== null },
      { name: 'HTTP security headers', ok: true },
      { name: 'SSL certificate', ok: hasSSL },
    ];
    const checksRun = crawledPages.length * 12 + sourcesList.length + Object.keys(securityHeaders).length;

    // AI analysis of the REAL crawl data
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a web performance and SEO expert. Analyze this REAL crawl of ${host}.\n\nHomepage: title "${homeStats.title}", meta desc "${homeStats.metaDescription}", ${homeStats.wordCount} words, ${homeStats.h1Count} H1s, ${homeStats.images} images (${homeStats.imagesWithoutAlt} without alt), load ${home.loadTime}ms, status ${home.status}.\nCrawl: ${crawledPages.length} pages crawled, ${brokenPages} broken, avg load ${avgLoadTime}ms, ${totalWords} total words, ${totalIssues} issues found.\nPer-page issues: ${crawledPages.filter((p) => p.issues.length).map((p) => `${p.path}: ${p.issues.join(', ')}`).join(' | ') || 'none'}.\nSitemap: ${crawlData.sitemapUrlCount} URLs. Robots.txt: ${robotsTxt ? 'yes' : 'MISSING'}.\nLighthouse (Google PageSpeed, real): ${lighthouse ? `perf ${lighthouse.performance}, SEO ${lighthouse.seo}, a11y ${lighthouse.accessibility}, best-practices ${lighthouse.bestPractices}, LCP ${lighthouse.lcp}` : 'unavailable'}.\nSecurity headers present: ${securityScore}/5. Site first archived: ${firstSeen || 'unknown'}. Server: ${server || 'unknown'}.\nSEO Score: ${seoScore}/100.\n\nGive specific, actionable advice referencing the actual pages and numbers above.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          performance: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } },
          priorityActions: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    return Response.json({
      stats: {
        ...homeStats,
        loadTime: home.loadTime,
        hasSSL,
        seoScore,
        responseStatus: home.status,
      },
      crawl: {
        pagesCrawled: crawledPages.length,
        brokenPages,
        totalIssues,
        avgLoadTime,
        totalWords,
        sitemapUrlCount: crawlData.sitemapUrlCount,
        hasRobotsTxt: !!robotsTxt,
        pages: crawledPages,
      },
      external: { lighthouse, firstSeen, dns, securityHeaders, securityScore, server },
      sources: { count: sourcesList.length, checksRun, list: sourcesList },
      analysis: llmRes,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});