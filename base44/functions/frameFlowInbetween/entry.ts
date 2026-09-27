import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import OpenAI from 'npm:openai@6.45.0';

/**
 * Draws ONE in-between frame by editing an actual image rather than generating a
 * new one.
 *
 * The frame being advanced is sent as the image bytes, so the model works from
 * the real drawing and keeps its character, linework and paper. Plain image
 * generation only treats attached images as loose inspiration, which is why
 * in-betweens used to come back as unrelated drawings.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prompt = String(body.prompt || '').trim();
    const baseUrl = String(body.base_url || '').trim();
    const references = Array.isArray(body.reference_urls)
      ? body.reference_urls.filter(Boolean).map(String)
      : [];

    if (!prompt || !baseUrl) {
      return Response.json({ error: 'A prompt and the frame to edit are required.' }, { status: 400 });
    }

    const baseResponse = await fetch(baseUrl);
    if (!baseResponse.ok) {
      return Response.json({ error: `The frame to edit could not be read (${baseResponse.status}).` }, { status: 400 });
    }
    const bytes = await baseResponse.arrayBuffer();
    const image = new File([bytes], 'frame.png', {
      type: baseResponse.headers.get('content-type') || 'image/png',
    });

    const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
    const client = new OpenAI({ baseURL, apiKey: token, maxRetries: 0 });

    const result = await client.images.edit({
      model: 'automatic',
      image,
      prompt,
      n: 1,
      response_format: 'url',
      reference_image_urls: references,
    });

    const url = result?.data?.[0]?.url;
    if (!url) return Response.json({ error: 'The frame came back empty.' }, { status: 502 });

    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}