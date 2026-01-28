import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { app_id, icon_url, icon_type, generation_prompt } = body;

    if (!app_id || !icon_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Use service role to bypass RLS when saving
    const existing = await base44.asServiceRole.entities.AppIconCustomization.filter({ app_id });

    if (existing && existing.length > 0) {
      // Update existing
      await base44.asServiceRole.entities.AppIconCustomization.update(existing[0].id, {
        icon_url,
        icon_type,
        generation_prompt
      });
    } else {
      // Create new
      await base44.asServiceRole.entities.AppIconCustomization.create({
        app_id,
        icon_url,
        icon_type,
        generation_prompt
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Icon saved successfully' }), { status: 200 });
  } catch (error) {
    console.error('Save app icon error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to save icon' }), { status: 500 });
  }
});