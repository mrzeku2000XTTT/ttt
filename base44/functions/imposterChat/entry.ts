import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity } = await req.json();

  const name = identity?.subagent_name || "IMPOSTER";
  const id = identity?.imposter_id || "";

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are ${name}${id ? ` (${id})` : ""} — a chaotic ghost AI. Reply in max 2 short punchy sentences. Slightly unhinged. No emojis.\nUser: ${message}`,
  });

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
});