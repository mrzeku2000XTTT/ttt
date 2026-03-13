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

        const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: `You are a professional video script writer. Create an engaging explainer video script based on this prompt: "${prompt}"

The video should be approximately ${duration} seconds long.

Return a JSON object with this structure:
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

Make it professional, engaging, and perfect for a landing page explainer video.`
                }]
            })
        });

        const data = await response.json();
        const content = data.content[0].text;
        
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const scriptData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

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