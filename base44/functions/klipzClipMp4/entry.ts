import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { videoId } = body;

    const base44 = createClientFromRequest(req);
    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      return Response.json({ error: 'MP4 engine not configured yet — RAPIDAPI_KEY missing. The clip is still playable and shareable from your library.' }, { status: 503 });
    }

    const response = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${videoId}&geo=US`, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
      },
      signal: AbortSignal.timeout(45000)
    });
    if (!response.ok) return Response.json({ error: 'MP4 source unavailable for this video' }, { status: 503 });

    const data = await response.json();
    const mp4Formats = (data.formats || []).filter((f) => f.mimeType?.includes('video/mp4') && f.url);
    if (mp4Formats.length === 0) {
      return Response.json({ error: 'No MP4 format available for this video' }, { status: 404 });
    }
    const best = mp4Formats.reduce((a, b) => ((b.height || 0) > (a.height || 0) ? b : a));

    return Response.json({ url: best.url, quality: best.qualityLabel || `${best.height}p`, title: data.title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});