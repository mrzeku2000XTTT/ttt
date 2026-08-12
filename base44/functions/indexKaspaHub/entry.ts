// Scraper + indexer for kaspahub.org.
// Each KaspaHub section page embeds the full app list as a
// `const items = [...]` JS array (valid JSON) inside an inline <script>.
// This function extracts that array from every section page, parses it,
// dedupes by URL, and bulk-inserts into the KaspaHubApp entity (clearing the
// previous index first). Admin-only. Run once (or via a workflow) to build a
// searchable index of ~600 Kaspa ecosystem apps.

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const SECTIONS = [
  { name: 'Resources', path: 'resources' },
  { name: 'Exchanges', path: 'exchanges' },
  { name: 'Ecosystem', path: 'ecosystem' },
  { name: 'Wallets', path: 'wallets' },
  { name: 'Merchant Solutions', path: 'solutions' },
  { name: 'Developer Tools', path: 'developers' },
  { name: 'Community Chats', path: 'communities' },
  { name: 'News Sources', path: 'sources' },
];

// Extract the first `const items = [ ... ]` array from the page HTML and
// parse it as JSON by bracket-matching (strings can contain brackets).
function extractItems(html) {
  const start = html.indexOf('const items = [');
  if (start === -1) return null;
  const arrStart = html.indexOf('[', start);
  if (arrStart === -1) return null;

  let depth = 0, inStr = false, esc = false, i = arrStart;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
  }
  const arrStr = html.slice(arrStart, i + 1);
  try {
    return JSON.parse(arrStr);
  } catch (e) {
    console.log('JSON.parse failed:', e.message, 'head:', arrStr.slice(0, 200));
    return null;
  }
}

// KaspaHub renders every section's grid as server-side HTML anchor "cards".
// This is the authoritative source (the ecosystem page shows 311 of 311 here),
// so parse the cards directly out of the markup.
function extractCards(html) {
  const grid = html.match(/<div class="filter-grid"[^>]*>([\s\S]*?)<\/div>\s*<\/section>/);
  const scope = grid ? grid[1] : html;
  const cards = scope.match(/<a\s[^>]*class="[^"]*filter-card[^"]*"[\s\S]*?<\/a>/g) || [];
  const out = [];
  for (const card of cards) {
    const href = card.match(/href="([^"]+)"/);
    if (!href) continue;
    const h3 = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const name = h3 ? decode(h3[1].replace(/<[^>]+>/g, ' ')).trim() : '';
    if (!name) continue;
    const desc = card.match(/class="filter-description"[^>]*>([\s\S]*?)<\/p>/);
    const logo = card.match(/<img[^>]+src="([^"]+)"/);
    const tags = [...card.matchAll(/class="feature-tag ([^"]+)"/g)].map(m => m[1].trim());
    out.push({
      name,
      description: desc ? decode(desc[1].replace(/<[^>]+>/g, ' ')).trim() : '',
      link: href[1].trim(),
      logo: logo ? logo[1] : '',
      features: tags
    });
  }
  return out.length ? out : null;
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;|&#8217;/g, '\u2019')
    .replace(/\s+/g, ' ');
}

// Some sections (ecosystem) load their data from a JSON file under
// /assets/data/<section>.json. Detect that reference in the page HTML.
function findDataFile(html) {
  const m = html.match(/['"`](\/assets\/data\/[^'"`]+\.json)['"`]/);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only', success: false }, { status: 403 });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    };

    const all = new Map(); // dedupe by url
    const perSection = {};

    for (const section of SECTIONS) {
      const url = `https://kaspahub.org/${section.path}/`;
      console.log(`🌐 Indexing ${section.name}: ${url}`);
      try {
        const res = await fetch(url, { headers, redirect: 'follow' });
        if (!res.ok) {
          console.log(`❌ ${section.name} HTTP ${res.status}`);
          perSection[section.name] = 0;
          continue;
        }
        const html = await res.text();

        // 1) Prefer the rendered HTML cards (complete + authoritative)
        let items = extractCards(html);

        // 2) Fall back to a JSON data file if the page references one
        const dataFile = items ? null : (findDataFile(html) || `/assets/data/${section.path}.json`);
        if (dataFile) {
          try {
            const jres = await fetch(`https://kaspahub.org${dataFile}`, { headers, redirect: 'follow' });
            if (jres.ok) {
              const j = await jres.json();
              items = Array.isArray(j) ? j : (Array.isArray(j.items) ? j.items : null);
              console.log(`📄 ${section.name}: loaded ${items?.length || 0} items from ${dataFile}`);
            }
          } catch (e) {
            // fall through to inline parse
          }
        }

        // 2) Fall back to inline `const items` array in the HTML
        if (!items) {
          items = extractItems(html);
        }

        if (!items || !Array.isArray(items)) {
          console.log(`❌ ${section.name}: no items array found`);
          perSection[section.name] = 0;
          continue;
        }
        console.log(`✅ ${section.name}: ${items.length} items`);
        perSection[section.name] = items.length;
        for (const it of items) {
          if (!it || !it.name || !it.link) continue;
          // dedupe within a section only — an app can legitimately appear in
          // several sections (e.g. Ecosystem + Wallets) and each list must stay complete
          all.set(`${section.name}|${it.link}`, {
            name: String(it.name).trim(),
            description: String(it.description || '').trim(),
            url: String(it.link).trim(),
            category: section.name,
            logo: it.logo ? String(it.logo) : '',
            features: Array.isArray(it.features) ? it.features : [],
            indexed_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.log(`❌ ${section.name} error: ${e.message}`);
        perSection[section.name] = 0;
      }
    }

    const records = [...all.values()];

    // Clear previous index
    console.log(`🧹 Clearing previous index...`);
    try {
      await base44.asServiceRole.entities.KaspaHubApp.deleteMany({});
    } catch (e) {
      console.log('Clear failed (continuing):', e.message);
    }

    // Bulk insert in batches of 100
    console.log(`💾 Inserting ${records.length} apps...`);
    let inserted = 0;
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      try {
        await base44.asServiceRole.entities.KaspaHubApp.bulkCreate(batch);
        inserted += batch.length;
      } catch (e) {
        console.log(`Batch insert error at ${i}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      totalIndexed: inserted,
      uniqueUrls: all.size,
      sections: perSection
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    console.error('❌ indexKaspaHub error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});