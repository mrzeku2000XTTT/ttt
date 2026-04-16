# KAI Chatbot Architecture — Working State (April 15, 2026)

## FILE STRUCTURE
```
components/kaspa/KaspaAvatarChat.jsx   — Main chat UI + message routing (sendMessage)
components/kaspa/kaiConstants.js       — All keyword arrays, app directory, constants
components/kaspa/kaiDetectors.js       — All detection/matching functions
components/kaspa/kaiHandlers.js        — All handler functions (brain, train, build, news, etc.)
components/kaspa/KAIChatMessage.jsx    — Message bubble renderer (video_posts, news_posts, pdf_preview, email_preview, action, assistant, user)
components/kaspa/KAIAnimations.jsx     — Thinking bubble, blocks animation
components/kaspa/KAINewsCard.jsx       — News post card component
components/kaspa/KAIVideoCard.jsx      — Video card component
components/kaspa/KAIPostViewer.jsx     — Full post viewer panel
functions/kaiLearn                     — Backend: ingest URLs (YouTube via LLM+internet, X/Twitter via kaspaContext, articles via fetch+LLM), store to AgentMemory
functions/kaiPDF                       — Backend: generate PDF documents with jsPDF, upload to storage
functions/kaiMail                      — Backend: compose styled email previews with mailto links
functions/kaiCode                      — Backend: gather context from knowledge base for code generation
functions/kaiKnowledge                 — Backend: manage/search/stats on user's learned knowledge (AgentMemory)
functions/kaspaExplorer                — Backend: Kaspa blockchain explorer API proxy
```

## MESSAGE ROUTING ORDER (sendMessage in KaspaAvatarChat.jsx)
This is the EXACT order of priority. First match wins.

```
1.  isPDFRequest         → handlePDFRequest          (keywords: pdf, document, worksheet, report, checklist, etc.)
2.  isEmailRequest       → handleEmailRequest         (keywords: compose an email, write an email, draft, etc.)
3.  isBrainRequest       → handleShowBrain            (keywords: what do you know, show brain, search knowledge, etc.)
4.  isWatchThatRequest   → handleWatchThat            (keywords: watch that, watch the first, learn from that, ingest that, etc.)
5.  isXTwitterUrl        → handleXTwitterLink         (regex: x.com or twitter.com URLs, NOT if isTrainRequest)
6.  isYouTubeUrl         → handleTrainOnContent       (regex: youtube.com or youtu.be, NOT if remaining text matches isBrowseRequest)
7.  isKaiBrowseUrl       → handleKaiBrowse            (any URL that's NOT X/Twitter and NOT YouTube, NOT train, NOT explorer)
8.  isTrainRequest       → handleTrainOnContent       (keywords: train yourself, learn this, study this, read this, watch this, etc.)
9.  isBuildRequest       → handleBuildRequest         (keywords: build, code, create a function, automate, etc.)
10. isVideoRequest       → handleKaspaVideos          (keywords: latest video, kaspa video, youtube, watch — BUT NOT isWatchThatRequest)
11. isKaspaNewsRequest   → handleKaspaNews            (keywords: kaspa news, latest post, recent post, x posts, etc.)
12. detectFeedRoute      → handleFeedRoute            (feed routing: builders, developers, reddit, pulse — NOT videos or focused)
13. isExplorerRequest    → handleExplorerRequest      (64-char hex hash, kaspa: address, network stats keywords)
14. isBrowseRequest      → opens browser panel        (any bare URL via isUrlInput, or browse/search keywords)
15. kasshiKeywords       → KaSshi music player        (kasshi, music, play music, listen, etc.)
16. detectOpenApp        → app link                   (open X, go to X, launch X — matched against APP_DIRECTORY)
17. isImageRequest       → suggest Xunhua/Hikaru      (draw, sketch, paint, create image, etc.)
18. isUserPostRequest    → handleUserPostAnalysis     (posts by, posts from, what did @user say, etc.)
19. isFeedRequest        → handleFeedSummary          (ttt feed, latest posts, what's on the feed, etc.)
20. FALLBACK             → handleGeneralMessage       (general LLM with kaspa context + learned knowledge + internet)
```

## KEY ROUTING LOGIC DETAILS

### YouTube URL Routing (Step 6)
```js
const hasUrl = /(https?:\/\/[^\s]+)/i.test(userMsg);
const isYouTubeUrl = hasUrl && /youtube\.com|youtu\.be/i.test(userMsg);
if (isYouTubeUrl && !isBrowseRequest(userMsg.replace(/(https?:\/\/[^\s]+)/i, '').trim())) {
  await handleTrainOnContent(userMsg, ctx);
}
```
- Strips the URL from the message, checks if remaining text is a browse request
- If just a bare YouTube URL → goes to train (watch & learn)
- If "browse youtube.com/..." → would go to browse panel instead

### X/Twitter URL Routing (Step 5)
```js
if (isXTwitterUrl(userMsg) && !isTrainRequest(userMsg)) {
  await handleXTwitterLink(userMsg, ctx);
}
```
- Routes through kaspaContext backend which fetches tweet + linked pages
- Stores to AgentMemory
- If user also said "learn this" + X URL → falls to step 8 (handleTrainOnContent)

### kaiBrowse URL Routing (Step 7)
```js
if (hasUrl && isKaiBrowseUrl(userMsg) && !isTrainRequest(userMsg) && !isExplorerRequest(userMsg)) {
  await handleKaiBrowse(userMsg, ctx);
}
```
- `isKaiBrowseUrl` returns false for YouTube and X/Twitter URLs
- Any other URL without explicit "learn this" or explorer patterns → scrape + save

### Video Detection vs Watch That
```js
// isVideoRequest excludes isWatchThatRequest matches
export const isVideoRequest = (msg) => {
  if (isWatchThatRequest(msg)) return false;
  return matchesAny(msg, VIDEO_KEYWORDS);
};
```

## HANDLER DETAILS

### handleTrainOnContent (kaiHandlers.js)
- Extracts URL or raw text from message
- For YouTube: calls `kaiLearn` backend which uses LLM with `add_context_from_internet: true` + `gemini_3_flash`
- For regular URLs: calls `kaiLearn` backend which fetches HTML + uses LLM to extract
- For raw text: stores directly
- All content is chunked (500 words) and stored to `AgentMemory.long_term`
- Shows narrated progress: "Fetching…" → "Found: title" → "Extracted X words" → "Stored N blocks"

### handleXTwitterLink (kaiHandlers.js)
- Calls `kaiLearn` with the URL → kaiLearn routes X URLs to kaspaContext backend
- kaspaContext fetches tweet content + any linked pages
- Stores tweet + linked pages to AgentMemory
- If user also asked a question alongside the URL, runs LLM analysis on the content

### handleKaiBrowse (kaiHandlers.js)
- Calls external `kaiBrowse` function (on kaspa-b3ad561a.base44.app)
- Scrapes page content, returns title, word count, summary
- Shows narrated progress
- Then summarizes with LLM

### handlePDFRequest (kaiHandlers.js)
- Detects type: document, worksheet, checklist, report, invoice
- Detects style: clean, kaspa, dark
- Step 1: LLM writes full content with `add_context_from_internet: true` (expert analysis, not just structure)
- Step 2: LLM generates short title
- Step 3: Calls `kaiPDF` backend function which uses jsPDF to create the PDF
- Returns `pdf_preview` message type with download/open actions

### handleEmailRequest (kaiHandlers.js)
- Detects tone: formal, casual, professional
- Extracts recipient hint
- Step 1: LLM writes full email body
- Step 2: LLM generates subject line
- Step 3: Calls `kaiMail` backend which generates HTML preview + Gmail/Outlook links
- Returns `email_preview` message type with iframe preview

### handleWatchThat (kaiHandlers.js)
- Finds last `video_posts` message in chat history
- Extracts video index from ordinal words (first=0, second=1, etc.)
- Checks user auth (memory storage requires login)
- Calls `kaiLearn` with the video URL
- Shows narrated ingestion progress

### handleShowBrain (kaiHandlers.js)
- Calls `kaiKnowledge` backend function
- Supports: stats (overview), search (find specific content), delete (forget source)

### handleGeneralMessage (kaiHandlers.js)
- Loads learned knowledge from AgentMemory
- Fetches live Kaspa context from kaspaContext backend
- Fetches recent TTT Feed posts
- Builds comprehensive prompt with TTT_APP_DOCS, Kaspa facts, conversation history
- Uses `gemini_3_flash` with `add_context_from_internet` when needed
- Supports image analysis via `file_urls` parameter

## BACKEND FUNCTIONS

### kaiLearn (functions/kaiLearn)
- Auth required
- Input: `{ url, rawText, poll }`
- X/Twitter URLs → routes to kaspaContext `?tweet=` endpoint → stores to AgentMemory
- YouTube URLs → LLM with internet (gemini_3_flash) to analyze video → chunks → AgentMemory
- Regular URLs → fetch HTML + LLM extraction → chunks → AgentMemory
- Raw text → direct chunking → AgentMemory
- Returns: `{ success, source_title, source_type, word_count, chunks_stored, summary }`

### kaiPDF (functions/kaiPDF)
- Auth required
- Input: `{ type, title, content, style }`
- Uses jsPDF to create formatted PDF with headers, bullets, checkboxes, callouts, dividers
- Supports themes: clean (blue), kaspa (cyan/dark), dark (purple/dark)
- Uploads PDF via UploadFile integration
- Returns: `{ success, file_url, title, type, style }`

### kaiMail (functions/kaiMail)
- Auth required
- Input: `{ action, to, subject, body, tone }`
- Generates styled HTML email preview
- Creates base64 data URL for iframe preview
- Creates Gmail and Outlook mailto links
- Returns: `{ success, preview_data_url, send_links }`

## MESSAGE TYPES IN KAIChatMessage.jsx
```
video_posts    — Horizontal scrollable video cards with play + watch & learn buttons
news_posts     — Horizontal scrollable news cards with post viewer
pdf_preview    — Blue gradient card with PDF icon, title, download + open buttons
email_preview  — Email preview iframe + Gmail/Outlook open buttons
action         — Cyan/purple gradient pill showing current operation (narration)
assistant      — Regular markdown-rendered assistant message
user           — Right-aligned user message with optional attached images
```

## SHARED CONTEXT OBJECT (ctx)
```js
const ctx = { setMessages, addAssistantMessage, setIsLoading, isFast, speedInstruction, kaiMode };
```
Passed to all handlers. Some handlers also receive: `setBrowserUrl, setShowBrowser, setViewingPost`.

## DETECTOR FUNCTIONS (kaiDetectors.js)
All use `matchesAny(msg, keywords)` which checks `msg.toLowerCase().includes(kw)` for each keyword.

Special detectors:
- `isXTwitterUrl(msg)` — regex for x.com/twitter.com URLs
- `isKaiBrowseUrl(msg)` — has URL AND NOT X/Twitter AND NOT YouTube
- `isVideoRequest(msg)` — matches VIDEO_KEYWORDS BUT explicitly excludes isWatchThatRequest
- `extractVideoIndex(msg)` — first/1st/#1 → 0, second/2nd/#2 → 1, etc. Default 0
- `extractUrl(msg)` — regex for https:// URLs
- `detectExplorerAction(msg)` — detects tx hash (64 hex), kaspa: address, or network stats keywords
- `detectOpenApp(msg)` — matches "open X" / "go to X" against APP_DIRECTORY
- `detectFeedRoute(msg)` — matches against FEED_ROUTE_MAP keywords

## CONSTANTS (kaiConstants.js)
- `KASPA_CONTEXT_BASE` = `https://kaspa-b3ad561a.base44.app/functions/kaspaContext`
- `TTT_APP_DOCS` — Full app directory with descriptions
- `KAI_FACTS` — Rotating bubble facts
- All keyword arrays for each detector
- `APP_DIRECTORY` — Array of app entries with names[], path, label, desc
- `FEED_ROUTE_MAP` — Maps feed names to keywords and feed parameter values

## UI FEATURES
- Floating avatar bubble with rotating facts
- Two modes: KAI (Kaspa-focused) and Classic (general + TTT knowledge)
- Response speed: Fast (1-3 sentences) vs Thinking (detailed)
- Typewriter effect for fast mode
- Image upload + analysis
- Browser panel (iframe) for URLs
- Post viewer panel for news articles
- Settings panel with mode toggle, speed toggle, bubble toggle
- onWatchVideo callback from KAIVideoCard → programmatically triggers handleWatchThat