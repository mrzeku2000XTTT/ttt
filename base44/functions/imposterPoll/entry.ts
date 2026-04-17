const SUPERAGENT_APP_ID = "69e00a3b3c4957544571e863";
const SUPERAGENT_BASE = `https://app.base44.com/api/apps/${SUPERAGENT_APP_ID}`;
const AGENT_BASE = `https://app.base44.com/api/agents/${SUPERAGENT_APP_ID}`;

// Extract mp4 / video URL from any string
function findVideoUrl(text) {
  if (!text || typeof text !== "string") return null;
  const m = text.match(/https?:\/\/\S+?\.(mp4|mov|webm)(\?\S*)?/i);
  return m ? m[0] : null;
}

// Look up the most recent VideoRender on the Superagent app.
// Returns { video_url, stuck } — stuck=true if latest render has been pending >5min.
async function findRenderedVideo(apiKey, sinceIso) {
  try {
    const url = `${SUPERAGENT_BASE}/entities/VideoRender?limit=10&sort=-created_date`;
    const res = await fetch(url, {
      headers: { "api_key": apiKey, "Content-Type": "application/json" },
    });
    if (!res.ok) return { video_url: null, stuck: false };
    const list = await res.json();
    if (!Array.isArray(list)) return { video_url: null, stuck: false };

    const since = sinceIso ? new Date(sinceIso).getTime() : 0;

    // Find a completed one matching the conversation timeframe
    const done = list.find(r => {
      if (r.status !== "done" || !r.video_url) return false;
      if (!since) return true;
      const created = new Date(r.created_date).getTime();
      return created >= since - 60_000;
    });
    if (done?.video_url) return { video_url: done.video_url, stuck: false };

    // Detect stuck: newest record is pending AND created >5min ago
    const newest = list[0];
    if (newest && newest.status === "pending") {
      const ageMs = Date.now() - new Date(newest.created_date).getTime();
      if (ageMs > 5 * 60 * 1000) {
        return { video_url: null, stuck: true };
      }
    }

    return { video_url: null, stuck: false };
  } catch (err) {
    console.error("VideoRender lookup failed:", err?.message || err);
    return { video_url: null, stuck: false };
  }
}

Deno.serve(async (req) => {
  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) {
      return Response.json({ error: "conversation_id required" }, { status: 400 });
    }

    const SUPERAGENT_KEY = Deno.env.get("SUPERAGENT_ZEKU_API_KEY") || "";
    const url = `${AGENT_BASE}/conversations/${conversation_id}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api_key": SUPERAGENT_KEY,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("imposterPoll fetch failed:", res.status, errText);
      return Response.json({ status: "error", error: `${res.status}: ${errText.slice(0, 200)}` });
    }

    const data = await res.json();
    const messages = data?.messages || data?.history || [];

    // Find the LAST user message — we only care about assistant replies after it
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") { lastUserIdx = i; break; }
    }

    if (lastUserIdx === -1 || lastUserIdx === messages.length - 1) {
      return Response.json({ status: "processing" });
    }

    const assistantAfter = messages.slice(lastUserIdx + 1).filter(m => m.role === "assistant");
    if (assistantAfter.length === 0) {
      return Response.json({ status: "processing" });
    }

    const combined = assistantAfter.map(m => m.content || m.text || "").join("\n");

    // 1. Direct mp4 URL in the chat text?
    let videoUrl = findVideoUrl(combined);

    // 2. Check tool_call results embedded in assistant messages
    if (!videoUrl) {
      for (const m of assistantAfter) {
        const toolOutputs = m.tool_calls || m.tool_results || m.tools || [];
        for (const t of (Array.isArray(toolOutputs) ? toolOutputs : [])) {
          const str = typeof t === "string" ? t : JSON.stringify(t);
          const found = findVideoUrl(str);
          if (found) { videoUrl = found; break; }
        }
        if (videoUrl) break;
      }
    }

    // 3. Fallback: query VideoRender entity for a recent completed render.
    const looksComplete = /render\s+complete|video\s+complete|✅/i.test(combined);
    const looksRendering = /render(ing|ed)?|mp4|video|scene/i.test(combined);
    let stuck = false;
    if (!videoUrl && (looksComplete || looksRendering)) {
      const firstMsgTime = messages[0]?.created_date || messages[0]?.timestamp || null;
      const found = await findRenderedVideo(SUPERAGENT_KEY, firstMsgTime);
      videoUrl = found.video_url;
      stuck = found.stuck;
    }

    if (videoUrl) {
      return Response.json({
        status: "ready",
        reply: combined.replace(videoUrl, "").trim() || "🎬 video ready:",
        video_url: videoUrl,
      });
    }

    // Detected a stuck render
    if (stuck) {
      return Response.json({
        status: "stuck",
        reply: "⚠️ render got stuck on Superagent's side (pending >5 min). try again.",
      });
    }

    // Completion text but no URL found → report ready with just the text so user sees status
    if (looksComplete) {
      return Response.json({
        status: "ready",
        reply: combined.trim(),
        video_url: null,
      });
    }

    // Still rendering — show latest progress text
    return Response.json({
      status: "processing",
      progress: combined.trim() || null,
    });
  } catch (err) {
    console.error("imposterPoll error:", err?.message || err);
    return Response.json({ status: "error", error: err?.message || "unknown" });
  }
});