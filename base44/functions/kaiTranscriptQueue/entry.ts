import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called by the "Process YouTube Transcript" entity automation when a KaiTranscript
// record is created with status=pending. This function's job is simply to confirm
// the record exists and is queued — the actual transcript fetch is done by the
// external Kaspa agent (Python skill) which polls for pending records and updates them.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Automation payload: { event: { type, entity_name, entity_id }, data: { ...KaiTranscript fields } }
    const entityId = body?.event?.entity_id;
    const videoId = body?.data?.video_id;
    const title = body?.data?.title || 'Unknown';
    const status = body?.data?.status;

    if (status !== 'pending') {
      return Response.json({ ok: true, skipped: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Log that the record is queued — the Kaspa agent will pick this up
    // and update KaiTranscript with status=ready + full transcript
    console.log(`[kaiTranscriptQueue] Queued: video_id=${videoId}, title="${title}", entity_id=${entityId}`);

    return Response.json({
      ok: true,
      queued: true,
      video_id: videoId,
      title,
      message: 'Transcript job queued. Kaspa agent will process and update the record.',
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    return Response.json({ error: err?.message || 'Internal error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});