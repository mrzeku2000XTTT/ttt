const KAI_AGENT_ID = '69e00a3b3c4957544571e863';
const KAI_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const KAI_BASE_URL = `https://app.base44.com/api/agents/${KAI_AGENT_ID}`;

Deno.serve(async (req) => {
  try {
    const { record_id, conversation_id } = await req.json();
    const convId = conversation_id || record_id;
    if (!convId) {
      return Response.json({ error: "conversation_id required" }, { status: 400 });
    }

    // Try GET /conversations/{id} first (messages often embedded in conversation object)
    let res = await fetch(`${KAI_BASE_URL}/conversations/${convId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "api_key": KAI_API_KEY },
    });

    // Fallback to /messages subpath
    if (!res.ok && res.status === 404) {
      res = await fetch(`${KAI_BASE_URL}/conversations/${convId}/messages`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "api_key": KAI_API_KEY },
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("imposterPoll fetch failed:", res.status, errText);
      return Response.json({ status: "error", error: `${res.status}: ${errText.slice(0, 200)}` });
    }

    const data = await res.json();
    const messages = Array.isArray(data) ? data : (data.messages || data.items || []);

    // Find the most recent assistant message
    const assistantMsgs = messages.filter(m => m.role === "assistant" || m.role === "agent");
    const latest = assistantMsgs[assistantMsgs.length - 1];
    const latestContent = latest?.content || "";

    // Scan ALL assistant messages for an mp4 URL (most recent wins)
    let videoUrl = null;
    for (let i = assistantMsgs.length - 1; i >= 0; i--) {
      const content = assistantMsgs[i]?.content || "";
      const match = content.match(/https?:\/\/[^\s)'"]+\.mp4(?:\?[^\s)'"]*)?/i);
      if (match) { videoUrl = match[0]; break; }
    }

    if (videoUrl) {
      // Strip the URL from the reply text for cleaner display
      const replyText = latestContent.replace(videoUrl, "").trim();
      return Response.json({
        status: "ready",
        video_url: videoUrl,
        reply: replyText || "🎬 video ready",
      });
    }

    // Check for error/failure signals in Kai's message
    if (/\b(error|failed|couldn't|could not|can't render|unable to)\b/i.test(latestContent) &&
        /\b(video|render|generat)/i.test(latestContent)) {
      return Response.json({
        status: "error",
        error: latestContent.slice(0, 300),
      });
    }

    // Still processing — surface Kai's latest text as progress
    return Response.json({
      status: "processing",
      progress: latestContent ? latestContent.slice(0, 200) : null,
    });
  } catch (err) {
    console.error("imposterPoll error:", err?.message || err);
    return Response.json({ status: "error", error: err?.message || "unknown" });
  }
});