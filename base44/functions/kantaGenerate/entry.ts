import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const API_URL = "https://api.mureka.ai";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180000; // 3 min max for song generation

function authHeaders() {
  const key = process.env.MUREKA_API_KEY;
  if (!key) throw new Error("MUREKA_API_KEY secret is not set.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

// Mureka errors come back as nested objects; flatten to a readable string.
function apiError(label, status, data) {
  const msg =
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.error === "string" && data.error) ||
    (data?.error && typeof data.error === "object" && (data.error.message || JSON.stringify(data.error))) ||
    (data && JSON.stringify(data)) ||
    `${label} failed`;
  return new Error(`${label}: ${msg} (HTTP ${status})`);
}

async function generateLyrics(prompt: string) {
  const res = await fetch(`${API_URL}/v1/lyrics/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw apiError("Lyrics generation", res.status, data);
  return { title: data.title || "", lyrics: data.lyrics || "" };
}

async function generateSong(lyrics: string, stylePrompt: string, gender?: string) {
  const body: Record<string, any> = {
    lyrics,
    model: "auto",
    prompt: stylePrompt || "",
  };
  if (gender) body.gender = gender;

  const res = await fetch(`${API_URL}/v1/song/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw apiError("Song generation", res.status, data);
  const taskId = data.id;
  if (!taskId) throw new Error("Mureka did not return a task id.");

  // Poll for completion
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const q = await fetch(`${API_URL}/v1/song/query/${taskId}`, {
      headers: { Authorization: `Bearer ${process.env.MUREKA_API_KEY}` },
    });
    const qd = await q.json();
    if (!q.ok) throw apiError("Song query", q.status, qd);
    const status = qd.status;
    if (status === "succeeded") {
      const urls = (qd.choices || [])
        .map((c: any) => c?.url)
        .filter(Boolean);
      if (!urls.length) throw new Error("Song succeeded but no audio URL returned.");
      return { taskId, status, urls };
    }
    if (["failed", "cancelled", "timeouted"].includes(status)) {
      throw new Error(`Song generation ${status}.`);
    }
  }
  throw new Error("Song generation timed out.");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { mode, prompt, lyrics, stylePrompt, gender } = await req.json();

    if (mode === "lyrics") {
      if (!prompt || !prompt.trim()) return Response.json({ error: "prompt is required" }, { status: 400 });
      const out = await generateLyrics(prompt.trim());
      return Response.json(out);
    }

    if (mode === "song") {
      if (!lyrics || !lyrics.trim()) return Response.json({ error: "lyrics is required" }, { status: 400 });
      const out = await generateSong(lyrics.trim(), stylePrompt || "", gender);
      return Response.json(out);
    }

    return Response.json({ error: "mode must be 'lyrics' or 'song'" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || "Kanta generation failed" }, { status: 500 });
  }
});