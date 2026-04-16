import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { event, data } = await req.json();

  // Only process pending records
  if (data.status !== 'pending') {
    return Response.json({ ok: true });
  }

  try {
    const recordId = data.id;
    const url = data.url;
    const sourceType = data.source_type;

    // Mark as processing
    await base44.asServiceRole.entities.ImposterTranscript.update(recordId, {
      status: 'processing',
    });

    // Determine processing path based on source type
    if (sourceType === 'youtube') {
      // YouTube — call Kaspa Python skill (async, will update record later)
      // For now, just mark as ready with placeholder
      await base44.asServiceRole.entities.ImposterTranscript.update(recordId, {
        status: 'ready',
        transcript: `YouTube video queued for processing: ${url}`,
        chunks: [{ index: 0, text: `Waiting for transcript from: ${url}`, summary: 'Pending' }],
        word_count: 8,
        completed_at: new Date().toISOString(),
      });
    } else {
      // Regular article — scrape with Deno
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImposterBot/1.0)' },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Strip HTML, extract text
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000);

        const wordCount = text.split(/\s+/).length;

        // Chunk into 400-word blocks
        const words = text.split(/\s+/);
        const chunks = [];
        for (let i = 0; i < words.length; i += 400) {
          const chunk = words.slice(i, i + 400).join(' ');
          chunks.push({
            index: chunks.length,
            text: chunk,
            summary: chunk.slice(0, 100),
          });
        }

        // Update with success
        await base44.asServiceRole.entities.ImposterTranscript.update(recordId, {
          status: 'ready',
          transcript: text,
          chunks,
          word_count: wordCount,
          completed_at: new Date().toISOString(),
        });
      } catch (err) {
        // Update with error
        await base44.asServiceRole.entities.ImposterTranscript.update(recordId, {
          status: 'failed',
          error: err.message,
          completed_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('imposterTranscriptProcessor error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});