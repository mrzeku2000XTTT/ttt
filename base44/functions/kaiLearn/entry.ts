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
    const { url, poll } = body;

    if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

    const youtubeId = extractYouTubeId(url);

    if (youtubeId) {
      const entity = base44.asServiceRole.entities.KaiTranscript;
      const existing = await entity.filter({ video_id: youtubeId });
      const record = existing?.[0] || null;

      // STEP 2: Cached and ready — return instantly
      if (record?.status === 'ready') {
        const chunks = record.chunks || chunkText(record.transcript || '');
        return Response.json({
          type: 'youtube', status: 'ready', cached: true,
          videoId: youtubeId, title: record.title,
          wordCount: record.word_count, content: record.transcript, chunks,
          narration: [
            `📚 Already in my brain: "${record.title}"`,
            `📝 ${record.word_count} words · ${chunks.length} knowledge blocks`,
            `✅ Ready. Ask me anything about it.`
          ],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // STEP 7 (poll): Still pending — tell Kai to keep waiting
      if (poll && record?.status === 'pending') {
        return Response.json({
          type: 'youtube', status: 'pending',
          videoId: youtubeId, title: record.title || `YouTube ${youtubeId}`,
          narration: [`⏳ Still fetching transcript... checking again soon.`],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // STEP 3: Not cached — get title via oEmbed, create pending record to trigger automation
      let title = `YouTube ${youtubeId}`;
      try {
        const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
        if (oe.ok) { const d = await oe.json(); title = d.title || title; }
      } catch (_) {}

      // If no existing record at all, create the pending one (triggers entity automation → Kaspa agent)
      if (!record) {
        await entity.create({ video_id: youtubeId, url, title, status: 'pending', language: 'en', is_generated: false });
      }

      // STEP 3 response: tell Kai it's pending, poll in ~15s
      return Response.json({
        type: 'youtube', status: 'pending',
        videoId: youtubeId, title,
        narration: [
          `📺 Found: "${title}"`,
          `⏳ Fetching transcript... I'll check back in ~15 seconds.`
        ],
      }, { headers: { 'Access-Control-Allow-Origin': '*' } });
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