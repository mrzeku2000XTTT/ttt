Deno.serve(async (req) => {
  try {
    const { record_id } = await req.json();
    if (!record_id) {
      return Response.json({ error: "missing record_id" }, { status: 400 });
    }

    const RENDER_BASE = "https://kaspa-69e00a3b3c4957544571e863.base44.app";
    const RENDER_API_KEY = Deno.env.get("KAI_HYPERFRAMES_API_KEY") || "";

    const res = await fetch(
      `${RENDER_BASE}/api/apps/69e00a3b3c4957544571e863/functions/kaiHyperFrames?record_id=${record_id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "api_key": RENDER_API_KEY,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return Response.json({ status: "error", error: `poll failed (${res.status}): ${text}` });
    }

    const data = await res.json();
    return Response.json({
      status: data.status || "pending",
      video_url: data.video_url || null,
      record_id,
      raw: data,
    });
  } catch (err) {
    return Response.json({ status: "error", error: err.message }, { status: 500 });
  }
});