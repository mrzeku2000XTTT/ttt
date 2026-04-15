// KAI Handlers — all message processing logic (brain, train, build, news, explorer, etc.)

import { base44 } from "@/api/base44Client";
import { TTT_APP_DOCS, KASPA_CONTEXT_BASE } from "./kaiConstants";
import { KAI_DEV_KNOWLEDGE } from "./kaiDevKnowledge";
import {
  isImageRequest, isKaspaNewsRequest, isSearchRequest, isFeedRequest,
  isUserPostRequest, isTrainRequest, isBuildRequest, isBrainRequest,
  isBrowseRequest, isExplorerRequest, detectExplorerAction, detectOpenApp,
  getBrowseUrl, isTTTQuestion, fetchKaspaContext, extractVideoIndex,
  isVibeCodeRequest
} from "./kaiDetectors";

// Load user's learned knowledge for context injection (with timeout)
export const loadLearnedKnowledge = async () => {
  const timeout = new Promise(resolve => setTimeout(() => resolve(''), 3000));
  const work = (async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return '';
      const user = await base44.auth.me();
      const memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
      if (memories.length === 0 || !memories[0].long_term?.length) return '';
      const blocks = memories[0].long_term;
      const summaries = blocks.filter(b => b.metadata?.summary).map(b => `[${b.metadata.source_title}]: ${b.metadata.summary}`);
      const recentChunks = blocks.slice(-10).map(b => b.value).join('\n');
      if (summaries.length === 0) return '';
      return `\n\nYOUR LEARNED KNOWLEDGE (trained by this user):\nSources learned: ${summaries.join(' | ')}\n\nRecent knowledge context:\n${recentChunks.slice(0, 2000)}`;
    } catch { return ''; }
  })();
  return Promise.race([work, timeout]);
};

// Show brain / knowledge base
export const handleShowBrain = async ({ setIsLoading, addAssistantMessage }) => {
  setIsLoading(true);
  try {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      addAssistantMessage("You need to **connect your wallet** for me to remember things across sessions. Connect your TTT wallet and train me! 🧠");
      setIsLoading(false);
      return;
    }
    const user = await base44.auth.me();
    const memories = await base44.entities.AgentMemory.filter({ user_id: user.email });
    if (memories.length === 0 || !memories[0].long_term?.length) {
      addAssistantMessage("My brain is empty for you — I haven't been trained yet! Send me a URL or article and say \"learn this\" to get started. 🧠");
      setIsLoading(false);
      return;
    }
    const blocks = memories[0].long_term;
    const sources = {};
    blocks.forEach(b => {
      const title = b.metadata?.source_title || 'Unknown';
      if (!sources[title]) {
        sources[title] = { title, url: b.metadata?.source_url, type: b.metadata?.source_type, chunks: 0, summary: b.metadata?.summary || '', date: b.stored };
      }
      sources[title].chunks++;
    });
    const list = Object.values(sources).map(s =>
      `• **${s.title}** (${s.type})\n  ${s.chunks} knowledge blocks · ${new Date(s.date).toLocaleDateString()}\n  ${s.summary}`
    ).join('\n\n');
    addAssistantMessage(`🧠 **My Brain — ${blocks.length} knowledge blocks from ${Object.keys(sources).length} sources:**\n\n${list}\n\nAsk me anything about these topics!`);
  } catch {
    addAssistantMessage("Couldn't access my memory right now. Try again! 🧠");
  }
  setIsLoading(false);
};

// Train on URL or text content
export const handleTrainOnContent = async (userMsg, { setMessages, addAssistantMessage, setIsLoading }) => {
  const urlMatch = userMsg.match(/(https?:\/\/[^\s]+)/i);
  const url = urlMatch ? urlMatch[1] : null;
  const rawText = !url ? userMsg.replace(/^(train yourself|train on this|learn this|study this|read this|watch this|ingest this|memorize this|remember this|learn from|train on|study from|read from|learn about this|absorb this)\s*/i, '').trim() : null;

  if (!url && (!rawText || rawText.length < 20)) {
    addAssistantMessage("Send me a URL, article link, YouTube video, or paste some text and say \"learn this\" — I'll process it and add it to my brain. 🧠");
    setIsLoading(false);
    return;
  }

  const isYouTube = url && (url.includes('youtube.com') || url.includes('youtu.be'));
  setMessages(prev => [...prev, { role: "assistant", content: url ? (isYouTube ? "🔍 Fetching YouTube video…" : `🔍 Fetching content from URL…`) : "🧠 Processing your text…" }]);
  await new Promise(r => setTimeout(r, 600));
  setMessages(prev => [...prev, { role: "action", content: url ? `Fetching content from ${url}...` : "Processing your text..." }]);
  await new Promise(r => setTimeout(r, 400));

  try {
    const res = await base44.functions.invoke('kaiLearn', { url, rawText });
    const data = res.data;
    if (!data.success) {
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      addAssistantMessage("❌ Couldn't process that content. Try a different URL or paste the text directly.");
      return;
    }
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    const foundMsg = isYouTube ? `📺 Found: "${data.source_title}"` : `📄 Found: "${data.source_title}" (${data.source_type})`;
    setMessages(prev => [...prev, { role: "action", content: foundMsg }]);
    await new Promise(r => setTimeout(r, 700));
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    setMessages(prev => [...prev, { role: "action", content: `📝 ${isYouTube ? 'Transcript' : 'Content'} extracted — ${data.word_count.toLocaleString()} words` }]);
    await new Promise(r => setTimeout(r, 700));
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    setMessages(prev => [...prev, { role: "action", content: `💾 Stored ${data.chunks_stored} knowledge blocks to memory` }]);
    await new Promise(r => setTimeout(r, 600));
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage(`✅ **Done. I've learned this.**\n\n📄 **${data.source_title}**\n📊 ${data.word_count.toLocaleString()} words → ${data.chunks_stored} knowledge blocks\n💡 ${data.summary}\n\nAsk me anything about it — or say **"now build something based on what you learned"** and I'll write the code.`);
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("❌ Something went wrong while learning that. Try again or paste the text directly.");
  }
};

// Vibe Code — full IDE generation
export const handleVibeCode = async (userMsg, { setMessages, addAssistantMessage, setIsLoading }) => {
  // Step 1: Narrate — calling architect
  setMessages(prev => [...prev, { role: "action", content: "🏗️ Calling KaiArchitect…" }]);
  await new Promise(r => setTimeout(r, 400));

  try {
    // Step 2: Call kaiArchitect
    const archRes = await fetch('https://kaspa-b3ad561a.base44.app/functions/kaiArchitect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: userMsg }),
    });
    const archData = await archRes.json();
    const architectPrompt = archData?.architect_prompt || archData?.prompt || '';

    if (!architectPrompt) {
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      addAssistantMessage("❌ KaiArchitect couldn't plan this app. Try describing what you want in more detail.");
      return;
    }

    // Step 3: Narrate — loading context + planning
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    setMessages(prev => [...prev, { role: "action", content: "📚 Loading Kaspa context + dev knowledge…" }]);
    await new Promise(r => setTimeout(r, 400));
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    setMessages(prev => [...prev, { role: "action", content: "✅ Plan ready — writing full code now…" }]);
    await new Promise(r => setTimeout(r, 400));

    // Step 4: Generate full app code via LLM with FULL dev knowledge
    const codeResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are KAI — a Kaspa-native AI developer agent that vibe codes full apps like Claude Code.

${KAI_DEV_KNOWLEDGE}

## ARCHITECT CONTEXT (from kaiArchitect):
${architectPrompt}

## CRITICAL OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object. No markdown. No code fences. No text before or after. Just the raw JSON.

Return this exact JSON structure:

{
  "app_name": "string — short name",
  "description": "string — 1-2 sentence description",
  "kaspa_apis": ["array of API URLs this app uses"],
  "estimated_time": "string — e.g. '5 minutes'",
  "entities": [
    {
      "name": "EntityName",
      "schema": {
        "type": "object",
        "properties": { ... fields with types ... },
        "required": ["field1"]
      }
    }
  ],
  "pages": [
    {
      "name": "PageName",
      "code": "full JSX code — import { EntityName } from '@/api/entities' — use EntityName.list(), .create(), .filter(), .update(), .delete() — Tailwind dark theme bg-gray-900 + teal-400 accent — mobile-first — complete working code"
    }
  ],
  "functions": [
    {
      "name": "functionName",
      "code": "full Deno function code — import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25'; Deno.serve(async (req) => { ... }); — handle OPTIONS for CORS — use base44.asServiceRole.entities"
    }
  ],
  "deploy_steps": [
    "Entities → New Entity → [name] → paste schema → Save",
    "Pages → New Page → [name] → paste JSX → Save",
    "Functions → New Function → [name] → paste TS → Save & Deploy",
    "Publish App → live ✅"
  ],
  "suggested_upgrades": ["upgrade 1", "upgrade 2", "upgrade 3"]
}

RULES:
- Max 3 entities, 3 pages, 2 functions
- ZERO placeholders. ZERO "// TODO". Complete working code only.
- Every app MUST use at least one live Kaspa API
- Always dark UI: bg-gray-900 body, bg-gray-800 cards, teal-400 accent
- Always mobile-first
- Every response header: "Access-Control-Allow-Origin": "*"
- Entity auto-fields (never add): id, created_date, updated_date, created_by

USER'S APP IDEA: "${userMsg}"

Respond with ONLY the JSON object.`,
      model: 'claude_sonnet_4_6',
    });

    // Step 5: Parse the response
    setMessages(prev => prev.filter(m => m.role !== 'action'));

    let ideData;
    try {
      // Handle string or object response
      if (typeof codeResponse === 'string') {
        // Strip markdown fences if present
        const cleaned = codeResponse.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        ideData = JSON.parse(cleaned);
      } else {
        ideData = codeResponse;
      }
    } catch (parseErr) {
      console.error('IDE parse error:', parseErr, 'Raw:', typeof codeResponse === 'string' ? codeResponse.slice(0, 200) : codeResponse);
      // Fallback: show raw response as a message
      addAssistantMessage("⚠️ Got the code but couldn't structure it into the IDE. Here's the raw output:\n\n" + (typeof codeResponse === 'string' ? codeResponse.slice(0, 3000) : JSON.stringify(codeResponse).slice(0, 3000)));
      return;
    }

    // Step 6: Narrate code generation
    const narrations = [];
    if (ideData.entities?.length) narrations.push(`✍️ Writing ${ideData.entities.length} entity schema${ideData.entities.length > 1 ? 's' : ''}…`);
    if (ideData.pages?.length) narrations.push(`✍️ Writing ${ideData.pages.length} page${ideData.pages.length > 1 ? 's' : ''}…`);
    if (ideData.functions?.length) narrations.push(`✍️ Writing ${ideData.functions.length} function${ideData.functions.length > 1 ? 's' : ''}…`);
    narrations.push("⚡ Injecting Kaspa wallet API…");
    narrations.push("✅ All files ready — check the IDE tabs below");

    for (const line of narrations) {
      setMessages(prev => [...prev, { role: "action", content: line }]);
      await new Promise(r => setTimeout(r, 450));
      setMessages(prev => prev.filter(m => m.role !== 'action'));
    }

    // Step 7: Add IDE panel message
    setMessages(prev => [...prev, { role: "kai_ide", ideData }]);

    // Step 8: Summary message
    const entityList = (ideData.entities || []).map(e => e.name).join(', ');
    const pageList = (ideData.pages || []).map(p => p.name).join(', ');
    const fnList = (ideData.functions || []).map(f => f.name).join(', ');
    const upgrades = ideData.suggested_upgrades || [];

    let summary = `✅ **${ideData.app_name || 'Your app'}** is ready in the IDE above.\n\nIt includes:\n`;
    if (ideData.entities?.length) summary += `• ${ideData.entities.length} entit${ideData.entities.length > 1 ? 'ies' : 'y'}: ${entityList}\n`;
    if (ideData.pages?.length) summary += `• ${ideData.pages.length} page${ideData.pages.length > 1 ? 's' : ''}: ${pageList}\n`;
    if (ideData.functions?.length) summary += `• ${ideData.functions.length} function${ideData.functions.length > 1 ? 's' : ''}: ${fnList}\n`;
    summary += `\nHit the 🚀 Deploy tab for step-by-step instructions.`;
    if (upgrades.length > 0) {
      summary += `\n\nWant me to add:\n${upgrades.map(u => `• ${u}?`).join('\n')}`;
    }

    addAssistantMessage(summary);
  } catch (err) {
    console.error('Vibe code error:', err);
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("❌ Something went wrong building your app. Try again or describe it differently.");
  }
};

// Build / code request
export const handleBuildRequest = async (userMsg, { setMessages, addAssistantMessage }) => {
  setMessages(prev => [...prev, { role: "action", content: "🛠️ Gathering context for build…" }]);
  try {
    const res = await base44.functions.invoke('kaiCode', { task: userMsg });
    const data = res.data;
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    if (data.narration) {
      for (const line of data.narration) {
        setMessages(prev => [...prev, { role: "action", content: line }]);
        await new Promise(r => setTimeout(r, 600));
        setMessages(prev => prev.filter(m => m.role !== 'action'));
      }
    }
    const buildPrompt = `You are Kai — a Kaspa-native AI developer that builds full working code.

${KAI_DEV_KNOWLEDGE}

USER REQUEST: "${userMsg}"

CODE PROMPT FROM KAICODE:
${data.code_prompt || 'No specific prompt available.'}

CONTEXT FROM LEARNED SOURCES:
${(data.context || '').slice(0, 3000)}

SOURCES: ${JSON.stringify(data.sources || [])}

Now write the COMPLETE function code. Show it in a code block. Explain what it does in plain language. Then tell the user exactly where to paste it:
- Function: Functions → New Function → camelCase name → paste TS → Save & Deploy
- Entity: Entities → New Entity → PascalCase name → paste schema → Save
- Page: Pages → New Page → name → paste JSX → Save

After writing, offer 3 specific upgrades the user can ask for.`;
    const response = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt, model: 'gemini_3_flash' });
    addAssistantMessage(response);
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("❌ Couldn't prepare the build context. Try describing what you want to build in more detail.");
  }
};

// Kaspa video posts — uses feed=videos from kaspaContext
export const handleKaspaVideos = async ({ setMessages, addAssistantMessage }) => {
  setMessages(prev => [...prev, { role: "action", content: "🎬 Fetching latest Kaspa videos…" }]);
  try {
    const res = await fetch(`${KASPA_CONTEXT_BASE}?feed=videos&format=feed&limit=5`);
    const text = await res.text();
    
    // Also fetch JSON for structured card display
    const jsonRes = await fetch(`${KASPA_CONTEXT_BASE}?feed=videos&format=json&limit=5`);
    const jsonData = await jsonRes.json();
    const videos = jsonData?.items || (Array.isArray(jsonData) ? jsonData : []);
    
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    
    if (videos.length > 0) {
      // Show video cards
      setMessages(prev => [...prev, {
        role: "video_posts",
        content: `📺 Latest Kaspa Videos · live from kaspa.news`,
        videos: videos,
      }]);
      // Follow-up offer to ingest
      addAssistantMessage("Want me to watch one and learn from it? Just say **\"watch the first one\"** or **\"watch that\"** and I'll extract the transcript into my brain. 🧠");
    } else {
      addAssistantMessage("Couldn't find any Kaspa videos right now. Try again later! 🎬");
    }
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("❌ Couldn't fetch Kaspa videos. Try again!");
  }
};

// "Watch that" / "learn from that" — ingest a video from the last video feed
export const handleWatchThat = async (userMsg, messages, { setMessages, addAssistantMessage }) => {
  // Check if user is connected — ingestion requires auth for memory storage
  try {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      addAssistantMessage("You need to **connect your wallet** for me to watch and learn videos — I store the knowledge in your personal brain. Connect your TTT wallet and try again! 🧠");
      return;
    }
  } catch {
    addAssistantMessage("You need to **connect your wallet** for me to watch and learn videos. Connect your TTT wallet and try again! 🧠");
    return;
  }

  // Find the last video_posts message to get the URL
  const lastVideoMsg = [...messages].reverse().find(m => m.role === "video_posts");
  if (!lastVideoMsg || !lastVideoMsg.videos?.length) {
    addAssistantMessage("I don't see any videos in our conversation. Say **\"latest video\"** first and I'll fetch them, then you can tell me which to watch. 📺");
    return;
  }

  const idx = extractVideoIndex(userMsg);
  const video = lastVideoMsg.videos[Math.min(idx, lastVideoMsg.videos.length - 1)];
  const videoUrl = video.url;
  const videoTitle = video.text || video.title || "Untitled";

  if (!videoUrl) {
    addAssistantMessage("That video doesn't have a URL I can ingest. Try another one.");
    return;
  }

  // Narrate the ingestion flow
  setMessages(prev => [...prev, { role: "action", content: `🔍 Fetching video…` }]);
  await new Promise(r => setTimeout(r, 500));
  setMessages(prev => prev.filter(m => m.role !== 'action'));
  setMessages(prev => [...prev, { role: "action", content: `📺 Found: "${videoTitle}"` }]);
  await new Promise(r => setTimeout(r, 600));

  try {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    setMessages(prev => [...prev, { role: "action", content: `🧠 Analyzing video content with AI…` }]);

    const res = await base44.functions.invoke('kaiLearn', { url: videoUrl });
    const data = res.data;

    setMessages(prev => prev.filter(m => m.role !== 'action'));

    if (data?.success) {
      setMessages(prev => [...prev, { role: "action", content: `💾 Stored ${data.chunks_stored || 0} knowledge blocks` }]);
      await new Promise(r => setTimeout(r, 600));
      setMessages(prev => prev.filter(m => m.role !== 'action'));

      addAssistantMessage(
        `✅ **Done. I've watched and learned this video.**\n\n` +
        `📺 **${data.source_title || videoTitle}**\n` +
        `📊 ${(data.word_count || 0).toLocaleString()} words → ${data.chunks_stored || 0} knowledge blocks\n` +
        `💡 ${data.summary || 'Video ingested successfully.'}\n\n` +
        `Ask me anything about it — like **"what did he say about X?"**\n` +
        `Or say **"build something based on that"** and I'll write the code. 🛠️`
      );
    } else {
      const errorMsg = data?.error || "Couldn't extract content from that video.";
      addAssistantMessage(`❌ ${errorMsg} Try another video or try again in a moment.`);
    }
  } catch (err) {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    console.error('Watch that error:', err);
    addAssistantMessage("❌ Something went wrong while ingesting that video. The AI service may be busy — try again in a moment!");
  }
};

// Generic feed handler — for builders, developers, reddit, pulse feeds
export const handleFeedRoute = async (feedName, { setMessages, addAssistantMessage }) => {
  const feedLabels = {
    focused: '📰 Latest Kaspa Posts',
    builders: '🏗️ Kaspa Builders & Ecosystem',
    developers: '💻 Kaspa Developer Updates',
    reddit: '💬 Kaspa Reddit Discussions',
    pulse: '📊 Kaspa AI Pulse Report',
  };
  const label = feedLabels[feedName] || `📡 ${feedName}`;
  
  setMessages(prev => [...prev, { role: "action", content: `Fetching ${label}…` }]);
  try {
    const res = await fetch(`${KASPA_CONTEXT_BASE}?feed=${feedName}&format=json&limit=5`);
    const data = await res.json();
    const posts = data?.items || (Array.isArray(data) ? data : []);
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    
    if (posts.length > 0) {
      setMessages(prev => [...prev, {
        role: "news_posts",
        content: `${label} · live from kaspa.news`,
        posts: posts,
      }]);
    } else {
      addAssistantMessage(`No ${feedName} posts found right now. Try again later!`);
    }
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage(`❌ Couldn't fetch ${feedName} feed. Try again!`);
  }
};

// Kaspa news posts — uses feed=focused from kaspaContext
export const handleKaspaNews = async ({ setMessages, addAssistantMessage }) => {
  setMessages(prev => [...prev, { role: "action", content: "📡 Fetching latest Kaspa posts…" }]);
  try {
    const res = await fetch(`${KASPA_CONTEXT_BASE}?feed=focused&format=json&limit=5`);
    const data = await res.json();
    const posts = data?.items || (Array.isArray(data) ? data : []);
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    if (posts.length > 0) {
      setMessages(prev => [...prev, {
        role: "news_posts",
        content: `📰 Latest Kaspa Posts · live from kaspa.news`,
        posts: posts,
      }]);
    } else {
      addAssistantMessage("Couldn't find any recent Kaspa posts right now. Try again later! 📰");
    }
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("❌ Couldn't fetch Kaspa news posts. Try again!");
  }
};

// Explorer / blockchain lookup
export const handleExplorerRequest = async (userMsg, { setMessages, addAssistantMessage, speedInstruction }) => {
  const explorerAction = detectExplorerAction(userMsg);
  if (!explorerAction) return false;
  setMessages(prev => [...prev, { role: "action", content: "🔍 Querying Kaspa blockchain…" }]);
  try {
    const res = await base44.functions.invoke('kaspaExplorer', explorerAction);
    const data = res.data;
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    if (data.error) {
      addAssistantMessage(`❌ ${data.error}`);
    } else {
      const formatted = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KAI, the Kaspa AI assistant. A user asked to look up blockchain data. Format the result as a CLEAR SUMMARY with these rules:

1. Start with a one-line summary (e.g. "This transaction sent X KAS from address A to address B")
2. Show key details in a clean format:
   - For transactions: status (accepted/pending), total KAS moved, number of inputs → outputs, block time, and a breakdown of where KAS went
   - For addresses: balance, total tx count, recent activity
   - For network: price, hashrate, supply, difficulty
3. Always include the explorer link at the bottom as: [View on Kaspa Explorer](url)
4. Use emojis sparingly. Amounts should show KAS units with reasonable decimal places.
5. If there are multiple outputs, list the top ones clearly showing address (truncated) → amount

Data:
${JSON.stringify(data, null, 2)}${speedInstruction}`,
      });
      addAssistantMessage(formatted);
    }
  } catch (err) {
    console.error('Explorer error:', err);
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("Couldn't query the blockchain right now. Try again! 🙏");
  }
  return true;
};

// Extract a search keyword/username from user message
export const extractSearchKeyword = (msg) => {
  const patterns = [
    /what did @?(\S+) (say|post|write|tweet)/i,
    /what has @?(\S+) (said|posted|written|tweeted)/i,
    /what does @?(\S+) (say|post|think|write)/i,
    /what is @?(\S+) (saying|posting|writing|tweeting)/i,
    /what are @?(\S+) (saying|posting|writing|tweeting)/i,
    /posts? (?:by|from) @?(\S+)/i,
    /show (?:me )?posts? (?:by|from) @?(\S+)/i,
    /check @?(\S+?)['']?s? posts/i,
    /latest (?:from|by) @?(\S+)/i,
    /find (?:posts? (?:by|from|about)|what) @?(\S+)/i,
    /any (?:posts?|news|updates) (?:from|by|about) @?(\S+)/i,
    /@(\S+)/,
  ];
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const keyword = match[1].replace(/[@'"?!.,]/g, '').trim();
      if (keyword.length > 1) return keyword;
    }
  }
  // Also try to extract topic keywords like "posts about Toccata", "news about KRC-20"
  const topicPatterns = [
    /(?:posts?|news|updates|info) about (.+?)(?:\?|$)/i,
    /what's being said about (.+?)(?:\?|$)/i,
    /what are people saying about (.+?)(?:\?|$)/i,
  ];
  for (const pattern of topicPatterns) {
    const match = msg.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
};

// User post analysis — searches kaspaContext backend + local TTT feed
export const handleUserPostAnalysis = async (userMsg, { setMessages, addAssistantMessage, isFast, speedInstruction }) => {
  setMessages(prev => [...prev, { role: "action", content: "🔍 Searching posts…" }]);

  const keyword = extractSearchKeyword(userMsg);
  let kaspaContextPosts = '';
  let tttFeedPosts = '';

  try {
    // 1. Search kaspaContext backend with q= param (external Kaspa news/X posts)
    if (keyword) {
      setMessages(prev => {
        const filtered = prev.filter(m => m.role !== 'action');
        return [...filtered, { role: "action", content: `🔍 Searching kaspa.news for "${keyword}"…` }];
      });
      try {
        const res = await fetch(`${KASPA_CONTEXT_BASE}?q=${encodeURIComponent(keyword)}&format=feed&limit=10`);
        if (res.ok) {
          const text = await res.text();
          if (text.trim() && !text.includes('No results')) {
            kaspaContextPosts = text.trim();
          }
        }
      } catch { /* kaspaContext search failed, continue */ }
    }

    // 2. Also search local TTT feed posts
    setMessages(prev => {
      const filtered = prev.filter(m => m.role !== 'action');
      return [...filtered, { role: "action", content: `🔍 Searching TTT feed…` }];
    });
    const allPosts = await base44.entities.Post.list('-created_date', 50);
    let relevantPosts = allPosts;
    if (keyword) {
      const kw = keyword.toLowerCase();
      const filtered = allPosts.filter(p =>
        p.author_name?.toLowerCase().includes(kw) ||
        p.created_by?.toLowerCase().includes(kw) ||
        p.content?.toLowerCase().includes(kw)
      );
      if (filtered.length > 0) relevantPosts = filtered;
    }
    tttFeedPosts = relevantPosts.slice(0, 20).map(p =>
      `[${p.author_name}] ${p.content?.slice(0, 200)} (${p.likes || 0} likes, ${new Date(p.created_date).toLocaleDateString()})`
    ).join('\n');

    // 3. Combine and send to LLM
    const combinedContext = [
      kaspaContextPosts ? `=== KASPA NEWS / X POSTS (from kaspa.news) ===\n${kaspaContextPosts}` : '',
      tttFeedPosts ? `=== TTT COMMUNITY FEED POSTS ===\n${tttFeedPosts}` : '',
    ].filter(Boolean).join('\n\n');

    if (!combinedContext.trim()) {
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      addAssistantMessage(keyword
        ? `I searched both kaspa.news and the TTT feed for "${keyword}" but couldn't find any matching posts. Try a different name or keyword.`
        : "I couldn't find any relevant posts. Try being more specific about who or what you're looking for."
      );
      return;
    }

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are KAI, the AI assistant of TTT — the Kaspa Super-App.

The user asked: "${userMsg}"
${keyword ? `Search keyword: "${keyword}"` : ''}

Here are the actual posts found:

${combinedContext}

RULES:
- Answer ONLY based on the actual posts above. Do NOT make up or hallucinate content.
- Quote the actual post content when referencing what someone said.
- Include the author (@username), date, and engagement stats when available.
- If showing X/Twitter posts, include the link if available.
- Be specific. Cite exact text from the posts.
- Distinguish between kaspa.news/X posts and TTT community feed posts.${speedInstruction}`,
      model: 'gemini_3_flash',
    });
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage(analysis);
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("Couldn't search posts right now. Try again! 🙏");
  }
};

// Feed summary
export const handleFeedSummary = async (userMsg, { setMessages, addAssistantMessage, isFast, speedInstruction }) => {
  if (!isFast) setMessages(prev => [...prev, { role: "action", content: "Checking TTT Feed... 📡" }]);
  try {
    const posts = await base44.entities.Post.list('-created_date', isFast ? 10 : 20);
    const feedSummary = posts.map(p => `- ${p.author_name}: ${p.content?.slice(0, isFast ? 60 : 120)}`).join('\n');
    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: `You are KAI, the AI assistant of TTT — the Kaspa Super-App (NOT "Trust The Tech"). TTT is a community platform with Feed, Agent ZK, TTTV, Bridge, StakeDAG, and 80+ apps. Here are recent posts from the TTT feed:\n\n${feedSummary}\n\nProvide a summary of what the community is talking about.${speedInstruction}`,
      add_context_from_internet: !isFast,
      model: 'gemini_3_flash',
    });
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage(summary);
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("Couldn't load the feed right now. Try again! 🙏");
  }
};

// General LLM message with context
export const handleGeneralMessage = async (userMsg, imageUrls, imageNames, messages, {
  addAssistantMessage, isFast, speedInstruction, kaiMode, isSearchRequest: isSearch
}) => {
  let liveKaspaContext = '';
  let learnedKnowledge = '';
  let feedContext = '';

  const lower = userMsg.toLowerCase();
  const isPriceOrMarket = ['price', 'market', 'worth', 'cost', 'how much', 'usd', 'dollar', 'mcap', 'market cap', 'ath', 'volume'].some(kw => lower.includes(kw));
  // Only fetch community feed when user explicitly asks about feed/community/posts
  const wantsFeedContext = ['feed', 'community', 'posts', 'what are people', 'what is everyone', 'trending', 'whats new', "what's new", 'ttt feed', 'recent posts'].some(kw => lower.includes(kw));

  // Always fetch real price data for price queries — never let LLM guess
  let livePriceBlock = '';
  const fetchLivePrice = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
      if (res.ok) {
        const data = await res.json();
        const kas = data?.kaspa;
        if (kas) {
          const price = kas.usd;
          const change = kas.usd_24h_change;
          const mcap = kas.usd_market_cap;
          const vol = kas.usd_24h_vol;
          livePriceBlock = `\n\n⚡ LIVE KAS PRICE DATA (from CoinGecko, fetched just now — use THESE exact numbers, do NOT make up different ones):\n- Price: $${price}\n- 24h Change: ${change >= 0 ? '+' : ''}${change?.toFixed(2)}%\n- Market Cap: $${mcap ? (mcap / 1e9).toFixed(2) + 'B' : 'N/A'}\n- 24h Volume: $${vol ? (vol / 1e6).toFixed(1) + 'M' : 'N/A'}\n`;
        }
      }
    } catch {}
  };

  // Build promises — only fetch feed context when user actually asks about the feed
  const promises = [loadLearnedKnowledge()];
  if (isPriceOrMarket) promises.push(fetchLivePrice());
  if (wantsFeedContext) promises.push(fetchKaspaContext(userMsg));
  if (wantsFeedContext && !isFast) promises.push(base44.entities.Post.list('-created_date', 15).catch(() => []));

  const results = await Promise.all(promises);
  learnedKnowledge = results[0];
  // Parse optional results based on what was requested
  let resultIdx = 1;
  if (isPriceOrMarket) resultIdx++; // fetchLivePrice doesn't return — it sets livePriceBlock
  if (wantsFeedContext) {
    liveKaspaContext = results[resultIdx++] || '';
    if (!isFast && results[resultIdx]) {
      const posts = results[resultIdx];
      if (posts?.length > 0) {
        feedContext = `\n\nRecent TTT Feed activity:\n${posts.map(p => `- ${p.author_name}: ${p.content?.slice(0, 80)}`).join('\n')}`;
      }
    }
  }

  const context = messages.slice(isFast ? -4 : -8).map(m => `${m.role === "user" ? "User" : "KAI"}: ${m.content}`).join("\n");
  const imageContext = imageUrls.length > 0
    ? `\n\nThe user has uploaded ${imageUrls.length} image(s)${imageNames.length ? ` (${imageNames.join(', ')})` : ''}. Analyze the image(s) thoroughly — describe what you see, extract any text, identify objects/charts/documents, and provide useful insights. If it's a chart or data, interpret it. If it's a screenshot, explain what it shows. If it's a document, summarize the content. Share your analysis so all users can learn from it.`
    : '';

  const priceBlock = livePriceBlock ? `${livePriceBlock}\n\n---\n\n` : '';
  const supplementaryContext = (wantsFeedContext && liveKaspaContext) ? `\n\n---\nCOMMUNITY FEED (user asked about this):\n${liveKaspaContext}` : '';

  const classicPrompt = `${priceBlock}You are **Kai** — the intelligent AI agent embedded inside TapToTip (TTT), the Kaspa-native app ecosystem at tttz.xyz.

You are not a generic chatbot. You are Kaspa-native, self-training, and you can **read, learn, and then build real things** based on what you've learned.${learnedKnowledge}

## ⚠️ CRITICAL ANSWERING RULES
- ALWAYS answer questions using your REAL AI KNOWLEDGE and INTERNET SEARCH first.
- Do NOT answer questions by quoting random community feed posts. Feed posts are supplementary context only.
- For factual questions ("what is kaspa", "kaspa price", etc.) — use your trained knowledge, verified facts below, and live internet data.
- ONLY reference community feed posts when the user specifically asks about the feed, community activity, or what people are saying.
- If you have live price data above, use THOSE EXACT numbers. Never guess or approximate prices.

## 📋 BASE44 FUNCTION RULES
\`\`\`
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    return Response.json({ result: "..." }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
\`\`\`

${TTT_APP_DOCS}

## 🎯 PERSONALITY
- Warm, sharp, direct. Brilliant friend, not corporate bot.
- Short by default. Deep when asked.
- No filler. No "Great question!" Ever.
- You root for Kaspa and TTT.

## ⚠️ HARD RULES
- Never hallucinate prices or chain data — only use live data provided above.
- You are Kai. Always.${feedContext}${supplementaryContext}

Conversation so far:
${context}

User: ${userMsg}${imageContext}

Respond as Kai:${speedInstruction}`;

  const kaiPrompt = `${priceBlock}You are KAI, the AI assistant of TTT — the Kaspa Super-App.${learnedKnowledge}

## ⚠️ CRITICAL ANSWERING RULES
- ALWAYS answer questions using your REAL AI KNOWLEDGE and INTERNET SEARCH first.
- Do NOT answer questions by quoting random community feed posts. Feed posts are supplementary context only.
- For factual questions ("what is kaspa", "kaspa price", etc.) — use your trained knowledge, verified facts below, and live internet data.
- ONLY reference community feed posts when the user specifically asks about the feed, community activity, or what people are saying.
- If you have live price data above, use THOSE EXACT numbers.

CRITICAL IDENTITY — WHAT IS TTT:
TTT is a Kaspa community super-app platform. It is NOT "Trust The Tech." TTT is the NAME of this application. The tagline is "Unchain Humanity."

${TTT_APP_DOCS}

KASPA BLOCKCHAIN ORACLE FACTS (verified from kaspa.org):
- Kaspa uses blockDAG (Directed Acyclic Graph) architecture — NOT a traditional blockchain
- Multiple blocks are created in parallel and all are included in the ledger
- GHOSTDAG protocol (upgrading to DAGKnight) provides consensus ordering of all blocks
- Kaspa has already reached 10 BPS (blocks per second) — this is LIVE on mainnet
- 32 BPS is the next target on the roadmap
- kHeavyHash Proof-of-Work algorithm — GPU mineable, designed for optical mining ASICs
- 100% fair launch: ZERO premine, ZERO ICO, ZERO VC funding, fully community-driven
- Rusty Kaspa: full node rewrite in Rust is complete and live on mainnet
- KRC-20 token standard powers fungible tokens on Kaspa via Kasplex
- Founded on academic research by Yonatan Sompolinsky (co-author of GHOST protocol used in Ethereum)
- Smart contracts (currently in development) will bring DeFi to Kaspa
- Sub-second block times with near-instant visual confirmation
- DAGKnight consensus upgrade will provide the most advanced PoW consensus ever built

IMPORTANT: Always use these verified facts. Do NOT say Kaspa "targets" or "plans" 10 BPS — it already runs at 10 BPS.

Be concise, accurate, friendly. Use emojis occasionally.${feedContext}${supplementaryContext}

Conversation so far:
${context}

User: ${userMsg}${imageContext}

Respond as KAI:${speedInstruction}`;

  // Almost always use internet — only skip for pure TTT platform questions in fast mode
  const needsInternet = true;
  const searchPrefix = isSearch ? `The user is performing a web search. Use your real-time internet access to find the most accurate, up-to-date information. Search thoroughly like Google would. Give comprehensive results with facts, sources, and details.\n\n` : '';
  
  const llmParams = {
    prompt: searchPrefix + (kaiMode === "classic" ? classicPrompt : kaiPrompt),
    add_context_from_internet: needsInternet,
    model: "gemini_3_flash",
  };
  if (imageUrls.length > 0) {
    llmParams.file_urls = imageUrls;
  }
  const response = await base44.integrations.Core.InvokeLLM(llmParams);
  addAssistantMessage(response);
};