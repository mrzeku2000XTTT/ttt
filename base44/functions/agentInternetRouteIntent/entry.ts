// Agent Internet guest router — classifies a guest's natural-language command
// against the live TTT app registry: best matching apps, related apps, novelty
// detection and an optional build prompt.
// Narrow guest-facing operation: the catalog and prompt live server-side and
// inputs are capped, so clients can't run arbitrary LLM prompts.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const MAX_COMMAND = 2000;
const MAX_CLIENT_CATALOG = 400;

// Top-level entry pages that aren't listed as apps in the registry
const EXTRA_PAGES = [
  { name: 'Idea Lab', desc: 'Generate & research Kaspa app ideas with live web search' },
  { name: 'App Store', desc: 'Browse all live Kaspa-native apps & builder projects' },
  { name: 'TTT Home', desc: 'The main TTT app hub & superagent launcher' },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const command = String(body.command || '').trim().slice(0, MAX_COMMAND);
    if (!command) return Response.json({ error: 'command required' }, { status: 400 });

    const apps = await base44.asServiceRole.entities.TTTAppRegistry.list('-created_date', 500);

    // The guest search must see the SAME catalog the App Store grid renders.
    // The client sends its live guest-visible app list (name + desc only);
    // the registry may lag behind it. Merge both, deduped by name.
    const clientCatalog = Array.isArray(body.catalog) ? body.catalog : [];
    const seen = new Set();
    const addLine = (name, desc) => {
      const n = String(name || '').trim();
      if (!n) return;
      const key = n.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      catalogLines.push(`- ${n.slice(0, 80)}: ${String(desc || '').slice(0, 160)}`);
    };
    const catalogLines = [];
    EXTRA_PAGES.forEach((p) => addLine(p.name, p.desc));
    (apps || []).filter((a) => a?.app_name).forEach((a) => addLine(a.app_name, a.description || a.category || ''));
    clientCatalog
      .filter((c) => c && typeof c.name === 'string')
      .slice(0, MAX_CLIENT_CATALOG)
      .forEach((c) => addLine(c.name, c.desc));
    const catalog = catalogLines.join('\n');
    if (!catalog) return Response.json({ error: 'catalog unavailable' }, { status: 503 });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        `A user typed a natural-language command into the TTT Agent Internet. Their input (may be long-form) is:\n"""${command}"""\n\n` +
        `Below is the catalog of available apps, listed as "name: description".\n\n` +
        `${catalog}\n\n` +
        `Your job:\n` +
        `1. "matches" — up to 3 app NAMES that EXACTLY appear in the catalog and best fit the user's intent, best-first. If none fit, return [].\n` +
        `2. "related" — up to 3 app NAMES that EXACTLY appear in the catalog and are the closest semantic neighbors to the intent even if not a direct fit (for inspiration).\n` +
        `3. "is_novel" — true ONLY if the input describes a SPECIFIC, concrete app idea or product that does NOT already exist in the catalog (i.e. the user is describing an app they wish existed and could build). A single word or short phrase (like "niche", "video editor", "wallet") is a SEARCH QUERY, not an idea — treat it as is_novel=false and match it to the closest catalog apps, including fuzzy/semantic matches (e.g. "niche" matches an app named "NICHE"). is_novel must also be false for generic commands, greetings, or anything that maps to an existing app.\n` +
        `4. "build_prompt" — if is_novel is true, write a complete, detailed app-building prompt (200-400 words) that the user could paste into base44.com to build this app. Start with "Build an app that..." and include: the core purpose, main features as a bulleted list, target users, key screens/pages, and any Kaspa/crypto integration if relevant. Write it ready-to-paste. If is_novel is false, return an empty string.`,
      response_json_schema: {
        type: 'object',
        properties: {
          matches: { type: 'array', items: { type: 'string' } },
          related: { type: 'array', items: { type: 'string' } },
          is_novel: { type: 'boolean' },
          build_prompt: { type: 'string' },
        },
        required: ['matches', 'related', 'is_novel', 'build_prompt'],
      },
    });

    const data = typeof res === 'string' ? JSON.parse(res) : res;
    return Response.json({
      matches: Array.isArray(data?.matches) ? data.matches.slice(0, 3) : [],
      related: Array.isArray(data?.related) ? data.related.slice(0, 3) : [],
      is_novel: !!data?.is_novel,
      build_prompt: typeof data?.build_prompt === 'string' ? data.build_prompt.slice(0, 4000) : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}