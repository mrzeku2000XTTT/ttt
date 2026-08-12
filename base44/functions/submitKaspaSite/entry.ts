import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CATEGORIES = ["Ecosystem", "Resources", "Exchanges", "Wallets", "Merchant Solutions", "Developer Tools", "Community Chats", "News Sources"];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    let raw = (body?.url || '').trim();
    if (!raw) return Response.json({ success: false, error: 'URL is required' }, { status: 400 });
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      return Response.json({ success: false, error: 'That does not look like a valid URL' }, { status: 400 });
    }
    const url = parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname);
    const domain = parsed.hostname.replace(/^www\./, '');

    // Already listed?
    const existing = await base44.asServiceRole.entities.KaspaHubApp.filter({});
    const dupe = (existing || []).find((a) => {
      try { return new URL(a.url).hostname.replace(/^www\./, '') === domain; } catch { return false; }
    });
    if (dupe) {
      return Response.json({
        success: true,
        already_listed: true,
        app: dupe,
        security: { risk_level: 'Low', is_safe: true, explanation: 'This site is already in the Kaspa index.' },
      });
    }

    // 1) Security scan — phishing / malware / scam analysis
    const security = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a security scanner. Analyze this website for phishing, malware, crypto scams, wallet drainers and fake token sites: ${url}

Domain: ${domain}
Protocol: ${parsed.protocol}

Research the domain's real reputation online. Do NOT flag a site just because of its TLD. Only mark unsafe with specific evidence (known scam reports, drainer scripts, typosquatting of a known brand, fake airdrops, seed-phrase requests).
Return an honest verdict plus a short human summary of what the scan found.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          risk_level: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          is_safe: { type: 'boolean' },
          phishing: { type: 'boolean' },
          malware: { type: 'boolean' },
          explanation: { type: 'string' },
          red_flags: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const verified = !!security?.is_safe && !security?.phishing && !security?.malware
      && ['Low', 'Medium'].includes(security?.risk_level);

    if (!verified) {
      return Response.json({ success: true, verified: false, security, url });
    }

    // 2) AI indexing — read the site and produce catalog metadata
    const meta = await base44.integrations.Core.InvokeLLM({
      prompt: `Index this website for a Kaspa ecosystem app directory: ${url}

Return a clean product name (no marketing tagline), a 1-2 sentence factual description of what it does, the best matching category from this list: ${CATEGORIES.join(', ')}, and up to 5 short feature tags.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const category = CATEGORIES.includes(meta?.category) ? meta.category : 'Ecosystem';
    const app = await base44.asServiceRole.entities.KaspaHubApp.create({
      name: (meta?.name || domain).slice(0, 120),
      description: meta?.description || '',
      url,
      category,
      logo: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
      features: ['community-listed', 'security-verified', ...(meta?.features || []).slice(0, 4)],
      indexed_at: new Date().toISOString(),
    });

    return Response.json({ success: true, verified: true, security, app, category });
  } catch (error) {
    console.error('submitKaspaSite error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});