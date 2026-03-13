import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { storyboard } = await req.json();

        if (!storyboard || !Array.isArray(storyboard)) {
            return Response.json({ success: false, error: 'Storyboard array is required' }, { status: 400 });
        }

        console.log('Generating voice for', storyboard.length, 'scenes');

        const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
        if (!apiKey) {
            return Response.json({ 
                success: false,
                error: 'ElevenLabs API key not configured' 
            }, { status: 500 });
        }

        // Generate voice for each scene
        const scenesWithVoice = [];
        
        for (const scene of storyboard) {
            console.log(`Processing scene ${scene.scene_number}: ${scene.narration}`);
            
            const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: scene.narration,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!ttsResponse.ok) {
                const error = await ttsResponse.text();
                console.error(`Scene ${scene.scene_number} TTS failed:`, error);
                throw new Error(`ElevenLabs error: ${error}`);
            }

            const audioData = await ttsResponse.arrayBuffer();
            const base64Audio = btoa(
                new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            scenesWithVoice.push({
                ...scene,
                voice_url: `data:audio/mpeg;base64,${base64Audio}`
            });

            console.log(`Scene ${scene.scene_number} voice generated successfully`);
        }

        return Response.json({
            success: true,
            scenes: scenesWithVoice
        });

    } catch (error) {
        console.error('Voice generation error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});