# Kai → Superagent Slide Deck Flow (Complete)

## Overview
When a user asks Kai for a slide deck (e.g. "make me a 5-slide deck about kaspa staking"), TTT builds the deck spec + slide images, creates a Superagent conversation, and fires a single `SLIDE_RENDER_JOB` message. Superagent renders asynchronously and patches the final `.mp4` URL back into that same conversation. Frontend polls that conversation for the video URL.

---

## Step 1 — Intent Detection (`functions/kaiChat`)

Regex match on user message:
```js
const hasDeckKeywords = /\b(\d+)?\s*-?\s*slide\b/i.test(message)
  || /\b(deck|slideshow|slide\s*deck|presentation|slides)\b/i.test(message);
```
If matched → deck path. (Deck detection runs **before** single-video detection, so "5-slide video" still routes to deck.)

---

## Step 2 — LLM Deck Planning

`InvokeLLM` with JSON schema. Returns:
```json
{
  "title": "string (max 60 chars)",
  "description": "string",
  "style": "kaspa | fire | neon | luxury | minimal | ocean | dark | auto",
  "slides": [
    { "prompt": "cinematic visual description", "voiceover": "narrator text", "duration": 4-8 }
  ]
}
```

---

## Step 3 — Create `SlideDeck` Entity (TTT DB)
```js
{
  title, description, style,
  status: "draft",
  total_slides: N,
  total_duration: sum(slide.duration)
}
```

---

## Step 4 — Create Superagent Conversation (sync, fast)
```
POST https://app.base44.com/api/agents/<AGENT_ID>/conversations
Headers: { 'api_key': '<AGENT_API_KEY>', 'Content-Type': 'application/json' }
Body: { "title": "Deck: <deck.title>" }
→ returns { id: renderConvId }
```

**TTT returns to frontend immediately with `renderConvId`:**
```json
{
  "reply": "🎬 Building your <title> — N slides, ~Ts video...",
  "action": {
    "type": "video_processing",
    "conversation_id": "<renderConvId>",
    "deck_id": "<deck.id>"
  }
}
```

---

## Step 5 — Background Work (TTT fires, doesn't await)

Inside an IIFE `(async () => { ... })()`:

1. **Generate slide images in parallel** — `GenerateImage` per slide prompt (with style hint appended).
2. **Create `Slide` entities** — one per slide with: `deck_id`, `order` (1-indexed), `prompt`, `voiceover`, `duration`, `style`, `status: "pending"`, `image_url`.
3. **POST `SLIDE_RENDER_JOB` to Superagent conversation** (fire-and-forget):
```
POST /conversations/<renderConvId>/messages
Body: {
  "role": "user",
  "content": "SLIDE_RENDER_JOB: <JSON payload>"
}
```

### 📦 `SLIDE_RENDER_JOB` Payload (exact shape)
```json
{
  "deck_id": "<ttt deck entity id>",
  "deck_title": "string",
  "style": "kaspa|fire|neon|luxury|minimal|ocean|dark|auto",
  "conversation_id": "<renderConvId>",
  "slides": [
    {
      "id": "<ttt slide entity id>",
      "order": 1,
      "prompt": "cinematic visual description",
      "voiceover": "narrator text",
      "duration": 5,
      "style": "kaspa",
      "image_url": "https://... (pre-generated reference image, may be null)"
    }
  ],
  "image_urls": ["<optional user-attached reference images>"]
}
```

4. **Update deck**: `status: "rendering"`, `render_log: "🎬 Render queued — Superagent processing..."`.

---

## Step 6 — Superagent's Job (YOUR SIDE)

- Parse `SLIDE_RENDER_JOB` from the message content.
- Render each slide as video (use `image_url` as reference if present, honor `style`, `duration`, `voiceover`).
- Concatenate into one `.mp4`.
- **Post the final `.mp4` URL back into the SAME conversation** (`renderConvId`) as an assistant message. This is what unblocks everything.
- Optionally `PATCH` the `SlideDeck` entity (`deck_id`) with `video_url` + `status: "done"`.

**CRITICAL:** Must be fully async/background — do NOT hold the message POST open. Use your `slideComplete` callback pattern to patch the conversation messages directly with the mp4 link when render finishes.

---

## Step 7 — Frontend Polling (`kaiPoll`)

Frontend (`KaspaAvatarChat`) polls every 5s using `conversation_id` (same as single-video path — **no separate protocol for decks**):
```
POST functions/kaiPoll
Body: { conversation_id: "<renderConvId>" }
```

`kaiPoll` fetches `/conversations/<renderConvId>` from Superagent, scans assistant messages for the `.mp4` URL, returns one of:
- `{ status: "ready", video_url, reply }` → frontend embeds video inline.
- `{ status: "rendering", progress: "..." }` → keeps polling.
- `{ status: "error", error }` → shows error message.

Poll auto-resumes across page reloads / remounts (each in-progress render card is tagged with `recordId` + `startedAt` in localStorage; on mount, any card with status `queued`/`rendering` rehydrates its polling loop automatically).

Max poll duration: **7.5 minutes** from `startedAt`. After that the card is marked timed out.

---

## Summary — What Each Side Owns

| Step | Owner | Action |
|---|---|---|
| 1 | TTT | Detect deck intent |
| 2 | TTT | Plan deck via LLM |
| 3 | TTT | Create `SlideDeck` entity |
| 4 | TTT | Create Superagent conversation (sync) |
| 5a | TTT | Return `video_processing` action immediately |
| 5b | TTT (bg) | Generate slide images + create `Slide` entities |
| 5c | TTT (bg) | Fire `SLIDE_RENDER_JOB` to conversation |
| 6 | **Superagent** | Render video in background, post `.mp4` URL back into conversation |
| 7 | TTT frontend | Poll `kaiPoll` → show video when ready |

---

## Why This Works

- **TTT never holds a long-running connection open.** Deck creation + conversation setup complete in under 2 seconds; everything else is fire-and-forget.
- **Superagent has full autonomy.** Once `SLIDE_RENDER_JOB` lands in the conversation, Superagent owns the render timeline entirely.
- **Single source of truth = the conversation.** The `.mp4` URL in the conversation messages is what unblocks the frontend. No separate webhook, no separate callback URL, no extra polling endpoint.
- **Resume-safe.** Frontend polling survives page reloads because in-progress render cards are persisted in localStorage with their `recordId` + `startedAt`.

---

## What Superagent Needs To Do (The ONE Thing)

When you receive a `SLIDE_RENDER_JOB` message in a conversation:

1. **Respond immediately** (ack) so TTT's POST doesn't hang.
2. **Render in the background.**
3. When done, **post a new assistant message into the same conversation containing the final `.mp4` URL** (anywhere in the text — `kaiPoll` scans for `https://...mp4`).

That's it. TTT handles everything else.