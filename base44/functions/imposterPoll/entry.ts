const KAI_AGENT_ID = '69e00a3b3c4957544571e863';
const KAI_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const KAI_BASE_URL = `https://app.base44.com/api/agents/${KAI_AGENT_ID}`;

Deno.serve(async (req) => {
  try {
    const { conversation_id, record_id } = await req.json();
    const convId = conversation_id || record_id;
    if (!convId) {
      return Response.json({ error: "conversation_id required" }, { status: 400 });
    }

    let res = await fetch(`${KAI_BASE_URL}/conversations/${convId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "api_key": KAI_API_KEY },
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`${KAI_BASE_URL}/conversations/${convId}/messages`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "api_key": KAI_API_KEY },
      });
    }

    if (!res.ok) {
      return Response.json({ status: "processing" });
    }

    const data = await res.json();
    const messages = Array.isArray(data) ? data : (data.messages || data.items || []);
    const assistantMsgs = messages.filter(m => m.role === "assistant" || m.role === "agent");
    const latest = assistantMsgs[assistantMsgs.length - 1];
    const latestContent = latest?.content || "";

    // Scan all assistant messages for a video URL (.mp4 or media.base44.com)
    let videoUrl = null;
    for (let i = assistantMsgs.length - 1; i >= 0; i--) {
      const content = assistantMsgs[i]?.content || "";
      const mp4Match = content.match(/https?:\/\/[^\s)'"]+\.mp4(?:\?[^\s)'"]*)?/i);
      const mediaMatch = content.match(/https?:\/\/media\.base44\.com\/[^\s)'"]+/i);
      if (mp4Match) { videoUrl = mp4Match[0]; break; }
      if (mediaMatch) { videoUrl = mediaMatch[0]; break; }
    }

    if (videoUrl) {
      let replyText = latestContent.replace(videoUrl, "").trim();
      // Strip Superagent's "🎬 Your video is ready!" prefix and generic error fallbacks
      replyText = replyText
        .replace(/^🎬\s*Your video is ready[!.\s]*/i, "")
        .replace(/^Your video is ready[!.\s]*/i, "")
        .trim();
      if (/I ran into an unexpected error|processing your request|attached files.*too large|try again with smaller/i.test(replyText)) {
        replyText = "";
      }
      return Response.json({
        status: "ready",
        video_url: videoUrl,
        reply: replyText || "🎬 video ready",
      });
    }

    if (/\b(error|failed|couldn't|could not|can't render|unable to)\b/i.test(latestContent) &&
        /\b(video|render|generat)/i.test(latestContent)) {
      return Response.json({
        status: "error",
        error: latestContent.slice(0, 300),
      });
    }

    return Response.json({
      status: "processing",
      progress: latestContent ? latestContent.slice(0, 200) : null,
    });
  } catch (err) {
    console.error("imposterPoll error:", err?.message || err);
    return Response.json({ status: "error", error: err?.message || "unknown" });
  }
});