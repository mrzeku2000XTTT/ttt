Deno.serve(async (req) => {
  try {
    const { ia_id, gutenberg_id, offset = 0, chunk = 200000, title, author } = await req.json().catch(() => ({}));
    const ua = { 'User-Agent': 'Narrate/1.0 (+https://tttxyz.base44.app)' };

    let text = '';
    // ---------- 0) Direct Project Gutenberg id (curated collections) ----------
    if (gutenberg_id) {
      for (const url of [
        `https://www.gutenberg.org/cache/epub/${gutenberg_id}/pg${gutenberg_id}.txt`,
        `https://www.gutenberg.org/ebooks/${gutenberg_id}.txt.utf-8`,
        `https://www.gutenberg.org/files/${gutenberg_id}/${gutenberg_id}-0.txt`,
      ]) {
        try {
          const r = await fetch(url, { headers: ua, redirect: 'follow' });
          if (r.ok) {
            text = await r.text();
            if (text.length > 200) break;
          }
        } catch {}
      }
    }

    // ---------- 1) Internet Archive (primary) ----------
    let textUrl = null;
    if (ia_id && text.length < 200) {
      try {
        const meta = await fetch(`https://archive.org/metadata/${ia_id}`, { headers: ua }).then((r) => r.json());
        const files = (meta?.files || []).filter((f) => f.name);
        const pick =
          files.find((f) => /_djvu\.txt$/i.test(f.name)) ||
          files.find((f) => /\.txt$/i.test(f.name) && !/_meta\.txt$|_djvu\.xml$|_images\.txt$/i.test(f.name)) ||
          files.find((f) => /_text\.(txt|pdf)$/i.test(f.name));
        if (pick) textUrl = `https://archive.org/download/${ia_id}/${pick.name}`;
      } catch {}
      if (!textUrl) textUrl = `https://archive.org/download/${ia_id}/${ia_id}_djvu.txt`;
    }

    if (textUrl) {
      try {
        const r = await fetch(textUrl, { headers: ua, redirect: 'follow' });
        if (r.ok) text = await r.text();
      } catch {}
    }

    // ---------- 2) Project Gutenberg fallback (real full text for classics) ----------
    let dbg = '';
    if ((!text || text.length < 200) && title) {
      try {
        const q = [title, author].filter(Boolean).join(' ').trim();
        const gr = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(q)}`, { headers: ua, redirect: 'follow' });
        dbg += `gutendex_status=${gr.status} `;
        const gx = await gr.json();
        const results = gx?.results || [];
        dbg += `results=${results.length} `;
        const hit = results.find((b) => {
          const bt = (b.title || '').toLowerCase();
          const ba = (b.authors || []).map((a) => (a.name || '').toLowerCase());
          const tOk = bt.includes(title.toLowerCase().slice(0, 20));
          const aOk = !author || ba.some((a) => a.includes(author.toLowerCase().slice(0, 15)));
          return tOk && aOk;
        }) || results[0];
        if (hit?.formats) {
          dbg += `hit=${hit.id} keys=${Object.keys(hit.formats).join('|')} `;
          const plain =
            hit.formats['text/plain; charset=us-ascii'] ||
            hit.formats['text/plain; charset=utf-8'] ||
            hit.formats['text/plain'];
          const candidates = [
            plain,
            `https://www.gutenberg.org/cache/epub/${hit.id}/pg${hit.id}.txt`,
            `https://www.gutenberg.org/ebooks/${hit.id}.txt.utf-8`,
          ].filter(Boolean);
          for (const url of candidates) {
            try {
              const r = await fetch(url, { headers: ua, redirect: 'follow' });
              dbg += `[${url.slice(-25)}]=${r.status} `;
              if (r.ok) {
                text = await r.text();
                if (text && text.length > 200) break;
              }
            } catch {}
          }
          if ((!text || text.length < 200) && hit.formats['text/html']) {
            const r = await fetch(hit.formats['text/html'], { headers: ua, redirect: 'follow' });
            dbg += `html_status=${r.status} `;
            if (r.ok) {
              const html = await r.text();
              text = html
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#\d+;/g, '');
            }
          }
        }
      } catch (e) {
        dbg += `err=${e?.message || e} `;
      }
    }

    if (!text || text.length < 200) {
      return Response.json({
        error: "Couldn't find a readable copy of this book online. Tap Scan a page to photograph your own copy and listen instantly.",
      });
    }

    // Light cleanup
    text = text.replace(/\r/g, '').replace(/\u0000/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');

    // Strip Project Gutenberg boilerplate so narration starts at the actual book
    const startMatch = text.match(/\*\*\*\s*START OF (?:THE PROJECT GUTENBERG EBOOK|GUTENBERG)[^\n]*\*\*\*/i);
    if (startMatch) {
      const s = startMatch.index + startMatch[0].length;
      const endMatch = text.slice(s).match(/\*\*\*\s*END OF (?:THE PROJECT GUTENBERG EBOOK|GUTENBERG)[^\n]*\*\*\*/i);
      text = endMatch ? text.slice(s, s + endMatch.index) : text.slice(s);
    }
    text = text.replace(/^\s*Title:\s*[^\n]+\n/i, '').trimStart();

    const total = text.length;
    const slice = text.slice(offset, offset + chunk);
    return Response.json({ text: slice, total, offset, hasMore: offset + chunk < total });
  } catch (e) {
    return Response.json({ error: e?.message || 'Fetch failed' }, { status: 500 });
  }
});