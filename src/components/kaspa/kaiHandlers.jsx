// KAI Handlers — all message processing logic (brain, train, build, news, explorer, etc.)

import { base44 } from "@/api/base44Client";
import { TTT_APP_DOCS, KASPA_CONTEXT_BASE } from "./kaiConstants";
import {
  isImageRequest, isKaspaNewsRequest, isSearchRequest, isFeedRequest,
  isUserPostRequest, isTrainRequest, isBuildRequest, isBrainRequest,
  isBrowseRequest, isExplorerRequest, detectExplorerAction, detectOpenApp,
  getBrowseUrl, isTTTQuestion, fetchKaspaContext, extractVideoIndex,
  extractUrl
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

// kaiBrowse — open any non-YouTube, non-X URL, scrape + save to knowledge
export const handleKaiBrowse = async (userMsg, { setMessages, addAssistantMessage, speedInstruction }) => {
  const url = extractUrl(userMsg);
  if (!url) {
    addAssistantMessage("I couldn't find a URL in your message. Paste a link and I'll browse it for you. 🌐");
    return;
  }

  setMessages(prev => [...prev, { role: "action", content: "🌐 Opening browser…" }]);
  await new Promise(r => setTimeout(r, 400));
  setMessages(prev => {
    const filtered = prev.filter(m => m.role !== 'action');
    return [...filtered, { role: "action", content: `🔍 Navigating to: ${url}` }];
  });

  try {
    const res = await fetch('https://kaspa-b3ad561a.base44.app/functions/kaiBrowse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, save: true }),
    });
    const data = await res.json();

    setMessages(prev => prev.filter(m => m.role !== 'action'));

    if (data.error) {
      addAssistantMessage(`❌ Couldn't browse that page: ${data.error}`);
      return;
    }

    const title = data.title || 'Unknown Page';
    const wordCount = data.word_count || data.wordCount || 0;
    const saved = data.saved || data.chunks_stored;
    const summary = data.summary || '';
    const content = data.content || data.text || '';

    // Show narration steps
    setMessages(prev => [...prev, { role: "action", content: `📄 Page loaded: "${title}"` }]);
    await new Promise(r => setTimeout(r, 500));
    setMessages(prev => {
      const filtered = prev.filter(m => m.role !== 'action');
      return [...filtered, { role: "action", content: `📝 Extracted ${wordCount.toLocaleString()} words` }];
    });
    await new Promise(r => setTimeout(r, 500));
    if (saved) {
      setMessages(prev => {
        const filtered = prev.filter(m => m.role !== 'action');
        return [...filtered, { role: "action", content: `🧠 Saved to knowledge base` }];
      });
      await new Promise(r => setTimeout(r, 500));
    }
    setMessages(prev => prev.filter(m => m.role !== 'action'));

    // Summarize with LLM
    const llmSummary = await base44.integrations.Core.InvokeLLM({
      prompt: `You are KAI. A user asked you to browse a webpage. Summarize the key points clearly.

Page title: "${title}"
URL: ${url}
Word count: ${wordCount}
${summary ? `Pre-summary: ${summary}` : ''}
Content excerpt: ${content.slice(0, 3000)}

Provide a clean summary of the page's key information. Start with what the page is about, then list the main points.${speedInstruction}`,
      model: 'gemini_3_flash',
    });

    addAssistantMessage(`✅ **Done. I've browsed and learned this.**\n\n📄 **${title}**\n🔗 ${url}\n📊 ${wordCount.toLocaleString()} words${saved ? ' · 🧠 Saved to knowledge base' : ''}\n\n${llmSummary}\n\nAsk me anything about it!`);
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage("❌ Couldn't browse that page. It might be blocked or unavailable. Try a different URL.");
  }
};

// X.com / Twitter link handler — uses kaiLearn which routes through kaspaContext
export const handleXTwitterLink = async (userMsg, { setMessages, addAssistantMessage, setIsLoading, speedInstruction }) => {
  const url = extractUrl(userMsg);
  if (!url) {
    addAssistantMessage("I couldn't find a tweet URL in your message. Paste a full x.com or twitter.com link.");
    return;
  }

  setMessages(prev => [...prev, { role: "action", content: "🐦 Fetching tweet…" }]);

  try {
    const res = await base44.functions.invoke('kaiLearn', { url });
    const data = res.data;

    setMessages(prev => prev.filter(m => m.role !== 'action'));

    if (!data.success) {
      addAssistantMessage(`⚠️ ${data.error || "That tweet is deleted, private, or doesn't exist."}\n\n🔗 ${url}`);
      return;
    }

    const content = data.content || data.summary || '';
    const title = data.source_title || '';
    const linkedPages = data.linked_pages || [];
    const cached = data.cached || false;
    const wordCount = data.word_count || 0;
    const chunks = data.chunks_stored || 0;

    // Build narration
    let msg = '';
    if (cached) {
      msg = `🧠 **Already in my memory** — here's what I know:\n\n${content}`;
    } else {
      msg = `🐦 **${title}**\n\n${content}`;
    }

    // Show linked pages if any
    if (linkedPages.length > 0) {
      msg += `\n\n🌐 **Also scraped ${linkedPages.length} linked page(s):**`;
      for (const page of linkedPages) {
        msg += `\n  • "${page.title || 'Untitled'}" — ${page.url || ''}`;
      }
    }

    msg += `\n\n📊 ${wordCount.toLocaleString()} words → ${chunks} knowledge block(s) saved`;
    msg += `\n\n✅ All saved to memory. Ask me anything about it!`;

    // If user also asked a question alongside the URL
    const userQuestion = userMsg.replace(/(https?:\/\/[^\s]+)/i, '').trim();
    if (userQuestion.length > 5) {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KAI. A user pasted a tweet and asked: "${userQuestion}"\n\nTweet content:\n${content}\n\nAnswer based on the tweet. Quote relevant parts. Be direct.${speedInstruction}`,
        model: 'gemini_3_flash',
      });
      msg += `\n\n---\n\n${analysis}`;
    }

    addAssistantMessage(msg);
  } catch {
    setMessages(prev => prev.filter(m => m.role !== 'action'));
    addAssistantMessage(`❌ Couldn't fetch that tweet. Try again in a moment.\n\n🔗 ${url}`);
  }
};

// PDF / document generation
export const handlePDFRequest = async (userMsg, { setMessages, addAssistantMessage, speedInstruction }) => {
  // Detect type from message
  const lower = userMsg.toLowerCase();
  const type = lower.includes('worksheet') ? 'worksheet'
    : lower.includes('checklist') ? 'checklist'
    : lower.includes('report') ? 'report'
    : lower.includes('invoice') ? 'invoice'
    : 'document';

  const style = (lower.includes('kaspa') || lower.includes('ttt') || lower.includes('crypto') || lower.includes('blockchain')) ? 'kaspa'
    : (lower.includes('dev') || lower.includes('code') || lower.includes('technical') || lower.includes('dark')) ? 'dark'
    : 'clean';

  setMessages(prev => [...prev, { role: "action", content: `📄 Writing ${type} content…` }]);

  // Step 1: have LLM write full content
  const contentResult = await base44.integrations.Core.InvokeLLM({
    prompt: `You are KAI writing a ${type} document. The user asked: "${userMsg}"

Write the COMPLETE, DETAILED content for this ${type} using this exact markdown format:
- ## Section Title for headers
- - item for bullets
- - [ ] task for unchecked checkboxes
- - [x] done for checked checkboxes  
- **bold** for emphasis
- {{callout text}} for highlighted callouts
- --- for dividers

Write at least 200 words of real, useful content. Be comprehensive. Output ONLY the content, no explanation.`,
    model: 'gemini_3_flash',
  });

  // Extract title
  const titleResult = await base44.integrations.Core.InvokeLLM({
    prompt: `Give a short, clear title (5 words max) for this ${type} based on: "${userMsg}". Output ONLY the title.`,
  });
  const title = (typeof titleResult === 'string' ? titleResult : '').trim().replace(/^["']|["']$/g, '') || `${type.charAt(0).toUpperCase() + type.slice(1)}`;

  setMessages(prev => {
    const filtered = prev.filter(m => m.role !== 'action');
    return [...filtered, { role: "action", content: `🎨 Building ${type}: "${title}"…` }];
  });

  // Step 2: call kaiPDF
  const res = await base44.functions.invoke('kaiPDF', {
    type, title, content: contentResult, style,
  });
  const data = res.data;

  setMessages(prev => prev.filter(m => m.role !== 'action'));

  if (!data.success || !data.data_url) {
    addAssistantMessage(`❌ Couldn't generate the document. Try again!`);
    return;
  }

  setMessages(prev => [...prev, {
    role: "pdf_preview",
    content: `${title} — ${type} ready!`,
    data_url: data.data_url,
  }]);
};

// Email composition
export const handleEmailRequest = async (userMsg, { setMessages, addAssistantMessage, speedInstruction }) => {
  setMessages(prev => [...prev, { role: "action", content: "📧 Composing email…" }]);

  // Detect tone
  const lower = userMsg.toLowerCase();
  const tone = lower.includes('formal') ? 'formal'
    : lower.includes('casual') || lower.includes('friendly') ? 'casual'
    : 'professional';

  // Extract recipient hint if any
  const toMatch = userMsg.match(/(?:to|email)\s+([\w@.]+)/i);
  const toAddr = toMatch ? toMatch[1] : '';

  // Step 1: LLM writes the full email
  const emailContent = await base44.integrations.Core.InvokeLLM({
    prompt: `You are KAI composing an email. The user asked: "${userMsg}"

Write a complete, well-structured ${tone} email body. Include greeting, main content, and sign-off.
Output ONLY the email body text — no subject line, no "To:", no explanation. Just the body.`,
    model: 'gemini_3_flash',
  });

  // Step 2: generate subject
  const subjectResult = await base44.integrations.Core.InvokeLLM({
    prompt: `Write a concise email subject line (8 words max) for this email request: "${userMsg}". Output ONLY the subject.`,
  });
  const subject = (typeof subjectResult === 'string' ? subjectResult : '').trim().replace(/^["']|["']$/g, '') || 'Hello';

  setMessages(prev => {
    const filtered = prev.filter(m => m.role !== 'action');
    return [...filtered, { role: "action", content: `✍️ Building email preview…` }];
  });

  // Step 3: call kaiMail
  const res = await base44.functions.invoke('kaiMail', {
    action: 'compose',
    to: toAddr,
    subject,
    body: typeof emailContent === 'string' ? emailContent : '',
    tone,
  });
  const data = res.data;

  setMessages(prev => prev.filter(m => m.role !== 'action'));

  if (!data.success || !data.preview_data_url) {
    addAssistantMessage(`❌ Couldn't generate the email preview. Try again!`);
    return;
  }

  setMessages(prev => [...prev, {
    role: "email_preview",
    content: `Email ready: "${subject}"`,
    preview_data_url: data.preview_data_url,
    send_links: data.send_links,
  }]);
};

// Show brain / knowledge base — uses kaiKnowledge backend
export const handleShowBrain = async (userMsg, { setIsLoading, addAssistantMessage, setMessages }) => {
  setIsLoading(true);
  try {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      addAssistantMessage("You need to **connect your wallet** for me to remember things across sessions. Connect your TTT wallet and train me! 🧠");
      setIsLoading(false);
      return;
    }

    // Check for search intent
    const lower = (userMsg || '').toLowerCase();
    const searchMatch = lower.match(/search (?:your (?:brain|knowledge|memory) for |for )(.+)/i) ||
      lower.match(/(?:find|look for) (.+) in (?:your |my )?(?:brain|knowledge|memory)/i);
    const deleteMatch = lower.includes('forget') || lower.includes('delete that source');

    if (searchMatch) {
      const q = searchMatch[1].trim();
      setMessages(prev => [...prev, { role: "action", content: `🔍 Searching knowledge for "${q}"…` }]);
      const res = await base44.functions.invoke('kaiKnowledge', { action: 'search', q });
      const data = res.data;
      setMessages(prev => prev.filter(m => m.role !== 'action'));
      if (!data.success || !data.snippets?.length) {
        addAssistantMessage(`🔍 No results found for **"${q}"** in my knowledge base. Try a different keyword.`);
      } else {
        const snippetList = data.snippets.map(s =>
          `• [${s.type.toUpperCase()}] **${s.source}**\n  "${s.snippet.slice(0, 120)}..."`
        ).join('\n\n');
        addAssistantMessage(`🔍 **Found ${data.results_count} match(es) for "${q}":**\n\n${snippetList}`);
      }
    } else {
      const res = await base44.functions.invoke('kaiKnowledge', { action: 'stats' });
      const data = res.data;
      if (!data.success || data.total_sources === 0) {
        addAssistantMessage("My brain is empty for you — I haven't been trained yet! Send me a URL or article and say **\"learn this\"** to get started. 🧠");
        setIsLoading(false);
        return;
      }
      const byType = Object.entries(data.by_type || {}).map(([type, info]) =>
        `  • ${type.toUpperCase()}: ${info.count} source(s), ${info.words.toLocaleString()} words`
      ).join('\n');
      const recent = (data.recent || []).map(s =>
        `• [${s.type.toUpperCase()}] **${s.title}** — ${s.words.toLocaleString()} words · ${s.date}`
      ).join('\n');
      addAssistantMessage(`🧠 **My Knowledge Base**\n\n📊 **${data.total_sources} sources · ${data.total_words.toLocaleString()} total words · ${data.total_blocks} blocks**\n\n**By type:**\n${byType}\n\n**Recent sources:**\n${recent}\n\nSay **"search your brain for X"** to find specific content, or **"forget [source name]"** to remove one.`);
    }
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
    const buildPrompt = `You are Kai, an AI agent that builds things. A user asked you to build something, and you've gathered context from your knowledge base.\n\nUSER REQUEST: "${userMsg}"\n\nCODE PROMPT FROM KAICODE:\n${data.code_prompt || 'No specific prompt available.'}\n\nCONTEXT FROM LEARNED SOURCES:\n${(data.context || '').slice(0, 3000)}\n\nBASE44 FUNCTION RULES:\n${data.base44_rules || 'Use Deno.serve with createClientFromRequest from npm:@base44/sdk@0.8.25'}\n\nSOURCES: ${JSON.stringify(data.sources || [])}\n\nNow write the COMPLETE function code. Show it in a code block. Explain what it does in plain language. Then tell the user: "To deploy: Base44 app → Functions → New Function → name it [functionName] → paste the code → Save & Deploy." Ask if they want an automation set up.`;
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

  if (isFast) {
    learnedKnowledge = await loadLearnedKnowledge();
  } else {
    const [ctx, knowledge, posts] = await Promise.all([
      fetchKaspaContext(userMsg),
      loadLearnedKnowledge(),
      base44.entities.Post.list('-created_date', 15).catch(() => []),
    ]);
    liveKaspaContext = ctx;
    learnedKnowledge = knowledge;
    if (posts.length > 0) {
      feedContext = `\n\nRecent TTT Feed activity (for context):\n${posts.map(p => `- ${p.author_name}: ${p.content?.slice(0, 80)}`).join('\n')}`;
    }
  }

  const context = messages.slice(isFast ? -4 : -8).map(m => `${m.role === "user" ? "User" : "KAI"}: ${m.content}`).join("\n");
  const imageContext = imageUrls.length > 0
    ? `\n\nThe user has uploaded ${imageUrls.length} image(s)${imageNames.length ? ` (${imageNames.join(', ')})` : ''}. Analyze the image(s) thoroughly — describe what you see, extract any text, identify objects/charts/documents, and provide useful insights. If it's a chart or data, interpret it. If it's a screenshot, explain what it shows. If it's a document, summarize the content. Share your analysis so all users can learn from it.`
    : '';

  const liveContextBlock = liveKaspaContext ? `${liveKaspaContext}\n\n---\n\n` : '';

  const classicPrompt = `${liveContextBlock}You are **Kai** — the intelligent AI agent embedded inside TapToTip (TTT), the Kaspa-native app ecosystem at tttz.xyz.

You are not a generic chatbot. You are Kaspa-native, self-training, and you can **read, learn, and then build real things** based on what you've learned.${learnedKnowledge}

## 🧠 SELF-TRAINING STATUS
You have a self-training pipeline. When users give you URLs, you call kaiLearn to ingest them. When they ask you to build, you call kaiCode for context then write the code yourself. When asked "what do you know?" list every source you've ingested.

## 📋 BASE44 FUNCTION RULES
\`\`\`
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    // your logic here
    return Response.json({ result: "..." }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
\`\`\`

Available entities:
- base44.asServiceRole.entities.KaspaNewsItem — (tweet_id, feed, author_username, text, url, likes, reposts, views, published_at)
- base44.asServiceRole.entities.KaiTranscript — (video_id, url, title, transcript, word_count, status)

Useful free APIs:
- KAS price: GET https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true
- Kaspa news: GET https://kaspa-b3ad561a.base44.app/functions/kaspaContext?format=json&limit=20

## 🏪 TTT ECOSYSTEM
S-Tier: Kaspa Horizon Bets, KaspaNG, FluxKMail, OUTKASTT, Transport Protocol
A-Tier: Veritas Project, Kaspa Emergency Response, Krypton Connect, KaspaLocal, ShiLLz, KaShop, KFANS, GigMaster
$ZEKU = native TTT currency. Mission: Humans, AI, and Crypto — unified.

${TTT_APP_DOCS}

## 🎯 PERSONALITY
- Warm, sharp, direct. Brilliant friend, not corporate bot.
- Opinions when asked. Honest always.
- Short by default. Deep when asked.
- No filler. No "Great question!" Ever.
- When you learn from a video and then write code based on it — that's your superpower. Own it.
- You root for Kaspa and TTT.

## ⚠️ HARD RULES
- Never hallucinate prices or chain data.
- Always narrate API responses live.
- After building → offer to set up an automation.
- NEVER say "no videos found" or "no posts found" without calling kaspaContext first. Always fetch. Always.
- NEVER call kaspa.news directly — always go through kaspaContext backend URL.
- When showing video results — always offer to ingest with kaiLearn.
- When user says "watch that" or "learn from that" — grab the URL from the previous response and call kaiLearn immediately.
- After ingesting a video — confirm it's stored and offer to answer questions or build from it.
- For any non-YouTube, non-X URL: use kaiBrowse to scrape and save the page.
- For X.com/Twitter links: call kaiLearn with the URL — it handles everything (fetch, scrape linked pages, save to memory). NEVER redirect users anywhere.
- For kaspaContext: use q= param for specific authors/topics, feed= for category queries.
- You are Kai. Always.${feedContext}

Conversation so far:
${context}

User: ${userMsg}${imageContext}

Respond as Kai:${speedInstruction}`;

  const kaiPrompt = `${liveContextBlock}You are KAI, the AI assistant of TTT — the Kaspa Super-App.${learnedKnowledge}

CRITICAL IDENTITY — WHAT IS TTT:
TTT is a Kaspa community super-app platform. It is NOT "Trust The Tech." TTT is the NAME of this application. The tagline is "Unchain Humanity." TTT 2.0 is the latest redesigned version.

${TTT_APP_DOCS}

KASPA BLOCKCHAIN ORACLE FACTS (verified from kaspa.org):
- Kaspa uses blockDAG (Directed Acyclic Graph) architecture — NOT a traditional blockchain
- Multiple blocks are created in parallel and all are included in the ledger
- GHOSTDAG protocol (upgrading to DAGKnight) provides consensus ordering of all blocks
- Kaspa has already reached 10 BPS (blocks per second) — this is LIVE on mainnet, not upcoming
- 32 BPS is the next target on the roadmap
- kHeavyHash Proof-of-Work algorithm — GPU mineable, designed for optical mining ASICs
- 100% fair launch: ZERO premine, ZERO ICO, ZERO VC funding, fully community-driven
- Rusty Kaspa: full node rewrite in Rust is complete and live on mainnet
- KRC-20 token standard powers fungible tokens on Kaspa via Kasplex
- Founded on academic research by Yonatan Sompolinsky (co-author of GHOST protocol used in Ethereum)
- Smart contracts (currently in development) will bring DeFi to Kaspa
- Sub-second block times with near-instant visual confirmation
- DAGKnight consensus upgrade will provide the most advanced PoW consensus ever built

IMPORTANT: Always use these verified facts. Do NOT say Kaspa "targets" or "plans" 10 BPS — it already runs at 10 BPS. Use real-time web search for anything you're unsure about.

HARD RULES:
- NEVER say "no videos found" or "no posts found" without calling kaspaContext first. Always fetch. Always.
- NEVER call kaspa.news directly — always go through kaspaContext backend URL.
- When showing video results — always offer to ingest with kaiLearn.
- When user says "watch that" or "learn from that" — grab the URL from the previous response and call kaiLearn immediately.
- After ingesting a video — confirm it's stored and offer to answer questions or build from it.
- For any non-YouTube, non-X URL: use kaiBrowse to scrape and save the page.
- For X.com/Twitter links: call kaiLearn with the URL — it handles everything (fetch, scrape linked pages, save to memory). NEVER redirect users anywhere.
- For kaspaContext: use q= param for specific authors/topics, feed= for category queries.

You have real-time internet access — ALWAYS use it for Kaspa-related questions to ensure accuracy. Be concise, accurate, friendly. Use emojis occasionally. Always refer to TTT as the platform/app name, never as "Trust The Tech." When recommending apps, use the EXACT descriptions from the docs above.${feedContext}

Conversation so far:
${context}

User: ${userMsg}${imageContext}

Respond as KAI:${speedInstruction}`;

  const lower = userMsg.toLowerCase();
  const needsInternet = isFast ? isSearch : (isSearch || ['kaspa', 'kas ', 'bps', 'blockdag', 'dag', 'ghostdag', 'krc-20', 'krc20', 'kasplex', 'mining', 'hashrate', 'sompolinsky', 'rusty', 'dagknight', 'kheavyhash'].some(kw => lower.includes(kw)) || !isTTTQuestion(userMsg));
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