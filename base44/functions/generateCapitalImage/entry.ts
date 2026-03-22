import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { country_name, capital_name } = await req.json();
    
    if (!country_name || !capital_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if image already exists
    const existing = await base44.asServiceRole.entities.CountryCapitalImage.filter({
      country_name: country_name,
      capital_name: capital_name
    });

    if (existing.length > 0) {
      return Response.json({ 
        image_url: existing[0].image_url,
        cached: true 
      });
    }

    // Generate new image with detailed prompt
    const prompt = `A stunning, photorealistic aerial view of ${capital_name}, ${country_name} showcasing iconic landmarks, architecture, and cityscape. Beautiful golden hour lighting, high quality, professional photography, vibrant colors, clear sky.`;
    
    const { url } = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: prompt
    });

    // Save to database
    await base44.asServiceRole.entities.CountryCapitalImage.create({
      country_name: country_name,
      capital_name: capital_name,
      image_url: url,
      generated_at: new Date().toISOString()
    });

    return Response.json({ 
      image_url: url,
      cached: false 
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});