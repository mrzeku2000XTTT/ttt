const HYPERFRAMES_URL = "https://kais-backend-brain-superagent-for-4571e863.base44.app/functions/kaiHyperFrames";

Deno.serve(async (req) => {
  try {
    const { record_id, conversation_id } = await req.json();
    const id = record_id || conversation_id;
    if (!id) {
      return Response.json({ error: "record_id required" }, { status: 400 });
    }

    const HYPERFRAMES_KEY = Deno.env.get("KAI_HYPERFRAMES_API_KEY") || "";

    const res = await fetch(`${HYPERFRAMES_URL}?record_id=${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api_key": HYPERFRAMES_KEY,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("imposterPoll fetch failed:", res.status, errText);
      return Response.json({ status: "error", error: `${res.status}: ${errText.slice(0, 200)}` });
    }

    const data = await res.json();
    const status = (data.status || "").toLowerCase();

    if (status === "done" && data.video_url) {
      return Response.json({
        status: "ready",
        reply: "🎬 video ready:",
        video_url: data.video_url,
      });
    }

    if (status === "error" || status === "failed") {
      return Response.json({
        status: "error",
        error: data.error || data.message || "render failed",
      });
    }

    // Still processing — return progress text if present
    return Response.json({
      status: "processing",
      progress: data.progress || data.message || data.status || null,
    });
  } catch (err) {
    console.error("imposterPoll error:", err?.message || err);
    return Response.json({ status: "error", error: err?.message || "unknown" });
  }
});