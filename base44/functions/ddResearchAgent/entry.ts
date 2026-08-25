import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { query } = body;

    if (!query) return Response.json({ error: "No query provided" }, { status: 400 });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Step 1: Search the web with Exa for real results with links
    let searchResults = [];
    let sources = [];
    try {
      const exaKey = process.env.EXA_API_KEY;
      if (exaKey) {
        const exaRes = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": exaKey },
          body: JSON.stringify({
            query: query,
            numResults: 5,
            useAutoprompt: true,
            contents: { text: { maxCharacters: 1000 } },
          }),
        });
        const exaData = await exaRes.json();
        searchResults = (exaData.results || []).map((r) => ({
          title: r.title,
          url: r.url,
          text: r.text?.slice(0, 500) || "",
        }));
        sources = searchResults.map((s) => ({ title: s.title, url: s.url }));
      }
    } catch (e) {
      // Exa might fail — continue with just GPT
    }

    // Step 2: Use ChatGPT (GPT model) to synthesize the research
    const context = searchResults.length > 0
      ? searchResults.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.text}`).join("\n\n")
      : "";

    const prompt = context
      ? `You are a research assistant. Using ONLY the following web search results, provide a comprehensive answer to the user's question. Include inline citations like [1], [2] referencing the sources. Be thorough and factual.\n\nSEARCH RESULTS:\n${context}\n\nUSER QUESTION: ${query}`
      : `You are a research assistant. Answer the user's question as thoroughly as possible. If you're unsure, say so.\n\nUSER QUESTION: ${query}`;

    const gptRes = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      model: "gpt_5_4", // Real ChatGPT (OpenAI GPT model)
    });

    const answer = typeof gptRes === "string" ? gptRes : gptRes?.text || "I couldn't complete the research.";

    return Response.json({
      answer,
      sources,
      model: "gpt_5_4",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}