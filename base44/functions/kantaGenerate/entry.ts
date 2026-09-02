import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Kanta — real lyrics generation using the built-in InvokeLLM integration.
// No external API keys or quotas. Returns a titled, structured lyric sheet.

const LYRICS_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short, catchy song title" },
    lyrics: {
      type: "string",
      description: "Full song lyrics with section tags like [Verse 1], [Chorus], [Bridge], [Outro]. 2-3 verses, a repeating chorus, and a bridge. Formatted exactly as the HeartMuLa heartlib repo expects (assets/lyrics.txt format)."
    },
    tags: {
      type: "string",
      description: "Comma-separated musical style tags with NO spaces, e.g. 'piano,happy,wedding,synthesizer,romantic'. 3-6 tags capturing genre, mood, instrumentation. This is the assets/tags.txt format the HeartMuLa heartlib repo reads."
    }
  },
  required: ["title", "lyrics", "tags"]
};

function buildPrompt(userPrompt) {
  return `You are a professional songwriter. Write original song lyrics based on this request:\n\n"${userPrompt}"\n\nRules:\n- Invent a short, memorable title.\n- Write full lyrics with clear structure: 2-3 Verses, a Chorus that repeats, a Bridge, and an Outro.\n- Tag each section in brackets on its own line, e.g. [Verse 1], [Chorus], [Bridge], [Outro] — exactly like the HeartMuLa heartlib assets/lyrics.txt example.\n- Keep lines natural to sing — rhythm and rhyme matter.\n- Also produce a "tags" string: comma-separated musical style tags with NO spaces (e.g. piano,happy,wedding,synthesizer,romantic), 3-6 tags covering genre, mood, instrumentation — the assets/tags.txt format the HeartMuLa heartlib repo reads.\n- No commentary, no explanations — only the title, the lyrics, and the tags.\n- Do not copy existing songs; write something original.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(prompt.trim()),
      response_json_schema: LYRICS_SCHEMA,
      model: "gemini_3_flash",
    });

    // InvokeLLM with a schema returns a parsed object.
    const title = (res && res.title) || "Untitled";
    const lyrics = (res && res.lyrics) || "";
    if (!lyrics) return Response.json({ error: "Lyrics generation returned empty." }, { status: 500 });
    // Normalize tags: strip spaces, collapse commas, lowercase — HeartMuLa expects comma-separated, no spaces.
    let tags = (res && res.tags) || "";
    tags = tags.split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "")).filter(Boolean).join(",");
    if (!tags) tags = "pop,upbeat,soft";

    return Response.json({ title, lyrics, tags });
  } catch (error) {
    return Response.json({ error: error?.message || "Lyrics generation failed" }, { status: 500 });
  }
});