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

      // Use LLM with internet access to extract video content — don't fetch YouTube directly (Cloudflare blocks it)
      try {
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Watch and thoroughly analyze this YouTube video: ${url}\n\nExtract ALL key information including:\n- Main topics and themes discussed\n- Key facts, data points, and statistics mentioned\n- Names of people, projects, or organizations referenced\n- Technical details and explanations\n- Opinions and predictions shared\n- Any URLs, links, or resources mentioned\n\nBe as detailed and comprehensive as possible. Include direct quotes where relevant.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = extracted;
        // Try to extract a cleaner title from the response
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
      // Check if it's a Twitter/X post
      const isXPost = /^https?:\/\/(x\.com|twitter\.com)\/\w+\/status\/\d+/i.test(url);
      sourceType = isXPost ? 'x_post' : 'article';
      let html = '';

      // Try direct fetch (will fail for X/Twitter but works for articles)
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        });
        html = await pageRes.text();
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        sourceTitle = titleMatch ? titleMatch[1].trim() : url;
      } catch {
        // Direct fetch failed, use LLM with internet
      }

      try {
        let prompt;
        if (isXPost) {
          // Strict prompt for X/Twitter — forces the LLM to read the actual post
          prompt = `Go to this exact URL and read the tweet/post: ${url}

OUTPUT RULES — FOLLOW EXACTLY:
1. Start with the author's display name and @handle
2. Copy the EXACT full text of the tweet/post word-for-word. Do NOT paraphrase, summarize, or add your own words.
3. List every link, URL, or reference mentioned in the post
4. Note the engagement stats if visible (likes, reposts, replies)
5. If it's a thread, include all tweets in order
6. If it quotes or reposts another tweet, include that too with its author

DO NOT add analysis, opinions, or context. Only output what is actually written in the post.
DO NOT make up or guess content. If you cannot access the post, say "COULD NOT ACCESS POST".`;
        } else {
          prompt = html.length > 200
            ? `Extract the EXACT text content from this webpage. Copy the actual words written on the page — do NOT paraphrase or summarize. Include all links and references. URL: ${url}\n\nRaw HTML (first 15000 chars):\n${html.slice(0, 15000)}`
            : `Go to this URL and extract the EXACT text content: ${url}\n\nCopy the actual words written on the page word-for-word. Include all links and references mentioned. Do NOT paraphrase or add your own analysis.`;
        }

        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = extracted;
        if (!sourceTitle || sourceTitle === url) {
          sourceTitle = isXPost ? `X post from ${url.match(/x\.com\/(\w+)/)?.[1] || 'unknown'}` : url.replace(/^https?:\/\//, '').split('/')[0];
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
    source_url: url || null,
    word_count: wordCount,
    chunks_stored: chunks.length,
    summary,
    extracted_content: content.slice(0, 4000),
  });
});