import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scenes, brand_colors, brand_logo_url } = await req.json();

        if (!scenes || scenes.length === 0) {
            return Response.json({ error: 'Scenes are required' }, { status: 400 });
        }

        const generatedScenes = [];

        for (const scene of scenes) {
            const colorContext = brand_colors ? `Use brand colors: ${brand_colors.join(', ')}. ` : '';
            const prompt = `${colorContext}Professional explainer video style, clean modern design, flat illustration: ${scene.description}`;

            // Use Base44's built-in GenerateImage integration
            const imageResult = await base44.integrations.Core.GenerateImage({
                prompt: prompt
            });

            generatedScenes.push({
                ...scene,
                image_url: imageResult.url
            });

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return Response.json({
            success: true,
            scenes: generatedScenes
        });

    } catch (error) {
        console.error('Image generation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});