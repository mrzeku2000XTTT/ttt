import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize base44 client but don't require authentication
    const base44 = createClientFromRequest(req);
    
    const { text, voice_id = '21m00Tcm4TlvDq8ikWAM' } = await req.json();

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
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'ElevenLabs API error: ' + error }, { status: response.status });
    }

    // Get audio data as array buffer
    const audioData = await response.arrayBuffer();
    
    // Convert to base64 for direct playback
    const base64Audio = btoa(
      new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return Response.json({
      audio_url: audioDataUrl,
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