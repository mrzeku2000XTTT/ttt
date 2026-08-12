// Public search over the KaspaHubApp index. No auth required — guests on the
// landing page can search ~600 indexed Kaspa ecosystem apps.
// Loads all records (small dataset) and ranks by query relevance server-side,
// returning a Google-style result set.

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function score(app, terms) {
  if (!terms.length) return 1;
  const name = (app.name || '').toLowerCase();
  const desc = (app.description || '').toLowerCase();
  const cat = (app.category || '').toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!t) continue;
    if (name === t) s += 100;
    else if (name.startsWith(t)) s += 60;
    else if (name.includes(t)) s += 40;
    if (desc.includes(t)) s += 8;
    if (cat.includes(t)) s += 6;
  }
  return s;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const { query, category, limit } = await req.json();
    const base44 = createClientFromRequest(req);

    // Load the full index (small dataset — ~600 records)
    let apps = [];
    try {
      apps = await base44.asServiceRole.entities.KaspaHubApp.list('-indexed_at', 2000);
    } catch (e) {
      console.log('list error:', e.message);
      return Response.json({ success: true, results: [], total: 0, message: 'Index not built yet' });
    }

    if (category && category !== 'All') {
      apps = apps.filter(a => (a.category || '') === category);
    }

    const q = (query || '').trim().toLowerCase();
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];

    let results = apps.map(a => ({ ...a, _s: score(a, terms) }));
    if (terms.length) {
      results = results.filter(r => r._s > 0).sort((a, b) => b._s - a._s);
    } else {
      // No query: return all (up to limit) grouped by category, name-sorted
      results = results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const max = Math.min(parseInt(limit || 2000, 10), 2000);
    const finalResults = results.slice(0, max).map(({ _s, ...rest }) => rest);

    return Response.json({
      success: true,
      results: finalResults,
      total: apps.length,
      shown: finalResults.length
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('❌ searchKaspaApps error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});