import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Stores a per-user API key ENCRYPTED server-side. The plaintext key never
// persists and is never returned to the frontend. We AES-GCM encrypt with a
// server-only secret (env var BUILDER_KEY_SECRET) so even DB reads can't
// recover the raw key without the server secret.

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(secret) {
  const raw = enc.encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encrypt(plaintext, secret) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const buf = new Uint8Array(iv.length + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...buf));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user;
  try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
  if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = Deno.env.get('BUILDER_KEY_SECRET');
  if (!secret) return Response.json({ error: 'Server not configured for key storage' }, { status: 500 });

  let payload;
  try { payload = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { provider, apiKey, baseUrl, label } = payload || {};
  if (!provider || !apiKey) return Response.json({ error: 'Missing provider or apiKey' }, { status: 400 });

  try {
    const encrypted = await encrypt(apiKey, secret);

    // Upsert: replace any existing key for this user+provider
    const existing = await base44.asServiceRole.entities.BuilderApiKey.filter({
      user_email: user.email,
      provider,
    });
    if (existing.length) {
      await base44.asServiceRole.entities.BuilderApiKey.update(existing[0].id, {
        encrypted_key: encrypted,
        base_url: baseUrl || '',
        label: label || '',
        is_active: true,
      });
    } else {
      await base44.entities.BuilderApiKey.create({
        user_email: user.email,
        provider,
        encrypted_key: encrypted,
        base_url: baseUrl || '',
        label: label || '',
        is_active: true,
      });
    }

    return Response.json({ success: true, provider, has_key: true });
  } catch (err) {
    console.error('setBuilderApiKey error:', err);
    return Response.json({ error: err.message || 'Failed to store key' }, { status: 500 });
  }
});