const KAI_AGENT_ID = '69e00a3b3c4957544571e863';
const KAI_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const KAI_BASE_URL = `https://app.base44.com/api/agents/${KAI_AGENT_ID}`;
const KAI_HYPERFRAMES_URL = `https://kais-backend-brain-superagent-for-4571e863.base44.app/functions/kaiHyperFrames`;

Deno.serve(async (req) => {
  try {
    const { record_id, conversation_id } = await req.json();
    const convId = conversation_id || record_id;
    if (!record_id && !convId) {
      return Response.json({ error: "record_id or conversation_id required" }, { status: 400 });
    }

    // Primary: direct status check against kaiHyperFrames
    if (record_id) {
      try {
        const statusRes = await fetch(`${KAI_HYPERFRAMES_URL}?record_id=${encodeURIComponent(record_id)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (statusRes.ok) {
          const data = await statusRes.json();
          const status = (data.status || "").toLowerCase();

          const videoUrl = data.video_url || data.url || data.mp4_url;
          if ((status === "done" || status === "ready" || status === "completed") && videoUrl) {
            console.log("kaiHyperFrames returned video_url:", videoUrl);
            return Response.json({
              status: "ready",
              video_url: videoUrl,
              reply: "🎬 video ready",
            });
          }

          if (status === "error" || status === "failed") {
            return Response.json({
              status: "error",
              error: data.error || data.message || "render failed",
            });
          }

          // pending | rendering → fall through to conversation scan for progress text
        }
      } catch (err) {
        console.error("hyperFrames status check failed:", err?.message || err);
        // fall through to conversation scan
      }
    }

    // Fallback: scan the Kai conversation for a posted video or progress updates
    if (!convId) {
      return Response.json({ status: "processing" });
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

    let videoUrl = null;
    for (let i = assistantMsgs.length - 1; i >= 0; i--) {
      const content = assistantMsgs[i]?.content || "";
      const match = content.match(/https?:\/\/[^\s)'"]+\.mp4(?:\?[^\s)'"]*)?/i);
      if (match) { videoUrl = match[0]; break; }
    }

    if (videoUrl) {
      const replyText = latestContent.replace(videoUrl, "").trim();
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