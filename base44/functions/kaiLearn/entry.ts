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

      // Step 1: Get video title from oEmbed (no API key needed)
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title) sourceTitle = oembedData.title;
        }
      } catch { /* title fallback is fine */ }

      // Step 2: Try to get real transcript via YouTube transcript endpoints
      let transcript = '';
      
      // Method A: Fetch YouTube page and extract captions from ytInitialPlayerResponse
      try {
        const ytPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(10000),
        });
        const ytHtml = await ytPageRes.text();
        console.log(`[kaiLearn] YouTube page fetched: ${ytHtml.length} chars`);
        
        // Extract captions URL — try multiple patterns (YouTube changes their format)
        let captionTracks = null;
        
        // Pattern 1: "captionTracks": [...]
        const p1 = ytHtml.match(/"captionTracks":\s*(\[.*?\])/);
        if (p1) {
          try { captionTracks = JSON.parse(p1[1]); } catch {}
        }
        
        // Pattern 2: Look in playerCaptionsTracklistRenderer
        if (!captionTracks) {
          const p2 = ytHtml.match(/"playerCaptionsTracklistRenderer":\s*\{[^}]*"captionTracks":\s*(\[[\s\S]*?\])\s*[,}]/);
          if (p2) {
            try { captionTracks = JSON.parse(p2[1]); } catch {}
          }
        }
        
        // Pattern 3: Extract timedtext URL directly and build proper caption track
        if (!captionTracks) {
          const urlMatches = [...ytHtml.matchAll(/https?:\\\/\\\/www\.youtube\.com\\\/api\\\/timedtext[^"']*/g)];
          if (urlMatches.length > 0) {
            let rawUrl = urlMatches[0][0].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
            // Ensure it has lang=en and fmt=json3 for reliable extraction
            if (!rawUrl.includes('lang=')) rawUrl += '&lang=en';
            if (!rawUrl.includes('fmt=')) rawUrl += '&fmt=json3';
            captionTracks = [{ baseUrl: rawUrl, languageCode: 'en' }];
            console.log(`[kaiLearn] Found timedtext URL directly: ${rawUrl.slice(0, 120)}`);
          }
        }
        
        console.log(`[kaiLearn] Caption tracks found: ${captionTracks ? captionTracks.length : 0}`);
        
        if (captionTracks && captionTracks.length > 0) {
          // Prefer English, fall back to first available, prefer non-auto-generated
          const enTrack = captionTracks.find(t => t.languageCode === 'en' && !t.kind) 
            || captionTracks.find(t => t.languageCode === 'en')
            || captionTracks[0];
          
          if (enTrack?.baseUrl) {
            let captionUrl = enTrack.baseUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
            // Try JSON3 format first (more reliable), then XML fallback
            const useJson3 = captionUrl.includes('fmt=json3');
            if (!useJson3 && !captionUrl.includes('fmt=')) captionUrl += '&fmt=json3';
            
            console.log(`[kaiLearn] Fetching captions (json3=${useJson3 || !captionUrl.includes('fmt=srv')}): ${captionUrl.slice(0, 120)}`);
            const captionRes = await fetch(captionUrl, { 
              signal: AbortSignal.timeout(10000),
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const captionText = await captionRes.text();
            console.log(`[kaiLearn] Captions response: ${captionText.length} chars, first 200: ${captionText.slice(0, 200)}`);
            
            const lines = [];
            
            // Try JSON3 parse first
            if (captionText.startsWith('{')) {
              try {
                const json3 = JSON.parse(captionText);
                const events = json3.events || [];
                for (const event of events) {
                  if (event.segs) {
                    const segText = event.segs.map(s => s.utf8 || '').join('').trim();
                    if (segText && segText !== '\n') lines.push(segText);
                  }
                }
              } catch { console.log('[kaiLearn] JSON3 parse failed'); }
            }
            
            // XML fallback
            if (lines.length === 0 && captionText.includes('<text')) {
              const textMatches = captionText.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g);
              for (const m of textMatches) {
                const decoded = m[1]
                  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n/g, ' ').trim();
                if (decoded) lines.push(decoded);
              }
            }
            
            transcript = lines.join(' ');
            console.log(`[kaiLearn] Extracted real transcript: ${transcript.length} chars, ${lines.length} segments`);
          }
        }
      } catch (e) {
        console.log('[kaiLearn] YouTube page transcript extraction failed:', e.message || e);
      }

      // Method B: If no transcript found, use YouTube Data API with YOUTUBE_API_KEY
      if (!transcript && Deno.env.get('YOUTUBE_API_KEY')) {
        try {
          const apiKey = Deno.env.get('YOUTUBE_API_KEY');
          const captionsListRes = await fetch(
            `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${apiKey}`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (captionsListRes.ok) {
            const captionsData = await captionsListRes.json();
            console.log('[kaiLearn] YouTube API captions list:', captionsData.items?.length || 0, 'tracks');
          }
        } catch (e) {
          console.log('[kaiLearn] YouTube API captions failed:', e.message || e);
        }
      }

      // Method C: Fallback to LLM with internet access if no transcript extracted
      if (!transcript || transcript.length < 50) {
        console.log('[kaiLearn] No transcript found, falling back to LLM with internet');
        try {
          const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Watch and thoroughly analyze this YouTube video: ${url}\n\nExtract ALL key information including:\n- Main topics and themes discussed\n- Key facts, data points, and statistics mentioned\n- Names of people, projects, or organizations referenced\n- Technical details and explanations\n- Opinions and predictions shared\n\nBe as detailed and comprehensive as possible. Include direct quotes where relevant.`,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
          });
          content = extracted;
        } catch (e) {
          console.error('LLM extraction also failed:', e.message || e);
          return Response.json({
            success: false,
            error: 'Could not extract video content. Try again in a moment.',
            source_title: sourceTitle,
          });
        }
      } else {
        content = transcript;
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