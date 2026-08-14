// KCC-20 leaderboard — KRON (kron.technology) covenant tokens, cross-referenced
// on kascov.io, with each project's X profile so the community shows up in
// Search Kaspa. KRON has no public API, so data is AI-sourced from the live web.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SEED = [
  { ticker: 'KKDAG', x: 'https://x.com/kasknightDAG' },
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Search the live web (kron.technology, kron.technology/launch, kascov.io, x.com, kaspa.news) for REAL KCC-20 covenant tokens launched on KRON — the Kaspa native L1 DEX + launchpad. KCC-20 = Kaspa Covenant Contract standard (SilverScript), NOT KRC-20.

Always include the token ${SEED.map(s => s.ticker).join(', ')} (its official X profile is ${SEED[0].x} — kasKnightDAG). Then add every other KCC-20 token on KRON you can verify.

For each token return: ticker, name, description (1 short factual sentence), x_url (the project's official X/Twitter profile URL — required if it exists, else empty), x_handle (without @), market_cap_kas (number), price_kas (number), graduation_pct (0-100), holders (number), volume_24h_kas (number), age_hours (number), kron_url, kascov_url, creator_address.

Rank by market_cap_kas descending. Only real tokens with web evidence — never invent tickers, prices or launch status. Use 0 for numbers you cannot verify.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          tokens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ticker: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                x_url: { type: 'string' },
                x_handle: { type: 'string' },
                market_cap_kas: { type: 'number' },
                price_kas: { type: 'number' },
                graduation_pct: { type: 'number' },
                holders: { type: 'number' },
                volume_24h_kas: { type: 'number' },
                age_hours: { type: 'number' },
                kron_url: { type: 'string' },
                kascov_url: { type: 'string' },
                creator_address: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const tokens = Array.isArray(res?.tokens) ? res.tokens : [];

    // Guarantee the seeded tokens are present with their known X profile.
    SEED.forEach((s) => {
      const found = tokens.find((t) => (t.ticker || '').toUpperCase() === s.ticker);
      if (found) {
        if (!found.x_url) found.x_url = s.x;
      } else {
        tokens.push({ ticker: s.ticker, name: s.ticker, description: '', x_url: s.x, x_handle: s.x.split('/').pop() });
      }
    });

    tokens.forEach((t) => {
      if (!t.x_handle && t.x_url) t.x_handle = t.x_url.split('/').filter(Boolean).pop();
      if (t.ticker) t.ticker = t.ticker.toUpperCase();
    });

    tokens.sort((a, b) => (b.market_cap_kas || 0) - (a.market_cap_kas || 0));

    return Response.json({ success: true, tokens, fetched_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}