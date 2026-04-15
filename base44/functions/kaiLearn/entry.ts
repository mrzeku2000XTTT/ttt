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

      if (isXPost) {
        // Extract tweet ID from URL
        const tweetIdMatch = url.match(/status\/(\d+)/);
        const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
        const authorHandle = url.match(/(?:x\.com|twitter\.com)\/(\w+)\/status/)?.[1] || 'unknown';
        sourceTitle = `X post from @${authorHandle}`;

        if (tweetId) {
          // Try X API first (most reliable)
          const xApiKey = Deno.env.get('X_API_KEY');
          if (xApiKey) {
            try {
              // Try Bearer token auth first, then Basic auth
              const tweetRes = await fetch(
                `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=text,author_id,created_at,public_metrics,entities,referenced_tweets&expansions=author_id,referenced_tweets.id&user.fields=name,username`,
                { headers: { 'Authorization': `Bearer ${xApiKey}` }, signal: AbortSignal.timeout(10000) }
              );
              if (tweetRes.ok) {
                const tweetData = await tweetRes.json();
                const tweet = tweetData.data;
                const authorUser = tweetData.includes?.users?.find(u => u.id === tweet.author_id);
                const authorName = authorUser ? `${authorUser.name} (@${authorUser.username})` : `@${authorHandle}`;
                sourceTitle = `X post from ${authorName}`;

                let postContent = `Author: ${authorName}\n\nFull text:\n${tweet.text}`;

                // Add engagement stats
                if (tweet.public_metrics) {
                  const m = tweet.public_metrics;
                  postContent += `\n\nEngagement: ${m.like_count || 0} likes, ${m.retweet_count || 0} reposts, ${m.reply_count || 0} replies, ${m.impression_count || 0} views`;
                }

                // Add referenced tweets (quotes, replies)
                if (tweetData.includes?.tweets?.length > 0) {
                  for (const ref of tweetData.includes.tweets) {
                    const refAuthor = tweetData.includes?.users?.find(u => u.id === ref.author_id);
                    postContent += `\n\nReferenced tweet by ${refAuthor ? `${refAuthor.name} (@${refAuthor.username})` : 'unknown'}:\n${ref.text}`;
                  }
                }

                postContent += `\n\nSource: ${url}`;
                if (tweet.created_at) postContent += `\nPosted: ${new Date(tweet.created_at).toLocaleString()}`;

                content = postContent;
                console.log(`X API success: ${content.length} chars from tweet ${tweetId}`);
              } else {
                console.log(`X API returned ${tweetRes.status}, falling back to LLM`);
              }
            } catch (e) {
              console.log(`X API failed: ${e.message}, falling back to LLM`);
            }
          }
        }

        // Fallback 1: Try fxtwitter API (free, no auth needed)
        if (!content && tweetId) {
          try {
            const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
              headers: { 'User-Agent': 'KAI/1.0' },
              signal: AbortSignal.timeout(10000),
            });
            if (fxRes.ok) {
              const fxData = await fxRes.json();
              const tw = fxData.tweet;
              if (tw?.text) {
                const authorName = tw.author?.name ? `${tw.author.name} (@${tw.author.screen_name || authorHandle})` : `@${authorHandle}`;
                sourceTitle = `X post from ${authorName}`;
                let postContent = `Author: ${authorName}\n\nFull text:\n${tw.text}`;
                if (tw.likes || tw.retweets || tw.replies) {
                  postContent += `\n\nEngagement: ${tw.likes || 0} likes, ${tw.retweets || 0} reposts, ${tw.replies || 0} replies`;
                }
                if (tw.created_at) postContent += `\nPosted: ${tw.created_at}`;
                postContent += `\n\nSource: ${url}`;
                content = postContent;
                console.log(`fxtwitter API success: ${content.length} chars`);
              }
            } else {
              console.log(`fxtwitter returned ${fxRes.status}`);
            }
          } catch (e) {
            console.log(`fxtwitter failed: ${e.message}`);
          }
        }

        // Fallback 2: Try vxtwitter API
        if (!content && tweetId) {
          try {
            const vxRes = await fetch(`https://api.vxtwitter.com/status/${tweetId}`, {
              headers: { 'User-Agent': 'KAI/1.0' },
              signal: AbortSignal.timeout(10000),
            });
            if (vxRes.ok) {
              const vxData = await vxRes.json();
              if (vxData.text) {
                sourceTitle = `X post from @${vxData.user_name || authorHandle}`;
                content = `Author: ${vxData.user_name || authorHandle}\n\nFull text:\n${vxData.text}\n\nEngagement: ${vxData.likes || 0} likes, ${vxData.retweets || 0} reposts, ${vxData.replies || 0} replies\n\nSource: ${url}`;
                console.log(`vxtwitter API success: ${content.length} chars`);
              }
            }
          } catch (e) {
            console.log(`vxtwitter failed: ${e.message}`);
          }
        }

        // Fallback 3: LLM with internet (last resort)
        if (!content) {
          try {
            const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `Go to this exact URL and read the tweet/post: ${url}\n\nCopy the EXACT full text of the tweet word-for-word. Include author handle, engagement stats, and any links. Do NOT paraphrase or add opinions. If you cannot access it, say "COULD NOT ACCESS POST".`,
              add_context_from_internet: true,
              model: 'gemini_3_flash',
            });
            content = extracted;
          } catch (e) {
            console.error('LLM extraction failed for X post:', e.message || e);
            return Response.json({ success: false, error: 'Could not read the X post. Try again.', source_title: sourceTitle });
          }
        }
      } else {
        // Regular article/webpage
        let html = '';
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
          // Direct fetch failed
        }

        try {
          const prompt = html.length > 200
            ? `Extract the EXACT text content from this webpage. Copy the actual words — do NOT paraphrase. Include all links and references. URL: ${url}\n\nRaw HTML (first 15000 chars):\n${html.slice(0, 15000)}`
            : `Go to this URL and extract the EXACT text content: ${url}\n\nCopy the actual words written on the page word-for-word. Include all links and references mentioned. Do NOT paraphrase.`;

          const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
          });
          content = extracted;
          if (!sourceTitle || sourceTitle === url) {
            sourceTitle = url.replace(/^https?:\/\//, '').split('/')[0];
          }
        } catch (e) {
          console.error('LLM extraction failed for URL:', e.message || e);
          return Response.json({ success: false, error: 'Could not extract content. Try again.', source_title: sourceTitle || url });
        }
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