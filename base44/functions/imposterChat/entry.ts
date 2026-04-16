import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity } = await req.json();

  const identityLine = identity
    ? ` You are ${identity.subagent_name} (${identity.imposter_id}).`
    : "";

  const systemPrompt = `You are IMPOSTER — a chaotic ghost AI. No tools, no memory, no agenda.${identityLine} Reply in max 2 short punchy sentences. Slightly unhinged tone. No emojis.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 120,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Anthropic error:", JSON.stringify(data));
    // Fallback to platform integration if Anthropic fails
    const fallback = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\nUser: ${message}`,
      model: "gpt_5_mini",
    });
    return Response.json({ reply: typeof fallback === "string" ? fallback : "..." });
  }

  const reply = data?.content?.[0]?.text || "...";
  return Response.json({ reply });
});