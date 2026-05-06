import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || !query.trim()) {
      return Response.json({ error: 'Missing query' }, { status: 400 });
    }

    // Convert query to slug format: spaces → underscores
    const slug = query.trim().replace(/\s+/g, '_');
    const url = `https://grokipedia.com/page/${encodeURIComponent(slug)}`;

    console.log(`[Grokipedia] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return Response.json({ found: false, message: `No Grokipedia article found for "${query}"` });
      }
      // 403 / blocked — let caller fall back to web search
      return Response.json({ found: false, blocked: true, status: response.status, message: `Grokipedia blocked request (${response.status})` });
    }

    const html = await response.text();

    // Extract the main article text from HTML
    // Remove script/style tags first
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '');

    // Extract title
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : query;

    // Get text content from body, clean up
    text = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .trim();

    // Truncate to ~5000 chars for LLM context
    const content = text.substring(0, 5000);

    console.log(`[Grokipedia] Found: "${title}" (${content.length} chars)`);

    return Response.json({
      found: true,
      title,
      url,
      content,
      char_count: content.length
    });
  } catch (error) {
    console.error('[Grokipedia] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});