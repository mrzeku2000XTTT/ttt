import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { task } = body;

    if (!task) {
      return Response.json({ error: 'No task provided' }, { status: 400 });
    }

    // Load user's learned knowledge for context
    let context = '';
    let sources = [];
    try {
      const memories = await base44.asServiceRole.entities.AgentMemory.filter({ user_id: user.email });
      if (memories.length > 0 && memories[0].long_term?.length) {
        const blocks = memories[0].long_term;
        const sourceMap = {};
        blocks.forEach(b => {
          const title = b.metadata?.source_title || 'Unknown';
          if (!sourceMap[title]) {
            sourceMap[title] = {
              title,
              url: b.metadata?.source_url,
              type: b.metadata?.source_type,
              summary: b.metadata?.summary || ''
            };
          }
        });
        sources = Object.values(sourceMap);
        const relevantChunks = blocks.slice(-15).map(b => b.value);
        context = relevantChunks.join('\n\n');
      }
    } catch (e) {
      console.log('Could not load memories:', e.message);
    }

    const base44Rules = `## BASE44 BACKEND FUNCTION RULES

Every function must follow this exact pattern:

\`\`\`javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Your logic here

    return Response.json({ result: "..." }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
\`\`\`

KEY RULES:
- Use Deno.serve, NOT export default
- Use npm: prefix for all imports (e.g. npm:@base44/sdk@0.8.25)
- Use fetch() for HTTP calls (NOT axios)
- Use base44.asServiceRole.entities.EntityName for entity operations
- Return Response.json() always
- Add CORS headers
- No local file imports — each function is standalone

AVAILABLE ENTITIES:
- base44.asServiceRole.entities.KaspaNewsItem — { tweet_id, feed, author_username, text, url, likes, reposts, views, published_at }
- base44.asServiceRole.entities.KaiTranscript — { video_id, url, title, transcript, word_count, status }
- base44.asServiceRole.entities.AgentMemory — { user_id, long_term (array of knowledge blocks) }

USEFUL APIs:
- KAS price: GET https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true
- Kaspa news context: GET https://kaspa-b3ad561a.base44.app/functions/kaspaContext?format=json&limit=20
- Kaspa explorer: GET https://api.kaspa.org/info/...`;

    const codePrompt = `BUILD TASK: ${task}

SOURCES AVAILABLE (learned by Kai):
${sources.map(s => `- ${s.title} (${s.type}): ${s.summary}`).join('\n') || 'No sources ingested yet.'}

CONTEXT FROM LEARNED CONTENT:
${context.slice(0, 4000) || 'No learned content available yet.'}

Write a complete, deployable Base44 backend function for this task. Follow the Base44 rules exactly. Use the learned context to inform your implementation.`;

    const narration = [
      `🛠️ Building: "${task}"`,
      sources.length > 0 ? `📚 Found ${sources.length} learned source(s) for context` : '📭 No learned sources yet — building from scratch',
      '⚙️ Generating code...',
    ];

    return Response.json({
      code_prompt: codePrompt,
      context: context.slice(0, 4000),
      base44_rules: base44Rules,
      sources,
      narration,
      success: true
    }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});