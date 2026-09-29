import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';

/**
 * The words the recogniser actually heard, each with the moment it was said.
 *
 * Spacing and audio-event entries carry no words, so they are dropped — every
 * entry that comes back is something that can go on a caption. Character-level
 * payloads arrive as one entry per word already, so they need no special case.
 */
function readWords(payload: any) {
  const raw = Array.isArray(payload?.words)
    ? payload.words
    : Array.isArray(payload?.transcription?.words)
      ? payload.transcription.words
      : [];

  return raw
    .filter((word: any) => word && String(word.text || '').trim())
    .filter((word: any) => word.type !== 'spacing' && word.type !== 'audio_event')
    .map((word: any) => ({
      text: String(word.text).trim(),
      start: Number(word.start) || 0,
      end: Number(word.end) || Number(word.start) || 0,
    }))
    .filter((word: any) => word.end > word.start);
}

/**
 * Transcribes a voice track and returns word-level timings, so a caption can be
 * cut frame-accurately against the voice instead of estimated from the words.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { audio_url } = await req.json();
    if (!audio_url || typeof audio_url !== 'string') {
      return Response.json({ error: 'audio_url is required' }, { status: 400 });
    }

    const apiKey = secrets.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Speech recognition is not configured' }, { status: 500 });
    }

    const form = new FormData();
    form.set('model_id', 'scribe_v1');
    form.set('timestamps_granularity', 'word');
    // Audio events like (laughter) are not words, so they never reach a caption.
    form.set('tag_audio_events', 'false');
    form.set('source_url', audio_url);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form,
    });

    if (!response.ok) {
      const detail = await response.text();
      return Response.json(
        { error: `Speech recognition failed: ${detail.slice(0, 300)}` },
        { status: response.status },
      );
    }

    const payload = await response.json();
    const words = readWords(payload);
    if (!words.length) {
      return Response.json({ error: 'No speech was found in that audio' }, { status: 422 });
    }

    return Response.json({
      text: words.map((word: any) => word.text).join(' '),
      words,
      duration: Number(payload?.audio_duration_secs) || words[words.length - 1].end,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}