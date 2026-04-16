import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function chunkText(text, chunkSize = 400) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const c = words.slice(i, i + chunkSize).join(' ');
    if (c.trim()) chunks.push(c);
  }
  return chunks.length > 0 ? chunks : [text];
}

async function scrapeUrl(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim() : url;
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (text.length > 10000) text = text.substring(0, 10000) + '... [truncated]';
  return { title, text, wordCount: text.split(/\s+/).filter(w => w.length > 0).length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { url, poll, force } = body;

    if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

    const youtubeId = extractYouTubeId(url);

    if (youtubeId) {
      const kaspaRes = await fetch('https://kaspa-b3ad561a.base44.app/functions/kaiLearn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, poll: !!poll }),
      });
      const data = await kaspaRes.json();
      return Response.json(data, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Non-YouTube: scrape directly
    const { title, text, wordCount } = await scrapeUrl(url);
    const chunks = chunkText(text);
    return Response.json({
      type: 'web', status: 'ready', url, title, wordCount, content: text, chunks,
      narration: [
        `🌐 Scraped: "${title}"`,
        `📝 ${wordCount} words · ${chunks.length} knowledge blocks`,
        `✅ Ready. Ask me anything about this page.`
      ],
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    return Response.json({ error: err?.message || 'Internal error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});