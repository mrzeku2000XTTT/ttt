import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
  });
  try {
    const base44 = createClientFromRequest(req);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const reqUrl = new URL(req.url);
    const url = body.url || reqUrl.searchParams.get("url") || "";
    const save = body.save !== false;

    if (!url) {
      return Response.json({ error: "No URL provided" }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // Fetch page
    let html = '';
    let title = url;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(12000),
        redirect: 'follow',
      });
      if (res.ok) {
        html = await res.text();
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
        if (titleMatch) title = titleMatch[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
      }
    } catch (e) {
      console.log('Direct fetch failed:', e.message);
    }

    // Extract text content
    let content = '';
    if (html.length > 200) {
      content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    // Use LLM with internet as fallback or to enhance
    if (content.length < 200) {
      try {
        const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Extract all key information, facts, and content from this URL: ${url}\n\nBe thorough and detailed. Include all important points.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
        });
        content = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
      } catch (e) {
        console.log('LLM fallback failed:', e.message);
      }
    }

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    // Generate summary
    let summary = '';
    try {
      summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Summarize in one sentence (max 25 words):\n${content.slice(0, 3000)}`,
        model: 'gemini_3_flash',
      });
    } catch { summary = `Content from ${title}`; }

    // Save to AgentMemory if requested
    let saved = false;
    let chunks_stored = 0;
    if (save && content.length > 100) {
      try {
        const user = await base44.auth.me();
        if (user) {
          const chunkSize = 500;
          const words = content.split(/\s+/);
          const chunks = [];
          for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
          }
          const now = Date.now();
          const knowledgeBlocks = chunks.map((chunk, i) => ({
            key: `browse:${title.slice(0,50)}:chunk_${i}`,
            value: chunk,
            metadata: {
              source_url: url,
              source_title: title,
              source_type: 'webpage',
              chunk_index: i,
              total_chunks: chunks.length,
              summary: i === 0 ? (typeof summary === 'string' ? summary : '') : undefined,
            },
            stored: now,
            accessed: now,
            access_count: 0,
          }));

          const memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
          if (memories.length > 0) {
            const combined = [...(memories[0].long_term || []), ...knowledgeBlocks].slice(-200);
            await base44.entities.AgentMemory.update(memories[0].id, { long_term: combined });
          } else {
            await base44.entities.AgentMemory.create({
              user_id: user.email,
              long_term: knowledgeBlocks,
              short_term: [],
              episodic: [],
            });
          }
          saved = true;
          chunks_stored = chunks.length;
        }
      } catch (e) {
        console.log('Save to memory failed:', e.message);
      }
    }

    return Response.json({
      success: true,
      url,
      title,
      word_count: wordCount,
      summary,
      content: content.slice(0, 10000),
      saved,
      chunks_stored,
    }, { headers: { "Access-Control-Allow-Origin": "*" } });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});