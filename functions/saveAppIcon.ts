import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { app_id, app_name, icon_url } = await req.json();

    if (!app_id || !icon_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const existing = await base44.asServiceRole.entities.AppIconCustomization.filter({ 
      app_id 
    });

    let result;
    if (existing.length > 0) {
      result = await base44.asServiceRole.entities.AppIconCustomization.update(existing[0].id, {
        icon_url,
        icon_type: 'uploaded'
      });
    } else {
      result = await base44.asServiceRole.entities.AppIconCustomization.create({
        app_id,
        app_name,
        icon_url,
        icon_type: 'uploaded'
      });
    }

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Save app icon error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});