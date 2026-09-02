Deno.serve(async (req) => {
  try {
    const { query, page = 1, limit = 24 } = await req.json().catch(() => ({}));
    const fields = 'id,title,thumbnail_360_url,owner.username,owner.screenname,duration,views_total,created_time,description';
    let url;
    if (query && query.trim()) {
      url = `https://api.dailymotion.com/videos?search=${encodeURIComponent(query.trim())}&limit=${limit}&page=${page}&fields=${fields}&sort=relevance`;
    } else {
      url = `https://api.dailymotion.com/videos?list=what-to-watch&limit=${limit}&page=${page}&fields=${fields}`;
    }
    const r = await fetch(url, { headers: { 'User-Agent': 'iFilm/1.0 (+https://tttxyz.base44.app)', 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`Upstream ${r.status}`);
    const data = await r.json();
    const list = (data.list || []).map((v) => ({
      id: v.id,
      title: v.title || '',
      thumbnail: v.thumbnail_360_url || `https://www.dailymotion.com/thumbnail/video/${v.id}`,
      channel: v['owner.screenname'] || v['owner.username'] || '',
      duration: v.duration || 0,
      views: v.views_total || 0,
      created: v.created_time || 0,
      description: (v.description || '').slice(0, 280),
      embed: `https://www.dailymotion.com/embed/video/${v.id}`,
    }));
    return Response.json({ success: true, videos: list, query: query || '', page, hasMore: !!data.has_more });
  } catch (error) {
    return Response.json({ error: error.message || 'Search failed', success: false }, { status: 500 });
  }
});