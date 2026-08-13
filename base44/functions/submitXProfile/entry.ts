// Community listing for X (Twitter) profiles. Handle is required, website optional.
// AI researches the account, then it's indexed under the "X Profiles" category
// so it gets the same per-site AI agent as every other listing.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const X_LOGO = 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png';

function cleanHandle(input: string) {
  let h = (input || '').trim();
  h = h.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '');
  h = h.replace(/[?#].*$/, '').replace(/\/+$/, '').replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(h) ? h : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const handle = cleanHandle(body?.handle || '');
    if (!handle) {
      return Response.json({ success: false, error: 'Enter a valid X handle (e.g. @kaspacurrency)' }, { status: 400, headers: CORS });
    }

    let website = (body?.website || '').trim();
    if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;

    const url = `https://x.com/${handle}`;

    // Already listed?
    const existing = await base44.asServiceRole.entities.KaspaHubApp.filter({ category: 'X Profiles' });
    const dupe = (existing || []).find((a) => {
      try { return new URL(a.url).pathname.replace(/\/+$/, '').toLowerCase() === `/${handle.toLowerCase()}`; }
      catch { return false; }
    });
    if (dupe) {
      return Response.json({ success: true, already_listed: true, app: dupe }, { headers: CORS });
    }

    // AI research on the account
    const meta = await base44.integrations.Core.InvokeLLM({
      prompt: `Research the X (Twitter) account @${handle}${website ? ` and its website ${website}` : ''} for a Kaspa ecosystem directory.

Return the display name of the account, a 1-2 sentence factual description of who they are and what they do in the Kaspa / crypto space, up to 4 short tags, and whether this account genuinely appears connected to the Kaspa community. If you cannot verify the account exists, set exists to false.

The description must be plain text only — never include citation markers, markdown links, brackets or URLs.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          exists: { type: 'boolean' },
          name: { type: 'string' },
          description: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    if (meta?.exists === false) {
      return Response.json({ success: false, error: `Could not verify @${handle} on X.` }, { headers: CORS });
    }

    const app = await base44.asServiceRole.entities.KaspaHubApp.create({
      name: (meta?.name || `@${handle}`).slice(0, 120),
      description: (meta?.description || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s{2,}/g, ' ').trim(),
      url,
      category: 'X Profiles',
      logo: X_LOGO,
      features: ['community-listed', 'x', ...(meta?.features || []).slice(0, 4), ...(website ? [website] : [])],
      indexed_at: new Date().toISOString(),
    });

    return Response.json({ success: true, verified: true, app, website }, { headers: CORS });
  } catch (error) {
    console.error('submitXProfile error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500, headers: CORS });
  }
});