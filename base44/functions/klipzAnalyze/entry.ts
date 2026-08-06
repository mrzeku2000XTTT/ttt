import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function parseISODuration(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

Deno.serve(async (req) => {
  try {
    const { url } = await req.json();
    const base44 = createClientFromRequest(req);
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

    // FACT-CHECK GATE: we only ever produce clips that are grounded in real,
    // timestamped source material (captions, or chapter timestamps in the
    // description). Without either, we refuse rather than invent moments.
    const hasChapters = /(?:^|\n)\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?/.test(description || '');
    if (!transcript && !hasChapters) {
      return Response.json({
        error: 'No captions or chapter timestamps available for this video — KLIPZ will not guess clip moments. Try a video with subtitles or timestamped chapters.'
      }, { status: 422 });
    }

    const prompt = `You are KLIPZ, an AI that finds the most clippable highlight moments in videos and live streams.

STRICT GROUNDING RULES — DO NOT BREAK:
- Every clip MUST come from the timestamped source material below (transcript second-markers or chapter timestamps in the description).
- For every clip you MUST return "evidence": the exact quoted text from the source at that timestamp. Never paraphrase or invent it.
- The title and reason must describe ONLY what the evidence actually shows. No speculation, no invented events, names, numbers or outcomes.
- If you cannot ground a moment in the source, return fewer clips. Fewer real clips is always correct; a made-up clip is a failure.

VIDEO (YouTube id: ${videoId}):
Title: ${title}
Channel: ${channel}
Is live right now: ${isLive}
${durationKnown ? `Total length available: ${effectiveDuration} seconds` : 'Total length unknown — look up this exact video online to find its length and what happens in it.'}
${description ? `Description (may contain chapters with timestamps):\n${description.slice(0, 3000)}` : ''}
${transcript ? `\nTRANSCRIPT (with second markers):\n${transcript}` : '\nNo transcript — use ONLY the timestamped chapters in the description above as your source.'}

Find up to 6 highlight clips (only as many as the source truly supports). Each clip must be a complete standalone moment, 20-90 seconds long${durationKnown ? `, with start_s and end_s strictly between 0 and ${effectiveDuration}` : ', with start_s and end_s within the video\'s real length'}. Spread them across the video. Give each a punchy short title, a one-line reason it's clippable, and a virality score 1-100.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
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
                score: { type: 'number' },
                evidence: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const clips = (analysis.clips || [])
      // Drop anything ungrounded or outside the real video length
      .filter((c) => c.end_s > c.start_s && (c.evidence || '').trim().length > 10)
      .filter((c) => !durationKnown || (c.start_s >= 0 && c.start_s < effectiveDuration))
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