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
      // Regular URL
      sourceType = 'article';
      let html = '';
      let isCloudflareBlocked = false;
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        });
        html = await pageRes.text();
        // Detect Cloudflare challenge or captcha pages
        isCloudflareBlocked = html.includes('Just a moment') || html.includes('cf-browser-verification') || html.includes('_cf_chl_opt');
        if (!isCloudflareBlocked) {
          const titleMatch = html.match(/<title>([^<]*)<\/title>/);
          sourceTitle = titleMatch ? titleMatch[1].trim() : url;
        } else {
          console.log('Cloudflare block detected for URL:', url);
          html = '';
        }
      } catch (e) {
        console.log('Direct fetch failed for URL:', url, e.message || e);
        // Direct fetch failed, use LLM with internet
      }

      try {
        // Use LLM with internet when we have no usable HTML content
        const useInternet = !html || html.length <= 200 || isCloudflareBlocked;
        const prompt = !useInternet
          ? `Extract all the important information, facts, and key content from this webpage. Be thorough. URL: ${url}\n\nRaw HTML (first 15000 chars):\n${html.slice(0, 15000)}`
          : `Read and extract ALL the key information, facts, and content from this URL: ${url}\n\nBe thorough and detailed. Include main topics, key facts, data points, names, and any important details.`;

        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: useInternet,
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