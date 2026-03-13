import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { script } = await req.json();

        if (!script) {
            return Response.json({ error: 'Script is required' }, { status: 400 });
        }

        // Use ElevenLabs for reliable TTS
        const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
        if (!apiKey) {
            return Response.json({ 
                success: false,
                error: 'ElevenLabs API key not configured' 
            }, { status: 500 });
        }

        const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: script,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!ttsResponse.ok) {
            const error = await ttsResponse.text();
            return Response.json({ 
                success: false,
                error: `ElevenLabs error: ${error}` 
            }, { status: ttsResponse.status });
        }

        const audioData = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(
            new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        return Response.json({
            success: true,
            voice_url: `data:audio/mpeg;base64,${base64Audio}`
        });

    } catch (error) {
        console.error('Voice generation error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});