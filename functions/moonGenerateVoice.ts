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

        // Generate voice using Base44's built-in TTS
        const uploadResult = await base44.asServiceRole.integrations.Core.GenerateVoice({
            text: script
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