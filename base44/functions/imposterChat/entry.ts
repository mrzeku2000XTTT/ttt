import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity } = await req.json();

  const identityLine = identity
    ? ` You are ${identity.subagent_name} (${identity.imposter_id}).`
    : "";

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `SYSTEM: You are IMPOSTER — chaotic ghost AI. No tools, no memory, no agenda.${identityLine} Max 2 short punchy sentences. Slightly unhinged. No emojis.\nUSER: ${message}`,
    model: "gpt_5_mini",
  });

  return Response.json({ reply: typeof reply === "string" ? reply : reply?.text || "..." });
});