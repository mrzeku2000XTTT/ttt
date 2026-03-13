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

        // Use Base44's InvokeLLM integration to generate voice
        // The model parameter specifies a voice-capable model
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Read this video script in a clear, professional narrator voice:\n\n${script}`,
            model: 'gpt_5_4', // GPT-4.5-turbo with audio capabilities
            add_context_from_internet: false
        });

        // InvokeLLM should return audio data for voice-capable models
        // If it returns text instead, we'll use ElevenLabs as fallback
        if (typeof response === 'string') {
            // Fallback to ElevenLabs
            const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
            if (!apiKey) {
                return Response.json({ error: 'Voice generation not supported' }, { status: 500 });
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
                throw new Error('Voice generation failed');
            }

            const audioData = await ttsResponse.arrayBuffer();
            const base64Audio = btoa(
                new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            return Response.json({
                voice_url: `data:audio/mpeg;base64,${base64Audio}`
            });
        }

        // If InvokeLLM returns audio, use it directly
        return Response.json({
            voice_url: response.audio_url || response
        });

    } catch (error) {
        console.error('Voice generation error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});