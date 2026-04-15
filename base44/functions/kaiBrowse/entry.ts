import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BROWSERBASE_API_KEY = Deno.env.get("BROWSERBASE_API_KEY");
const BROWSERBASE_PROJECT_ID = Deno.env.get("BROWSERBASE_PROJECT_ID");

const isXUrl = (url) => /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(url);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return Response.json({ error: 'No URL provided' }, { status: 400 });
    }

    if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
      return Response.json({ error: 'Browserbase not configured' }, { status: 500 });
    }

    // Create a Browserbase session
    const sessionRes = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bb-api-key': BROWSERBASE_API_KEY,
      },
      body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      console.error('Browserbase session error:', err);
      return Response.json({ error: 'Failed to create browser session' }, { status: 500 });
    }

    const session = await sessionRes.json();
    const sessionId = session.id;
    const connectUrl = session.connectUrl || `wss://connect.browserbase.com?apiKey=${BROWSERBASE_API_KEY}&sessionId=${sessionId}`;

    // Use the Browserbase CDP REST API to navigate and extract
    const cdpUrl = `https://api.browserbase.com/v1/sessions/${sessionId}/cdp`;
    const cdpHeaders = {
      'Content-Type': 'application/json',
      'x-bb-api-key': BROWSERBASE_API_KEY,
    };

    // Navigate to the URL
    await fetch(cdpUrl, {
      method: 'POST',
      headers: cdpHeaders,
      body: JSON.stringify({ method: 'Page.navigate', params: { url } }),
    });

    // Wait for page to load
    const waitTime = isXUrl(url) ? 6000 : 4000;
    await new Promise(r => setTimeout(r, waitTime));

    let extractedContent = '';

    if (isXUrl(url)) {
      // X.com / Twitter dedicated extractor
      const extractScript = `
        (() => {
          const result = { tweet: '', author: '', timestamp: '', quoted: '', stats: '', replies: [] };
          
          // Main tweet text
          const tweetEls = document.querySelectorAll('[data-testid="tweetText"]');
          if (tweetEls.length > 0) result.tweet = tweetEls[0].innerText.trim();
          
          // Author
          const authorEl = document.querySelector('[data-testid="User-Name"]');
          if (authorEl) result.author = authorEl.innerText.trim();
          
          // Timestamp
          const timeEl = document.querySelector('time');
          if (timeEl) result.timestamp = timeEl.getAttribute('datetime') || timeEl.innerText;
          
          // Quoted tweet
          const quotedEl = document.querySelector('[data-testid="quotedContent"]');
          if (quotedEl) result.quoted = quotedEl.innerText.trim();
          
          // Engagement stats
          const groupEl = document.querySelector('[role="group"]');
          if (groupEl) result.stats = groupEl.innerText.trim();
          
          // Thread replies (up to 4)
          if (tweetEls.length > 1) {
            for (let i = 1; i < Math.min(tweetEls.length, 5); i++) {
              result.replies.push(tweetEls[i].innerText.trim());
            }
          }
          
          return JSON.stringify(result);
        })()
      `;

      const evalRes = await fetch(cdpUrl, {
        method: 'POST',
        headers: cdpHeaders,
        body: JSON.stringify({
          method: 'Runtime.evaluate',
          params: { expression: extractScript, returnByValue: true },
        }),
      });

      const evalData = await evalRes.json();
      const rawValue = evalData?.result?.result?.value;

      if (rawValue) {
        try {
          const parsed = JSON.parse(rawValue);
          const parts = [];
          if (parsed.author) parts.push(`Author: ${parsed.author}`);
          if (parsed.timestamp) parts.push(`Time: ${parsed.timestamp}`);
          if (parsed.tweet) parts.push(`\nTweet:\n${parsed.tweet}`);
          if (parsed.quoted) parts.push(`\nQuoted Tweet:\n${parsed.quoted}`);
          if (parsed.stats) parts.push(`\nEngagement: ${parsed.stats}`);
          if (parsed.replies.length > 0) {
            parts.push(`\nThread Replies (${parsed.replies.length}):`);
            parsed.replies.forEach((r, i) => parts.push(`  Reply ${i + 1}: ${r}`));
          }
          extractedContent = parts.join('\n');
        } catch {
          extractedContent = rawValue;
        }
      }
    } else {
      // Generic page extraction
      const extractScript = `
        (() => {
          const title = document.title || '';
          const meta = document.querySelector('meta[name="description"]')?.content || '';
          const article = document.querySelector('article')?.innerText || '';
          const main = document.querySelector('main')?.innerText || '';
          const body = document.body?.innerText || '';
          const content = article || main || body;
          return JSON.stringify({ title, meta, content: content.slice(0, 20000) });
        })()
      `;

      const evalRes = await fetch(cdpUrl, {
        method: 'POST',
        headers: cdpHeaders,
        body: JSON.stringify({
          method: 'Runtime.evaluate',
          params: { expression: extractScript, returnByValue: true },
        }),
      });

      const evalData = await evalRes.json();
      const rawValue = evalData?.result?.result?.value;

      if (rawValue) {
        try {
          const parsed = JSON.parse(rawValue);
          extractedContent = `Title: ${parsed.title}\n${parsed.meta ? `Description: ${parsed.meta}\n` : ''}\nContent:\n${parsed.content}`;
        } catch {
          extractedContent = rawValue;
        }
      }
    }

    // Clean up session
    try {
      await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-bb-api-key': BROWSERBASE_API_KEY },
      });
    } catch { /* cleanup best effort */ }

    if (!extractedContent || extractedContent.length < 20) {
      return Response.json({
        success: false,
        error: 'Could not extract content from this page.',
        url,
      });
    }

    return Response.json({
      success: true,
      url,
      is_tweet: isXUrl(url),
      content: extractedContent,
      word_count: extractedContent.split(/\s+/).length,
    });
  } catch (error) {
    console.error('kaiBrowse error:', error.message || error);
    return Response.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
});