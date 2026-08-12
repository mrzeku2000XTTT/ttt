// Public search over the KaspaHubApp index. No auth required — guests on the
// landing page can search ~600 indexed Kaspa ecosystem apps.
// Loads all records (small dataset) and ranks by query relevance server-side,
// returning a Google-style result set.

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// collapse to letters+digits so "taptotip" matches "Tap to Tip" / "tap-to-tip.com"
const squash = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function score(app, terms, rawQuery) {
  if (!terms.length) return 1;
  const name = (app.name || '').toLowerCase();
  const desc = (app.description || '').toLowerCase();
  const cat = (app.category || '').toLowerCase();
  const url = (app.url || '').toLowerCase();
  const nameSq = squash(app.name);
  const urlSq = squash(app.url);
  const descSq = squash(app.description);
  const qSq = squash(rawQuery);

  let s = 0;

  // whole-query fuzzy (ignores spaces/dashes/case)
  if (qSq) {
    if (nameSq === qSq) s += 200;
    else if (nameSq.startsWith(qSq)) s += 120;
    else if (nameSq.includes(qSq)) s += 90;
    if (urlSq.includes(qSq)) s += 70;
    if (descSq.includes(qSq)) s += 25;
  }

  for (const t of terms) {
    if (!t) continue;
    const tSq = squash(t);
    if (name === t) s += 100;
    else if (name.startsWith(t)) s += 60;
    else if (name.includes(t)) s += 40;
    else if (tSq && nameSq.includes(tSq)) s += 30;
    if (desc.includes(t)) s += 8;
    if (cat.includes(t)) s += 6;
    if (url.includes(t)) s += 12;
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

    // aiOnly: skip returning results, just produce the AI overview (called
    // separately by the UI so the app list renders instantly)
    const { query, category, limit, aiOnly, withAi } = await req.json();
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

    let results = apps.map(a => ({ ...a, _s: score(a, terms, q) }));
    if (terms.length) {
      results = results.filter(r => r._s > 0).sort((a, b) => b._s - a._s);
    } else {
      // No query: return all (up to limit) grouped by category, name-sorted
      results = results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    // Dedupe: the same app can be indexed under multiple categories.
    // Keep the highest-ranked record per domain (or per name when URL is odd).
    const seen = new Set();
    results = results.filter(r => {
      let key;
      try {
        const u = new URL(r.url);
        // include the path so distinct profiles on a shared host (e.g. x.com/handle)
        // are not collapsed into one result
        key = (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '')).toLowerCase();
      }
      catch { key = squash(r.name) || squash(r.url); }
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const max = Math.min(parseInt(limit || 2000, 10), 2000);
    const finalResults = results.slice(0, max).map(({ _s, ...rest }) => rest);

    // AI overview — explains what the searched thing is, using indexed matches
    // when we have them, otherwise live web knowledge.
    let ai = null;
    if (q && (aiOnly || withAi)) {
      try {
        const top = finalResults.slice(0, 6).map(r => `- ${r.name} (${r.url}) [${r.category}]: ${(r.description || '').slice(0, 200)}`).join('\n');
        const prompt = top
          ? `The user searched the Kaspa ecosystem index for "${query}". These are the top matching apps:\n${top}\n\nWrite a 2-3 sentence plain-English overview explaining what the user is likely looking for and what these apps do. No markdown, no lists.`
          : `The user searched the Kaspa (KAS cryptocurrency) ecosystem for "${query}" and nothing matched our index. Explain in 2-3 plain sentences what "${query}" most likely is in the Kaspa / crypto context, and if it is a real project say what it does. If you are unsure, say so plainly. No markdown, no lists.`;
        const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: !top,
          model: 'gemini_3_flash'
        });
        ai = typeof out === 'string' ? out.trim() : null;
      } catch (e) {
        console.log('ai overview skipped:', e.message);
      }
    }

    return Response.json({
      success: true,
      results: aiOnly ? [] : finalResults,
      total: apps.length,
      shown: finalResults.length,
      ai
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('❌ searchKaspaApps error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});