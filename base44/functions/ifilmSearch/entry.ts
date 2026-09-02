Deno.serve(async (req) => {
  try {
    const { query, page = 1, limit = 24, channel, suggest } = await req.json().catch(() => ({}));
    const vfields = 'id,title,thumbnail_360_url,owner.username,owner.screenname,duration,views_total,created_time,description';
    const headers = { 'User-Agent': 'iFilm/1.0 (+https://tttxyz.base44.app)', 'Accept': 'application/json' };

    // ── Autocomplete suggestions ──
    if (suggest) {
      const q = (query || '').trim();
      if (q.length < 1) return Response.json({ success: true, suggestions: [] });
      const surl = `https://www.dailymotion.com/suggest?query=${encodeURIComponent(q)}`;
      let sdata = await fetch(surl, { headers }).then((r) => r.json()).catch(() => null);
      let sug = Array.isArray(sdata?.suggestions) ? sdata.suggestions : null;
      if (!sug) {
        // fallback: derive phrases from a lightweight video search
        const furl = `https://api.dailymotion.com/videos?search=${encodeURIComponent(q)}&limit=10&page=1&fields=title`;
        const fdata = await fetch(furl, { headers }).then((r) => r.json()).catch(() => ({}));
        const titles = (fdata.list || []).map((v) => v.title).filter(Boolean);
        const seen = new Set();
        sug = [];
        for (const t of titles) {
          const low = t.toLowerCase();
          if (low.includes(q.toLowerCase()) && !seen.has(low)) { seen.add(low); sug.push(t); }
          if (sug.length >= 8) break;
        }
      }
      return Response.json({ success: true, suggestions: sug.slice(0, 10) });
    }

    const mapVideo = (v) => ({
      id: v.id,
      title: v.title || '',
      thumbnail: v.thumbnail_360_url || `https://www.dailymotion.com/thumbnail/video/${v.id}`,
      channel: v['owner.screenname'] || v['owner.username'] || '',
      duration: v.duration || 0,
      views: v.views_total || 0,
      created: v.created_time || 0,
      description: (v.description || '').slice(0, 280),
      embed: `https://www.dailymotion.com/embed/video/${v.id}`,
    });

    // ── Channel mode: browse one creator's videos ──
    let username = channel;
    if (!username && query && query.trim().startsWith('@')) username = query.trim().slice(1);
    if (username) {
      username = username.trim();
      const vurl = `https://api.dailymotion.com/user/${encodeURIComponent(username)}/videos?fields=${vfields}&limit=${limit}&page=${page}&sort=recent`;
      const iurl = `https://api.dailymotion.com/user/${encodeURIComponent(username)}?fields=username,screenname,description,avatar_120_url,videos_total`;
      const [vr, ir] = await Promise.all([
        fetch(vurl, { headers }).then((r) => r.json()).catch(() => ({})),
        fetch(iurl, { headers }).then((r) => r.json()).catch(() => ({})),
      ]);
      if (vr.error && vr.error.code === 'ENOENT' || ir.error) {
        // unknown user — fall through to search
      } else {
        const list = (vr.list || []).map(mapVideo);
        return Response.json({
          success: true,
          mode: 'channel',
          channel: {
            username: ir.username || username,
            screenname: ir.screenname || username,
            description: (ir.description || '').slice(0, 280),
            avatar: ir.avatar_120_url || '',
            videos_total: ir.videos_total || 0,
          },
          videos: list,
          page,
          hasMore: !!vr.has_more && list.length > 0,
        });
      }
    }

    // ── Search mode ──
    const q = (query || '').trim();
    let vurl;
    if (q) {
      vurl = `https://api.dailymotion.com/videos?search=${encodeURIComponent(q)}&limit=${limit}&page=${page}&fields=${vfields}&sort=relevance`;
    } else {
      vurl = `https://api.dailymotion.com/videos?list=what-to-watch&limit=${limit}&page=${page}&fields=${vfields}`;
    }
    const data = await fetch(vurl, { headers }).then((r) => r.json()).catch(() => ({}));
    const list = (data.list || []).map(mapVideo);

    // Channel suggestions (only on first page of a real search)
    let channels = [];
    if (q && page === 1) {
      const curl = `https://api.dailymotion.com/users?search=${encodeURIComponent(q)}&fields=username,screenname,description,avatar_120_url,videos_total&limit=8`;
      const cdata = await fetch(curl, { headers }).then((r) => r.json()).catch(() => ({}));
      channels = (cdata.list || []).filter((u) => (u.videos_total || 0) > 0).map((u) => ({
        username: u.username,
        screenname: u.screenname || u.username,
        description: (u.description || '').slice(0, 140),
        avatar: u.avatar_120_url || '',
        videos_total: u.videos_total || 0,
      }));
    }

    return Response.json({
      success: true,
      mode: 'search',
      videos: list,
      channels,
      page,
      hasMore: !!data.has_more && list.length > 0,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Search failed', success: false }, { status: 500 });
  }
});