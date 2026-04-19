// Poll kaiHyperFrames for render status.
// Spec: GET https://app.base44.com/api/apps/<APP_ID>/functions/kaiHyperFrames?record_id=...
// Returns: { status: "done" | "rendering" | "error", video_url?: string }

const KAI_APP_ID = '69e00a3b3c4957544571e863';
const KAI_HYPERFRAMES_URL = `https://app.base44.com/api/apps/${KAI_APP_ID}/functions/kaiHyperFrames`;

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

    const url = `${KAI_HYPERFRAMES_URL}?record_id=${encodeURIComponent(record_id)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "api_key": apiKey },
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