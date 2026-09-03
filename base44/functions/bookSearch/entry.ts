Deno.serve(async (req) => {
  try {
    const { query, page = 1, limit = 30 } = await req.json().catch(() => ({}));
    const q = (query || '').trim();
    if (!q) return Response.json({ error: 'Query required' }, { status: 400 });

    const fields = 'key,title,author_name,first_publish_year,cover_i,ia,ia_count,edition_key,language,subject';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}&fields=${fields}`;
    const data = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Narrate/1.0 (+https://tttxyz.base44.app)' },
    }).then((r) => r.json()).catch(() => ({}));

    const docs = Array.isArray(data?.docs) ? data.docs : [];
    const books = docs.map((d) => ({
      title: d.title || 'Untitled',
      author: (d.author_name || [])[0] || 'Unknown',
      year: d.first_publish_year || null,
      cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      ia_id: (d.ia || [])[0] || null,
      olid: (d.edition_key || [])[0] || (d.key || '').replace('/works/', ''),
      subjects: (d.subject || []).slice(0, 4),
      language: (d.language || [])[0] || 'eng',
    }));

    return Response.json({ books, total: data?.numFound || books.length, page });
  } catch (e) {
    return Response.json({ error: e?.message || 'Search failed' }, { status: 500 });
  }
});