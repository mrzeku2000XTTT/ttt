import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { url, rawText, imposter_id, session_token } = body;

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

      // Use LLM with internet access to extract video content
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
          error: 'Could not extract video content. Try again in a moment.',
          source_title: sourceTitle,
        });
      }
    } else {
      // Regular URL
      sourceType = 'article';
      let html = '';
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImposterBot/1.0)' },
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

  // Store to ImposterIdentity.learned_knowledge
  try {
    const imposterRecords = await base44.asServiceRole.entities.ImposterIdentity.filter({ session_token });
    if (imposterRecords.length === 0) {
      return Response.json({
        success: false,
        error: 'Imposter identity not found.',
        source_title: sourceTitle,
      });
    }

    const identity = imposterRecords[0];
    const now = new Date().toISOString();
    
    // Build knowledge blocks
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

    // Get existing knowledge and append
    const existingKnowledge = identity.learned_knowledge || [];
    const combined = [...existingKnowledge, ...knowledgeBlocks].slice(-100); // Keep last 100 blocks
    
    await base44.asServiceRole.entities.ImposterIdentity.update(identity.id, {
      learned_knowledge: combined,
    });

    return Response.json({
      success: true,
      source_title: sourceTitle,
      source_type: sourceType,
      word_count: wordCount,
      chunks_stored: chunks.length,
      summary,
    });
  } catch (e) {
    console.error('Failed to store to ImposterIdentity:', e.message || e);
    return Response.json({
      success: false,
      error: 'Extracted content but failed to store it.',
      source_title: sourceTitle,
      word_count: wordCount,
    });
  }
});