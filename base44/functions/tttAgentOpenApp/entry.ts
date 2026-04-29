import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * tttAgentOpenApp — TTT 3.0 Agent App Connector
 *
 * Allows TTT 3.0 agents to programmatically discover, open, and invoke
 * capabilities across the entire TTT app ecosystem (App Store V2).
 *
 * Actions:
 *  - "list"          → returns all registered apps (optionally filtered by category)
 *  - "search"        → search apps by name/description/category
 *  - "get"           → get a single app by name or path
 *  - "open"          → returns deep-link URL the frontend should navigate to
 *  - "invoke"        → records an agent's intent to invoke a capability inside an app
 *  - "capabilities"  → lists all unique capabilities across the registry
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // Pull the full registry once
    const allApps = await base44.asServiceRole.entities.TTTAppRegistry.filter({ is_active: true }, '-created_date', 500);

    // Filter out admin-only apps for non-admin users
    const visibleApps = allApps.filter(app => !app.is_admin_only || user.role === 'admin');

    if (action === 'list') {
      const filtered = body.category && body.category !== 'All'
        ? visibleApps.filter(a => a.category === body.category)
        : visibleApps;
      return Response.json({
        count: filtered.length,
        total_in_ecosystem: allApps.length,
        apps: filtered.map(a => ({
          name: a.app_name,
          path: a.path,
          category: a.category,
          description: a.description,
          capabilities: a.agent_capabilities || [],
          is_premium: a.is_premium || false,
        })),
      });
    }

    if (action === 'search') {
      const q = (body.query || '').toLowerCase().trim();
      if (!q) return Response.json({ error: 'query required' }, { status: 400 });
      const matches = visibleApps.filter(a =>
        a.app_name.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q)
      );
      return Response.json({
        count: matches.length,
        apps: matches.map(a => ({ name: a.app_name, path: a.path, category: a.category, description: a.description, capabilities: a.agent_capabilities || [] })),
      });
    }

    if (action === 'get') {
      const key = (body.name || body.path || '').toLowerCase();
      if (!key) return Response.json({ error: 'name or path required' }, { status: 400 });
      const app = visibleApps.find(a =>
        a.app_name.toLowerCase() === key || (a.path || '').toLowerCase() === key
      );
      if (!app) return Response.json({ error: 'App not found' }, { status: 404 });
      return Response.json({ app: { name: app.app_name, path: app.path, category: app.category, description: app.description, capabilities: app.agent_capabilities || [], is_premium: app.is_premium || false } });
    }

    if (action === 'open') {
      const key = (body.name || body.path || '').toLowerCase();
      if (!key) return Response.json({ error: 'name or path required' }, { status: 400 });
      const app = visibleApps.find(a =>
        a.app_name.toLowerCase() === key || (a.path || '').toLowerCase() === key
      );
      if (!app) return Response.json({ error: 'App not found' }, { status: 404 });
      const deepLink = app.external_url || `/${app.path}`;
      return Response.json({
        success: true,
        app_name: app.app_name,
        deep_link: deepLink,
        message: `Open ${app.app_name} at ${deepLink}`,
      });
    }

    if (action === 'invoke') {
      const key = (body.name || body.path || '').toLowerCase();
      const capability = body.capability;
      const params = body.params || {};
      if (!key || !capability) return Response.json({ error: 'name/path and capability required' }, { status: 400 });
      const app = visibleApps.find(a =>
        a.app_name.toLowerCase() === key || (a.path || '').toLowerCase() === key
      );
      if (!app) return Response.json({ error: 'App not found' }, { status: 404 });
      const caps = app.agent_capabilities || [];
      if (!caps.includes(capability)) {
        return Response.json({ error: `App "${app.app_name}" does not support capability "${capability}"`, available: caps }, { status: 400 });
      }
      // Return a structured intent the frontend agent runtime can act on
      return Response.json({
        success: true,
        intent: {
          app: app.app_name,
          path: app.path,
          deep_link: `/${app.path}`,
          capability,
          params,
          invoked_by: user.email,
          timestamp: new Date().toISOString(),
        },
        message: `Invoking ${capability} on ${app.app_name}`,
      });
    }

    if (action === 'capabilities') {
      const allCaps = new Set();
      visibleApps.forEach(a => (a.agent_capabilities || []).forEach(c => allCaps.add(c)));
      return Response.json({
        count: allCaps.size,
        capabilities: Array.from(allCaps).sort(),
      });
    }

    return Response.json({
      error: 'Unknown action',
      valid_actions: ['list', 'search', 'get', 'open', 'invoke', 'capabilities'],
    }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});