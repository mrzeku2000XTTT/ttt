// Admin-only: discover Kaspa community X (Twitter) profiles using internet-
// grounded AI research and index them permanently into KaspaHubApp.
// Already-indexed handles are skipped, so re-runs only add NEW profiles.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const X_LOGO = 'https://kaspahub.org/assets/logos/x.webp';

const RESEARCH_ANGLES = [
  'Kaspa core developers, founders, researchers and protocol contributors',
  'KRC-20 token projects, NFT projects and ecosystem dApps built on Kaspa',
  'Kaspa influencers, content creators, YouTubers and educators',
  'Kaspa news accounts, mining pools, wallets, exchanges and infrastructure providers',
  'notable Kaspa community members, artists, node runners and long-time supporters',
];

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    profiles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          handle: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
};

function cleanHandle(raw) {
  const h = (raw || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '').split(/[/?#]/)[0];
  return /^[A-Za-z0-9_]{2,15}$/.test(h) ? h : null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Load existing index and collect already-known X handles
    const existing = [];
    let skip = 0;
    while (true) {
      const page = await base44.asServiceRole.entities.KaspaHubApp.list(null, 500, skip);
      existing.push(...page);
      if (page.length < 500) break;
      skip += 500;
    }
    const known = new Set();
    for (const app of existing) {
      const m = (app.url || '').match(/(?:x|twitter)\.com\/(@?[A-Za-z0-9_]{2,15})/i);
      if (m) known.add(m[1].replace(/^@/, '').toLowerCase());
    }

    // 2. Internet-grounded AI research across community angles (parallel)
    const runs = await Promise.allSettled(RESEARCH_ANGLES.map((angle) =>
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `List real, currently-active X (Twitter) accounts from the Kaspa (KAS) cryptocurrency community, specifically: ${angle}. Only include handles you are CONFIDENT actually exist on X — never invent handles. For each give the exact X handle (no @), the display name, and a friendly 1-2 sentence description of who they are in the Kaspa community. List as many real accounts as you can find.`,
        add_context_from_internet: true,
        response_json_schema: PROFILE_SCHEMA,
      })
    ));

    const fresh = new Map(); // handle(lower) -> record
    let failedAngles = 0;
    for (const run of runs) {
      if (run.status !== 'fulfilled') { failedAngles++; continue; }
      for (const p of run.value?.profiles || []) {
        const handle = cleanHandle(p.handle);
        if (!handle) continue;
        const key = handle.toLowerCase();
        if (known.has(key) || fresh.has(key)) continue;
        fresh.set(key, {
          name: (p.name || handle).slice(0, 80),
          description: p.description || `Kaspa community member on X (@${handle}).`,
          url: `https://x.com/${handle}`,
          category: 'News Sources',
          logo: X_LOGO,
          features: ['reviewed', 'x'],
          indexed_at: new Date().toISOString(),
        });
      }
    }

    const records = [...fresh.values()];
    if (records.length > 0) {
      await base44.asServiceRole.entities.KaspaHubApp.bulkCreate(records);
    }

    return Response.json({
      success: true,
      added: records.length,
      alreadyIndexed: known.size,
      failedAngles,
      sample: records.slice(0, 8).map((r) => `${r.name} — ${r.url}`),
    });
  } catch (error) {
    console.error('[indexKaspaXProfiles] error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}