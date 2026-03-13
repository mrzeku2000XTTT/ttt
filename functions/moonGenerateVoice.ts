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

        // Generate voice using Base44's built-in TTS via InvokeLLM with audio output
        // Note: Base44 doesn't have a direct TTS integration yet
        // For now, we'll return a placeholder response
        throw new Error('TTS integration not yet available in Base44. Please use ElevenLabs API or add ELEVENLABS_API_KEY secret.');

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