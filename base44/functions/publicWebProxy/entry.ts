// Public web proxy — fetches any public URL server-side, strips frame-busting
// headers/scripts, rewrites links to open in a new tab, and returns the HTML.
// No auth required (guests on the landing page can use it). SSRF-protected.
// Used by the "Search the web" browser to render sites that block iframing
// (Google, X, etc.) directly inside the TTT UI.

export default async function(req) {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const { url, keepScripts } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL required', success: false }, { status: 400 });
    }

    // SSRF protection
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return Response.json({ error: 'Invalid URL', success: false }, { status: 400 });
    }

    // The same checks apply to the initial URL and every redirect destination.
    const validateUrl = (target) => {
      if (target.protocol !== 'http:' && target.protocol !== 'https:') {
        return 'Only http/https URLs are allowed';
      }
      const hostname = target.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.+$/, '');
      const blockedPatterns = [
        /(^|\.)localhost$/i, /^127\./, /^0\./, /^10\./, /^192\.168\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./, /^169\.254\./, /^::1$/,
        /^::$/, /^::ffff:/i, /^f[cd][0-9a-f]{2}:/i, /^fe[89ab][0-9a-f]:/i, /^fd/i,
        /^metadata\.google\.internal$/i,
      ];
      return blockedPatterns.some((re) => re.test(hostname))
        ? 'Access to internal/private addresses is blocked'
        : null;
    };

    console.log('🌐 [publicWebProxy] Fetching:', url);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Referer': 'https://www.google.com/'
    };

    try {
      let response;
      const maxRedirects = 5;
      for (let redirects = 0; ; redirects++) {
        const validationError = validateUrl(parsedUrl);
        if (validationError) {
          return Response.json({ error: validationError, success: false }, { status: 400 });
        }
        response = await fetch(parsedUrl.href, { headers, redirect: 'manual', method: 'GET' });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get('Location');
        await response.body?.cancel();
        if (!location || redirects >= maxRedirects) {
          return Response.json({ error: !location ? 'Redirect missing Location' : 'Too many redirects', success: false }, { status: 400 });
        }
        try {
          parsedUrl = new URL(location, parsedUrl);
        } catch {
          return Response.json({ error: 'Invalid redirect URL', success: false }, { status: 400 });
        }
      }

      let content = await response.text();
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

      // Page metadata + "is this just a JS shell?" detection, so the client can
      // show a real preview for SPAs (kaspa.org, tttz.xyz, …) that render blank.
      const pick = (re) => {
        const m = content.match(re);
        return m ? m[1].trim() : null;
      };
      const meta = {
        title:
          pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
          pick(/<title[^>]*>([^<]+)<\/title>/i),
        description:
          pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
          pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
        image: pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
      };
      if (meta.image && meta.image.startsWith('/')) meta.image = baseUrl + meta.image;

      const visibleText = content
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const isShell = visibleText.length < 250;

      // Add base tag so relative resources load
      if (!content.includes('<base')) {
        content = content.replace(
          /<head([^>]*)>/i,
          `<head$1><base href="${baseUrl}/">`
        );
      }

      // Strip ALL scripts unless keepScripts (JS mode) is requested. Framework
      // bundles (Next.js, Vite, …) can crash or wipe the DOM inside a sandboxed
      // srcDoc iframe — but some sites need JS to render, so the client can opt in.
      if (!keepScripts) {
        content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
        content = content.replace(/<script[^>]*\/>/gi, '');
        content = content.replace(/<noscript[^>]*>|<\/noscript>/gi, '');
      }

      // Remove CSP / X-Frame-Options meta tags
      content = content.replace(/<meta\s+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      content = content.replace(/<meta\s+http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');

      // Rewrite links to open in a new tab
      content = content.replace(/<a\s+/gi, '<a target="_blank" rel="noopener noreferrer" ');

      // Inject a small style so the page fills the iframe nicely
      content = content.replace(
        '</head>',
        '<style>html,body{background:#fff!important;margin:0;padding:8px;}</style></head>'
      );

      return Response.json({
        success: true,
        content,
        meta,
        isShell,
        finalUrl: response.url || url,
        status: response.status
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (fetchError) {
      console.error('❌ [publicWebProxy] fetch error:', fetchError.message);
      return Response.json({
        error: 'Failed to load page',
        suggestion: 'This site may block automated access. Open in a new tab.',
        success: false,
        details: fetchError.message
      }, { status: 200 });
    }
  } catch (error) {
    console.error('❌ [publicWebProxy] error:', error);
    return Response.json({
      error: error.message || 'Failed to fetch page',
      suggestion: 'Try opening in a new tab.',
      success: false
    }, { status: 200 });
  }
}