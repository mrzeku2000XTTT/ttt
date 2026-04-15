import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, rawText } = await req.json();

  // Step 1: Fetch content
  let content = '';
  let sourceTitle = '';
  let sourceType = 'text';
  let wordCount = 0;

  if (rawText) {
    content = rawText;
    sourceTitle = 'User-provided text';
    sourceType = 'text';
  } else if (url) {
    // Detect YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      sourceType = 'youtube';
      const videoId = ytMatch[1];
      // Try to get transcript via a public transcript API
      try {
        const transcriptRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await transcriptRes.text();
        // Extract title
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        sourceTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : `YouTube Video ${videoId}`;
        // Use InvokeLLM with the URL for content extraction
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Watch/analyze this YouTube video and extract all the key information, facts, and insights from it. Be thorough and detailed. Video URL: ${url}`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = extracted;
      } catch (e) {
        // Fallback: use LLM with internet to get video content
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Find and summarize all the key information from this YouTube video: ${url}. Include all facts, data points, opinions, and insights mentioned.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = extracted;
        sourceTitle = `YouTube: ${videoId}`;
      }
    } else {
      // Regular URL — fetch and extract
      sourceType = 'article';
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaiBot/1.0)' },
          redirect: 'follow',
        });
        const html = await pageRes.text();
        // Extract title
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        sourceTitle = titleMatch ? titleMatch[1].trim() : url;
        // Use LLM to extract clean content from HTML
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Extract all the important information, facts, and key content from this webpage. Be thorough. URL: ${url}\n\nRaw HTML (first 15000 chars):\n${html.slice(0, 15000)}`,
          model: 'gemini_3_flash',
        });
        content = extracted;
      } catch (e) {
        // Fallback: use LLM with internet access
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Read and extract all the key information from this URL: ${url}. Be thorough and detailed.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = extracted;
        sourceTitle = url;
      }
    }
  } else {
    return Response.json({ error: 'No URL or text provided' }, { status: 400 });
  }

  wordCount = content.split(/\s+/).length;

  // Step 2: Chunk the content into knowledge blocks
  const chunkSize = 500; // words per chunk
  const words = content.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  // Step 3: Generate a summary
  let summary = '';
  try {
    summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Summarize this in one clear sentence (max 20 words):\n\n${content.slice(0, 3000)}`,
    });
  } catch {
    summary = `Content from ${sourceTitle}`;
  }

  // Step 4: Store to AgentMemory
  const now = Date.now();
  const knowledgeBlocks = chunks.map((chunk, i) => ({
    key: `learned:${sourceTitle.slice(0, 50)}:chunk_${i}`,
    value: chunk,
    metadata: {
      source_url: url || 'direct_text',
      source_title: sourceTitle,
      source_type: sourceType,
      chunk_index: i,
      total_chunks: chunks.length,
      summary: i === 0 ? summary : undefined,
    },
    stored: now,
    accessed: now,
    access_count: 0,
  }));

  // Get or create user's AgentMemory
  let memories = [];
  try {
    memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
  } catch { /* empty */ }

  if (memories.length > 0) {
    const existing = memories[0];
    const existingLongTerm = existing.long_term || [];
    // Cap at 200 knowledge blocks per user
    const combined = [...existingLongTerm, ...knowledgeBlocks].slice(-200);
    await base44.entities.AgentMemory.update(existing.id, {
      long_term: combined,
    });
  } else {
    await base44.entities.AgentMemory.create({
      user_id: user.email,
      long_term: knowledgeBlocks,
      short_term: [],
      episodic: [],
    });
  }

  return Response.json({
    success: true,
    source_title: sourceTitle,
    source_type: sourceType,
    word_count: wordCount,
    chunks_stored: chunks.length,
    summary: summary,
  });
});