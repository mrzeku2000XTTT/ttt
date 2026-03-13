import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { script, voice_id = 'EXAVITQu4vr4xnSDxMaL' } = await req.json(); // Default: Bella voice

        if (!script) {
            return Response.json({ error: 'Script is required' }, { status: 400 });
        }

        const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsApiKey
            },
            body: JSON.stringify({
                text: script,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        
        // Convert blob to file for upload
        const audioFile = new File([audioBlob], 'voiceover.mp3', { type: 'audio/mpeg' });
        
        // Upload to Base44 storage
        const uploadResult = await base44.integrations.Core.UploadFile({
            file: audioFile
        });

        return Response.json({
            success: true,
            voice_url: uploadResult.file_url
        });

    } catch (error) {
        console.error('Voice generation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});