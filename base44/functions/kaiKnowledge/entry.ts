import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'stats';
  const query = url.searchParams.get('q') || '';
  const deleteId = url.searchParams.get('id') || '';

  // Handle body for POST/DELETE
  let bodyData = {};
  if (req.method === 'POST' || req.method === 'DELETE') {
    try { bodyData = await req.json(); } catch {}
  }
  const effectiveAction = bodyData.action || action;
  const effectiveQuery = bodyData.q || query;
  const effectiveDeleteId = bodyData.id || deleteId;

  let memories = [];
  try {
    memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
  } catch {}

  if (memories.length === 0 || !memories[0].long_term?.length) {
    return Response.json({
      success: true,
      action: effectiveAction,
      sources: [],
      total_sources: 0,
      total_words: 0,
      total_blocks: 0,
      message: 'No knowledge stored yet.',
    });
  }

  const blocks = memories[0].long_term;

  // Build sources index
  const sourcesMap = {};
  blocks.forEach((b, idx) => {
    const title = b.metadata?.source_title || 'Unknown';
    const key = `${title}::${b.metadata?.source_url || ''}`;
    if (!sourcesMap[key]) {
      sourcesMap[key] = {
        id: idx,
        title,
        url: b.metadata?.source_url || '',
        type: b.metadata?.source_type || 'text',
        summary: b.metadata?.summary || '',
        chunks: 0,
        words: 0,
        date: b.stored,
        block_indices: [],
      };
    }
    sourcesMap[key].chunks++;
    sourcesMap[key].words += (b.value || '').split(/\s+/).length;
    sourcesMap[key].block_indices.push(idx);
    if (b.stored > sourcesMap[key].date) sourcesMap[key].date = b.stored;
  });

  const sources = Object.values(sourcesMap).sort((a, b) => (b.date || 0) - (a.date || 0));
  const totalWords = sources.reduce((sum, s) => sum + s.words, 0);

  // DELETE action
  if (effectiveAction === 'delete' && effectiveDeleteId !== '') {
    const targetIdx = parseInt(effectiveDeleteId);
    const targetSource = sources[targetIdx];
    if (!targetSource) {
      return Response.json({ success: false, error: 'Source not found.' });
    }
    // Remove all blocks belonging to this source
    const indicesToRemove = new Set(targetSource.block_indices);
    const filtered = blocks.filter((_, i) => !indicesToRemove.has(i));
    try {
      await base44.entities.AgentMemory.update(memories[0].id, { long_term: filtered });
    } catch (e) {
      return Response.json({ success: false, error: 'Failed to delete: ' + e.message });
    }
    return Response.json({
      success: true,
      action: 'delete',
      deleted: targetSource.title,
      remaining_sources: sources.length - 1,
    });
  }

  // SEARCH action
  if (effectiveAction === 'search' && effectiveQuery) {
    const q = effectiveQuery.toLowerCase();
    const matched = blocks.filter(b =>
      (b.value || '').toLowerCase().includes(q) ||
      (b.metadata?.source_title || '').toLowerCase().includes(q) ||
      (b.metadata?.summary || '').toLowerCase().includes(q)
    );
    const snippets = matched.slice(0, 10).map(b => ({
      source: b.metadata?.source_title || 'Unknown',
      type: b.metadata?.source_type || 'text',
      snippet: (b.value || '').slice(0, 200),
      url: b.metadata?.source_url || '',
    }));
    return Response.json({
      success: true,
      action: 'search',
      query: effectiveQuery,
      results_count: matched.length,
      snippets,
    });
  }

  // READ action
  if (effectiveAction === 'read' && effectiveDeleteId !== '') {
    const targetIdx = parseInt(effectiveDeleteId);
    const targetSource = sources[targetIdx];
    if (!targetSource) {
      return Response.json({ success: false, error: 'Source not found.' });
    }
    const fullContent = targetSource.block_indices.map(i => blocks[i]?.value || '').join('\n\n');
    return Response.json({
      success: true,
      action: 'read',
      source: {
        title: targetSource.title,
        url: targetSource.url,
        type: targetSource.type,
        words: targetSource.words,
        content: fullContent,
      },
    });
  }

  // LIST action
  if (effectiveAction === 'list') {
    return Response.json({
      success: true,
      action: 'list',
      total_sources: sources.length,
      total_words: totalWords,
      total_blocks: blocks.length,
      sources: sources.map((s, i) => ({
        id: i,
        title: s.title,
        type: s.type,
        url: s.url,
        words: s.words,
        chunks: s.chunks,
        summary: s.summary,
        date: s.date ? new Date(s.date).toLocaleDateString() : 'Unknown',
      })),
    });
  }

  // STATS action (default)
  const typeBreakdown = {};
  sources.forEach(s => {
    if (!typeBreakdown[s.type]) typeBreakdown[s.type] = { count: 0, words: 0 };
    typeBreakdown[s.type].count++;
    typeBreakdown[s.type].words += s.words;
  });

  return Response.json({
    success: true,
    action: 'stats',
    total_sources: sources.length,
    total_words: totalWords,
    total_blocks: blocks.length,
    by_type: typeBreakdown,
    recent: sources.slice(0, 5).map((s, i) => ({
      id: i,
      title: s.title,
      type: s.type,
      words: s.words,
      date: s.date ? new Date(s.date).toLocaleDateString() : 'Unknown',
    })),
  });
});