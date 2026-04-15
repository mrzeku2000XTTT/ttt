import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { url, rawText, poll } = body;

  let content = '';
  let sourceTitle = '';
  let sourceType = 'text';
  let wordCount = 0;

  // X.com / Twitter URLs — route through kaspaContext
  const isXUrl = (u) => /^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i.test(u);
  if (url && isXUrl(url)) {
    try {
      const tweetRes = await fetch(`https://kaspa-b3ad561a.base44.app/functions/kaspaContext?tweet=${encodeURIComponent(url)}`);
      const tweetData = await tweetRes.json();

      if (!tweetData.content && !tweetData.text) {
        return Response.json({
          success: false,
          error: tweetData.error || 'Tweet not found or is private/deleted.',
        });
      }

      const tweetContent = tweetData.content || tweetData.text || '';
      const tweetTitle = tweetData.title || tweetData.author || 'Tweet';
      const tweetWordCount = tweetContent.split(/\s+/).length;
      const linkedPages = tweetData.linked_pages || [];
      const cached = tweetData.cached || false;

      // Store tweet to AgentMemory
      const now = Date.now();
      const knowledgeBlocks = [{
        key: `learned:tweet:${tweetTitle.slice(0, 50)}`,
        value: tweetContent,
        metadata: {
          source_url: url,
          source_title: tweetTitle,
          source_type: 'tweet',
          summary: tweetContent.slice(0, 100),
        },
        stored: now,
        accessed: now,
        access_count: 0,
      }];

      // Also store linked pages if any
      for (const page of linkedPages) {
        if (page.content || page.text) {
          knowledgeBlocks.push({
            key: `learned:linked:${(page.title || page.url || '').slice(0, 50)}`,
            value: page.content || page.text,
            metadata: {
              source_url: page.url,
              source_title: page.title || page.url,
              source_type: 'linked_page',
              summary: (page.content || page.text || '').slice(0, 100),
            },
            stored: now,
            accessed: now,
            access_count: 0,
          });
        }
      }

      let memories = [];
      try { memories = await base44.entities.AgentMemory.filter({ user_id: user.email }); } catch {}

      try {
        if (memories.length > 0) {
          const existing = memories[0];
          const combined = [...(existing.long_term || []), ...knowledgeBlocks].slice(-200);
          await base44.entities.AgentMemory.update(existing.id, { long_term: combined });
        } else {
          await base44.entities.AgentMemory.create({
            user_id: user.email,
            long_term: knowledgeBlocks,
            short_term: [],
            episodic: [],
          });
        }
      } catch (e) {
        console.error('Failed to store tweet to AgentMemory:', e.message || e);
      }

      return Response.json({
        success: true,
        source_title: tweetTitle,
        source_type: 'tweet',
        word_count: tweetWordCount,
        chunks_stored: knowledgeBlocks.length,
        summary: tweetContent.slice(0, 150),
        content: tweetContent,
        linked_pages: linkedPages,
        cached,
      });
    } catch (e) {
      console.error('kaspaContext tweet fetch failed:', e.message || e);
      return Response.json({
        success: false,
        error: 'Could not fetch that tweet. Try again in a moment.',
      });
    }
  }

  if (rawText) {
    content = rawText;
    sourceTitle = 'User-provided text';
    sourceType = 'text';
  } else if (url) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    
    if (ytMatch) {
      sourceType = 'youtube';
      const videoId = ytMatch[1];
      sourceTitle = `YouTube Video ${videoId}`;

      try {
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Watch and thoroughly analyze this YouTube video: ${url}\n\nExtract ALL key information including:\n- Main topics and themes discussed\n- Key facts, data points, and statistics mentioned\n- Names of people, projects, or organizations referenced\n- Technical details and explanations\n- Opinions and predictions shared\n- Any URLs, links, or resources mentioned\n\nBe as detailed and comprehensive as possible. Include direct quotes where relevant.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = extracted;
        if (typeof extracted === 'string' && extracted.length > 50) {
          sourceTitle = extracted.split('\n')[0].replace(/^[#*\s]+/, '').slice(0, 100) || sourceTitle;
        }
      } catch (e) {
        console.error('LLM extraction failed for YouTube:', e.message || e);
        return Response.json({
          success: false,
          error: 'Could not extract video content. The AI service may be temporarily busy. Try again in a moment.',
          source_title: sourceTitle,
        });
      }
    } else {
      // Regular URL
      sourceType = 'article';
      let html = '';
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaiBot/1.0)' },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        });
        html = await pageRes.text();
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
        sourceTitle = titleMatch ? titleMatch[1].replace(/&amp;/g,'&').trim() : url;
      } catch {
        // Direct fetch failed, use LLM with internet
      }

      try {
        const prompt = html.length > 200
          ? `Extract all the important information, facts, and key content from this webpage. Be thorough. URL: ${url}\n\nRaw HTML (first 15000 chars):\n${html.slice(0, 15000)}`
          : `Read and extract all the key information from this URL: ${url}. Be thorough and detailed.`;

        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: html.length <= 200,
          model: 'gemini_3_flash',
        });
        content = extracted;
        if (!sourceTitle || sourceTitle === url) {
          sourceTitle = url.replace(/^https?:\/\//, '').split('/')[0];
        }
      } catch (e) {
        console.error('LLM extraction failed for URL:', e.message || e);
        return Response.json({
          success: false,
          error: 'Could not extract content. Try again in a moment.',
          source_title: sourceTitle || url,
        });
      }
    }
  } else {
    return Response.json({ error: 'No URL or text provided' }, { status: 400 });
  }

  if (!content || content.length < 20) {
    return Response.json({
      success: false,
      error: 'Could not extract meaningful content from the source.',
      source_title: sourceTitle,
    });
  }

  wordCount = content.split(/\s+/).length;

  // Chunk the content
  const chunkSize = 500;
  const words = content.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  // Generate a summary
  let summary = '';
  try {
    summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Summarize this in one clear sentence (max 20 words):\n\n${content.slice(0, 3000)}`,
    });
  } catch {
    summary = `Content from ${sourceTitle}`;
  }

  // Store to AgentMemory
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

  let memories = [];
  try {
    memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
  } catch { /* empty */ }

  try {
    if (memories.length > 0) {
      const existing = memories[0];
      const existingLongTerm = existing.long_term || [];
      const combined = [...existingLongTerm, ...knowledgeBlocks].slice(-200);
      await base44.entities.AgentMemory.update(existing.id, { long_term: combined });
    } else {
      await base44.entities.AgentMemory.create({
        user_id: user.email,
        long_term: knowledgeBlocks,
        short_term: [],
        episodic: [],
      });
    }
  } catch (e) {
    console.error('Failed to store to AgentMemory:', e.message || e);
    return Response.json({
      success: false,
      error: 'Extracted content but failed to store it. Try again.',
      source_title: sourceTitle,
      word_count: wordCount,
    });
  }

  return Response.json({
    success: true,
    source_title: sourceTitle,
    source_type: sourceType,
    word_count: wordCount,
    chunks_stored: chunks.length,
    summary,
  });
});