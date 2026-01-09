import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL' } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'ElevenLabs API error: ' + error }, { status: response.status });
    }

    // Get audio data as array buffer
    const audioData = await response.arrayBuffer();

    // Upload to storage
    const audioFile = new File([audioData], 'speech.mp3', { type: 'audio/mpeg' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

    return Response.json({
      audio_url: file_url,
      text: text,
      voice_id: voice_id,
      characters: text.length
    });

  } catch (error) {
    console.error('Generate voice error:', error);
    return Response.json({ 
      error: 'Failed to generate voice',
      details: error.message 
    }, { status: 500 });
  }
});