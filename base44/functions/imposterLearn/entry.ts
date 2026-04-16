import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { url, imposter_id, session_token, poll } = await req.json();

  if (!url || !imposter_id) {
    return Response.json({ error: 'Missing url or imposter_id' }, { status: 400 });
  }

  // POLLING MODE — check if existing record is ready
  if (poll) {
    try {
      const records = await base44.asServiceRole.entities.ImposterTranscript.filter({
        url,
        imposter_id,
        status: 'ready'
      });
      if (records.length > 0) {
        const record = records[0];
        return Response.json({
          success: true,
          source_title: record.source_title,
          transcript: record.transcript,
          chunks: record.chunks,
          word_count: record.word_count,
        });
      }
      // Still processing
      return Response.json({ success: false, status: 'processing' });
    } catch (err) {
      return Response.json({ error: 'Poll failed: ' + err.message }, { status: 500 });
    }
  }

  // NEW REQUEST MODE — create pending record and return immediately
  try {
    const urlObj = new URL(url);
    const isYouTube = /youtube\.com|youtu\.be/.test(urlObj.hostname);
    const sourceType = isYouTube ? 'youtube' : 'article';

    // Extract title from URL
    let sourceTitle = urlObj.hostname;
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || 'unknown';
      sourceTitle = `YouTube: ${videoId}`;
    }

    // Check if already exists
    const existing = await base44.asServiceRole.entities.ImposterTranscript.filter({
      url,
      imposter_id,
    });

    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === 'ready') {
        return Response.json({
          success: true,
          source_title: record.source_title,
          transcript: record.transcript,
          chunks: record.chunks,
          word_count: record.word_count,
        });
      }
      // Already in progress
      return Response.json({ success: false, status: 'processing' });
    }

    // Create new pending record
    const newRecord = await base44.asServiceRole.entities.ImposterTranscript.create({
      url,
      imposter_id,
      source_type: sourceType,
      source_title: sourceTitle,
      status: 'pending',
      requested_at: new Date().toISOString(),
    });

    return Response.json({
      success: false,
      status: 'pending',
      record_id: newRecord.id,
      message: `Fetching ${sourceType}... this may take 10-15 seconds.`,
    });
  } catch (err) {
    console.error('imposterLearn error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});