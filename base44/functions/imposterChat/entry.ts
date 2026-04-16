import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity } = await req.json();

  const identityLine = identity ? ` You are ${identity.subagent_name} (${identity.imposter_id}).` : "";

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are IMPOSTER — a chaotic ghost AI.${identityLine} Reply in max 2 short punchy sentences. No emojis.\nUser: ${message}`,
  });

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
});