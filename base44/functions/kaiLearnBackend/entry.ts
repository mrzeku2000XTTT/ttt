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
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks.length > 0 ? chunks : [text];
}

async function fetchYouTubeTranscript(videoId) {
  // Fetch the YouTube watch page to get the transcript/captions data
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  const html = await watchRes.text();

  // Extract captions URL from page data
  const captionsMatch = html.match(/"captions":\s*\{.*?"captionTracks":\s*(\[.*?\])/s);
  if (!captionsMatch) return null;

  let captionTracks;
  try {
    captionTracks = JSON.parse(captionsMatch[1].replace(/\\u0026/g, '&').replace(/\\\"/g, '"'));
  } catch {
    return null;
  }

  if (!captionTracks || captionTracks.length === 0) return null;

  // Prefer English, fallback to first available
  const track = captionTracks.find(t => t.languageCode === 'en') ||
                captionTracks.find(t => t.languageCode?.startsWith('en')) ||
                captionTracks[0];

  if (!track?.baseUrl) return null;

  const transcriptRes = await fetch(track.baseUrl);
  const xml = await transcriptRes.text();

  // Parse transcript XML
  const textParts = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [];
  const transcript = textParts
    .map(t => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim())
    .filter(t => t.length > 0)
    .join(' ');

  return transcript.length > 0 ? transcript : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) return Response.json({ error: 'Not a YouTube URL' }, { status: 400 });

    const entity = base44.asServiceRole.entities.KaiTranscript;

    // Check cache first
    const existing = await entity.filter({ video_id: youtubeId });
    const record = existing?.[0] || null;

    if (record?.status === 'ready') {
      const chunks = record.chunks?.length ? record.chunks : chunkText(record.transcript || '');
      return Response.json({
        type: 'youtube', status: 'ready', cached: true,
        videoId: youtubeId, title: record.title,
        wordCount: record.word_count, content: record.transcript, chunks,
        narration: [`📚 Already learned: "${record.title}"`, `✅ Ask me anything about it.`],
      }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Get title via oEmbed
    let title = `YouTube ${youtubeId}`;
    try {
      const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
      if (oe.ok) { const d = await oe.json(); title = d.title || title; }
    } catch (_) {}

    // Fetch transcript directly
    const transcript = await fetchYouTubeTranscript(youtubeId);

    if (!transcript) {
      // Save failed record so we don't keep retrying
      if (record) {
        await entity.update(record.id, { status: 'failed', title });
      } else {
        await entity.create({ video_id: youtubeId, url, title, status: 'failed', language: 'en', is_generated: false });
      }
      return Response.json({
        type: 'youtube', status: 'no_captions',
        videoId: youtubeId, title,
        narration: [`⚠️ No captions available for "${title}".`],
      }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const chunks = chunkText(transcript);
    const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

    // Save to entity
    if (record) {
      await entity.update(record.id, { status: 'ready', title, transcript, word_count: wordCount, chunk_count: chunks.length, chunks });
    } else {
      await entity.create({ video_id: youtubeId, url, title, transcript, word_count: wordCount, chunk_count: chunks.length, chunks, status: 'ready', language: 'en', is_generated: false });
    }

    return Response.json({
      type: 'youtube', status: 'ready', cached: false,
      videoId: youtubeId, title, wordCount, content: transcript, chunks,
      narration: [
        `📺 Learned: "${title}"`,
        `📝 ${wordCount.toLocaleString()} words → ${chunks.length} knowledge blocks`,
        `✅ Ask me anything about it!`
      ],
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    return Response.json({ error: err?.message || 'Internal error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});