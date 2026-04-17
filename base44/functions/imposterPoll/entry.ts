Deno.serve(async (req) => {
  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) {
      return Response.json({ error: "conversation_id required" }, { status: 400 });
    }

    const SUPERAGENT_APP_ID = "69e00a3b3c4957544571e863";
    const SUPERAGENT_KEY = Deno.env.get("SUPERAGENT_ZEKU_API_KEY") || "";
    const url = `https://app.base44.com/api/agents/${SUPERAGENT_APP_ID}/conversations/${conversation_id}`;

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

    // Find the LAST user message index — we only care about assistant replies after it
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") { lastUserIdx = i; break; }
    }

    // Still waiting for Kai to respond to the user
    if (lastUserIdx === -1 || lastUserIdx === messages.length - 1) {
      return Response.json({ status: "processing" });
    }

    // Look at assistant messages after the last user message
    const assistantAfter = messages.slice(lastUserIdx + 1).filter(m => m.role === "assistant");
    if (assistantAfter.length === 0) {
      return Response.json({ status: "processing" });
    }

    // Combine all assistant replies since user message (in case tool calls split them)
    const combined = assistantAfter.map(m => m.content || m.text || "").join("\n");
    const mp4Match = combined.match(/https?:\/\/\S+\.mp4/i);

    // No video URL yet — Kai might still be rendering. Keep polling unless we have final text-only reply.
    if (!mp4Match) {
      // If Kai gave a substantive text reply (>20 chars) without a video, treat as done
      if (combined.trim().length > 20) {
        return Response.json({ status: "ready", reply: combined.trim(), video_url: null });
      }
      return Response.json({ status: "processing" });
    }

    return Response.json({
      status: "ready",
      reply: combined.replace(mp4Match[0], "").trim() || "🎬 video ready:",
      video_url: mp4Match[0],
    });
  } catch (err) {
    console.error("imposterPoll error:", err?.message || err);
    return Response.json({ status: "error", error: err?.message || "unknown" });
  }
});