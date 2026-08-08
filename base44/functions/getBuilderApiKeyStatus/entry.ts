import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns whether the current user has an API key stored for each provider.
// NEVER returns the key itself — only the existence + metadata.
// The actual key is only ever decrypted server-side, inside a backend
// function that makes an outbound API call, and is never sent to the browser.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user;
  try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
  if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const keys = await base44.asServiceRole.entities.BuilderApiKey.filter({
      user_email: user.email,
      is_active: true,
    });
    // Only expose provider + label + base_url — never the encrypted key
    const safe = keys.map(k => ({
      provider: k.provider,
      label: k.label || '',
      base_url: k.base_url || '',
      has_key: true,
    }));
    return Response.json({ keys: safe });
  } catch (err) {
    console.error('getBuilderApiKeyStatus error:', err);
    return Response.json({ error: err.message || 'Failed to fetch key status' }, { status: 500 });
  }
});