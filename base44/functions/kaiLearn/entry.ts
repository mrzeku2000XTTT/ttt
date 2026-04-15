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

      // Cached and ready
      if (record?.status === 'ready') {
        const chunks = record.chunks || chunkText(record.transcript || '');
        return Response.json({
          type: 'youtube', status: 'ready', cached: true,
          videoId: youtubeId, title: record.title, duration: record.duration,
          wordCount: record.word_count, content: record.transcript, chunks,
          narration: [
            `📚 Already in my brain: "${record.title}"`,
            `📝 ${record.word_count} words · ${chunks.length} knowledge blocks`,
            `✅ Ready. Ask me anything about it.`
          ],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // Still processing
      if (record?.status === 'pending') {
        return Response.json({
          type: 'youtube', status: 'pending',
          videoId: youtubeId, title: record.title || `YouTube ${youtubeId}`,
          narration: [`⏳ Still processing transcript... check back in a moment.`],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // Previously failed — no captions
      if (record?.status === 'failed') {
        return Response.json({
          type: 'youtube', status: 'no_captions',
          videoId: youtubeId, title: record.title || `YouTube ${youtubeId}`,
          narration: [
            `📺 Found: "${record.title}"`,
            `⚠️ No captions available on this video.`,
            `💡 Ask me anything and I'll work with the title and context.`
          ],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // New video — get title via oEmbed
      let title = `YouTube ${youtubeId}`;
      try {
        const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
        if (oe.ok) { const d = await oe.json(); title = d.title || title; }
      } catch (_) {}

      // Route to Kaspa superagent — runs yt-transcript Python skill locally (no IP block)
      const agentRes = await fetch('https://kaspa-b3ad561a.base44.app/functions/ytTranscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: youtubeId }),
      });

      const agentBody = await agentRes.text();
      // Log via error channel so Deno surfaces it
      console.error('[kaiLearn] ytTranscript status:', agentRes.status, 'body:', agentBody.slice(0, 500));

      if (!agentRes.ok) {
        // Treat as no_captions rather than hard crash so Kai gets a usable response
        await entity.create({ video_id: youtubeId, url, title, status: 'failed', language: 'en', is_generated: false });
        return Response.json({
          type: 'youtube', status: 'no_captions', videoId: youtubeId, title,
          narration: [`📺 "${title}"`, `⚠️ Transcript service unavailable (${agentRes.status}).`, `💡 Ask me anything and I'll work with context.`],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      const ytData = JSON.parse(agentBody);

      if (ytData.error || !ytData.transcript) {
        // No captions — save failed record so next call returns fast
        await entity.create({ video_id: youtubeId, url, title, status: 'failed', language: 'en', is_generated: false });
        return Response.json({
          type: 'youtube', status: 'no_captions', videoId: youtubeId, title,
          narration: [`📺 "${title}"`, `⚠️ No captions available.`, `💡 Ask me anything and I'll work with context.`],
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // Save transcript and return ready
      const transcript = ytData.transcript;
      const wordCount = ytData.word_count || transcript.split(/\s+/).filter(w => w.length > 0).length;
      const chunks = chunkText(transcript);

      await entity.create({
        video_id: youtubeId, url, title, transcript, language: ytData.language_code || 'en',
        word_count: wordCount, chunk_count: chunks.length,
        is_generated: ytData.is_generated ?? true, status: 'ready', chunks,
      });

      return Response.json({
        type: 'youtube', status: 'ready', videoId: youtubeId, title,
        wordCount, content: transcript, chunks,
        narration: [`🎬 Learned: "${title}"`, `📝 ${wordCount} words · ${chunks.length} blocks`, `✅ Ask me anything about this video.`],
      }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Non-YouTube: scrape directly
    const { title, text, wordCount } = await scrapeUrl(url);
    const chunks = chunkText(text);
    await base44.asServiceRole.entities.KaiTranscript.create({
      video_id: `web_${Date.now()}`, url, title, transcript: text,
      word_count: wordCount, chunk_count: chunks.length,
      status: 'ready', language: 'en', is_generated: false, chunks,
    });
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