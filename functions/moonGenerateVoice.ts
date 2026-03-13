import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { script, voice_style = 'professional' } = await req.json();

        if (!script) {
            return Response.json({ error: 'Script is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('X_API_KEY');
        if (!apiKey) {
            return Response.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
        }

        // Use OpenAI's GPT-4o-audio or similar voice model via OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ttt.base44.app',
                'X-Title': 'TTT Moon Studio'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-audio-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are a ${voice_style} video narrator. Speak the following script with appropriate pacing, emotion, and clarity for a video voiceover.`
                    },
                    {
                        role: 'user',
                        content: script
                    }
                ],
                modalities: ['text', 'audio'],
                audio: { voice: 'alloy', format: 'mp3' }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return Response.json({ 
                error: data.error?.message || 'OpenRouter API error' 
            }, { status: response.status });
        }

        // Extract audio data from response
        const audioData = data.choices?.[0]?.message?.audio;
        if (!audioData?.data) {
            return Response.json({ 
                error: 'No audio generated' 
            }, { status: 500 });
        }

        // Return base64 audio data
        return Response.json({
            voice_url: `data:audio/mp3;base64,${audioData.data}`,
            transcript: audioData.transcript || script
        });

    } catch (error) {
        console.error('Voice generation error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});