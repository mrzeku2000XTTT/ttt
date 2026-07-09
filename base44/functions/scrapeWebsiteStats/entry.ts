import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    const startTime = Date.now();
    const response = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TTT-StatsBot/1.0)' },
      redirect: 'follow',
    });
    const loadTime = Date.now() - startTime;
    const html = await response.text();

    // Extract stats from HTML
    const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() || '';
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)?.[1] || '';
    const headings = (html.match(/<h[1-6][^>]*>/gi) || []).length;
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const paragraphs = (html.match(/<p[^>]*>/gi) || []).length;
    const links = (html.match(/<a\s[^>]*href=/gi) || []).length;
    const internalLinks = (html.match(/<a\s[^>]*href=["'][#/]/gi) || []).length;
    const externalLinks = links - internalLinks;
    const images = (html.match(/<img\s[^>]*src=/gi) || []).length;
    const imagesWithoutAlt = (html.match(/<img\s+((?!alt=)[^>])*src=/gi) || []).length;
    const scripts = (html.match(/<script/gi) || []).length;
    const stylesheets = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
    const pageSizeKB = Math.round(html.length / 1024);
    const hasSSL = normalizedUrl.startsWith('https://');
    const hasViewport = /name=["']viewport["']/i.test(html);
    const hasOpenGraph = /property=["']og:/i.test(html);
    const hasTwitterCard = /name=["']twitter:card["']/i.test(html);
    const hasStructuredData = /application\/ld\+json/i.test(html);
    const hasCanonical = /rel=["']canonical["']/i.test(html);

    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    // Calculate SEO score (0-100)
    let seoScore = 0;
    if (title) seoScore += 15;
    if (metaDescription) seoScore += 15;
    if (h1Count >= 1) seoScore += 10;
    if (headings >= 3) seoScore += 10;
    if (hasViewport) seoScore += 10;
    if (hasSSL) seoScore += 10;
    if (hasOpenGraph) seoScore += 5;
    if (hasCanonical) seoScore += 5;
    if (hasStructuredData) seoScore += 5;
    if (imagesWithoutAlt === 0 && images > 0) seoScore += 5;
    if (wordCount > 300) seoScore += 10;

    // AI analysis for improvement suggestions
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a web performance and SEO expert. Analyze this website and provide actionable improvement suggestions.\n\nWebsite: ${normalizedUrl}\nTitle: ${title}\nMeta Description: ${metaDescription}\nWord Count: ${wordCount}\nHeadings: ${headings} (H1: ${h1Count}, H2: ${h2Count})\nParagraphs: ${paragraphs}\nLinks: ${links} (Internal: ${internalLinks}, External: ${externalLinks})\nImages: ${images} (Without alt: ${imagesWithoutAlt})\nScripts: ${scripts}\nStylesheets: ${stylesheets}\nPage Size: ${pageSizeKB}KB\nLoad Time: ${loadTime}ms\nHas SSL: ${hasSSL}\nHas Viewport: ${hasViewport}\nHas Open Graph: ${hasOpenGraph}\nHas Structured Data: ${hasStructuredData}\nHas Canonical: ${hasCanonical}\nSEO Score: ${seoScore}/100\nResponse Status: ${response.status}`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          overallScore: { type: "number" },
          performance: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          priorityActions: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      stats: {
        title, metaDescription,
        wordCount, headings, h1Count, h2Count, paragraphs,
        links, internalLinks, externalLinks,
        images, imagesWithoutAlt,
        scripts, stylesheets, pageSizeKB, loadTime,
        hasSSL, hasViewport, hasOpenGraph, hasTwitterCard,
        hasStructuredData, hasCanonical,
        seoScore, responseStatus: response.status
      },
      analysis: llmRes
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});