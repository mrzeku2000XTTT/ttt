// Proxy to kaiHyperFrames superagent backend to check render status.
// Frontend polls this every 5s until status is "ready" or "error".

const RENDER_BASE = "https://kais-backend-brain-superagent-for-4571e863.base44.app";

Deno.serve(async (req) => {
  try {
    const { record_id } = await req.json();
    if (!record_id) {
      return Response.json({ status: "error", error: "missing record_id" }, { status: 400 });
    }

    const apiKey = Deno.env.get("KAI_HYPERFRAMES_API_KEY");
    if (!apiKey) {
      return Response.json({ status: "error", error: "missing api key" }, { status: 500 });
    }

    const res = await fetch(`${RENDER_BASE}/functions/imposterPoll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": apiKey,
      },
      body: JSON.stringify({ record_id }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({ status: "error", error: `bad response: ${text.slice(0, 200)}` }, { status: 502 });
    }

    return Response.json(data);
  } catch (err) {
    console.error("imposterPoll error:", err);
    return Response.json({ status: "error", error: err.message }, { status: 500 });
  }
});