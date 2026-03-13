import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, duration = 30 } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a professional video script writer. Create an engaging explainer video script based on this prompt: "${prompt}"

The video should be approximately ${duration} seconds long.

Return a JSON object with this EXACT structure:
{
  "script": "full narration script",
  "scenes": [
    {
      "scene_number": 1,
      "description": "visual description for this scene",
      "narration": "what the voiceover says",
      "duration": 5
    }
  ],
  "title": "catchy video title"
}

Make it professional, engaging, and perfect for a landing page explainer video.`,
            response_json_schema: {
                type: "object",
                properties: {
                    script: { type: "string" },
                    scenes: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                scene_number: { type: "number" },
                                description: { type: "string" },
                                narration: { type: "string" },
                                duration: { type: "number" }
                            }
                        }
                    },
                    title: { type: "string" }
                }
            }
        });

        const scriptData = result;

        return Response.json({
            success: true,
            script: scriptData.script,
            scenes: scriptData.scenes,
            title: scriptData.title
        });

    } catch (error) {
        console.error('Script generation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});