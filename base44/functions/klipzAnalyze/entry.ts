import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function parseISODuration(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    const idMatch = (url || '').match(/(?:v=|youtu\.be\/|\/live\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
    if (!idMatch) return Response.json({ error: 'Paste a valid YouTube video or live stream link' }, { status: 400 });
    const videoId = idMatch[1];

    // Try YouTube Data API first, fall back to keyless oEmbed
    let title = '', channel = '', thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    let description = '', isLive = false, effectiveDuration = 0, views = null;

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    try {
      const metaRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${videoId}&key=${apiKey}`);
      const meta = await metaRes.json();
      const item = meta.items?.[0];
      if (item) {
        title = item.snippet.title;
        channel = item.snippet.channelTitle;
        description = item.snippet.description || '';
        thumbnail = item.snippet.thumbnails?.medium?.url || thumbnail;
        views = item.statistics?.viewCount;
        isLive = item.snippet.liveBroadcastContent === 'live';
        effectiveDuration = parseISODuration(item.contentDetails?.duration);
        if (isLive && item.liveStreamingDetails?.actualStartTime) {
          effectiveDuration = Math.floor((Date.now() - new Date(item.liveStreamingDetails.actualStartTime).getTime()) / 1000);
        }
      }
    } catch (_e) { /* fall through to oEmbed */ }

    if (!title) {
      const oRes = await fetch(`https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${videoId}&format=json`);
      if (!oRes.ok) return Response.json({ error: 'Video not found' }, { status: 404 });
      const o = await oRes.json();
      title = o.title;
      channel = o.author_name;
      thumbnail = o.thumbnail_url || thumbnail;
    }

    // Try to grab an English transcript (best effort)
    let transcript = '';
    try {
      const tRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`);
      if (tRes.ok) {
        const t = await tRes.json();
        transcript = (t.events || [])
          .filter((e) => e.segs)
          .map((e) => `[${Math.floor((e.tStartMs || 0) / 1000)}s] ${e.segs.map((s) => s.utf8).join('')}`)
          .join(' ')
          .slice(0, 12000);
      }
    } catch (_e) { /* transcript unavailable */ }

    const durationKnown = effectiveDuration > 0;
    const prompt = `You are KLIPZ, an AI that finds the most clippable highlight moments in videos and live streams.

VIDEO (YouTube id: ${videoId}):
Title: ${title}
Channel: ${channel}
Is live right now: ${isLive}
${durationKnown ? `Total length available: ${effectiveDuration} seconds` : 'Total length unknown — look up this exact video online to find its length and what happens in it.'}
${description ? `Description (may contain chapters with timestamps):\n${description.slice(0, 3000)}` : ''}
${transcript ? `\nTRANSCRIPT (with second markers):\n${transcript}` : '\nNo transcript available — infer likely highlight moments from the title, description chapters, web knowledge of this video, and typical pacing of this kind of content.'}

Find 4 to 6 highlight clips. Each clip must be a complete standalone moment, 20-90 seconds long${durationKnown ? `, with start_s and end_s strictly between 0 and ${effectiveDuration}` : ', with start_s and end_s within the video\'s real length'}. Spread them across the video. Give each a punchy short title, a one-line reason it's clippable, and a virality score 1-100.`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: !durationKnown && !transcript,
      response_json_schema: {
        type: 'object',
        properties: {
          clips: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                reason: { type: 'string' },
                start_s: { type: 'number' },
                end_s: { type: 'number' },
                score: { type: 'number' }
              }
            }
          }
        }
      }
    });

    const clips = (analysis.clips || [])
      .filter((c) => c.end_s > c.start_s)
      .map((c) => ({
        ...c,
        start_s: Math.max(0, Math.floor(c.start_s)),
        end_s: effectiveDuration > 0 ? Math.min(effectiveDuration, Math.floor(c.end_s)) : Math.floor(c.end_s)
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    return Response.json({
      video: {
        id: videoId,
        title,
        channel,
        thumbnail,
        is_live: isLive,
        duration_s: effectiveDuration,
        views,
        had_transcript: !!transcript
      },
      clips
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});