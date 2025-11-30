import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { app_id, app_name, icon_url } = body;

    if (!app_id || !icon_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Save app icon error:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});