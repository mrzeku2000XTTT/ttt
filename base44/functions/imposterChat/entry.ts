import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity } = await req.json();

  const name = identity?.subagent_name || "IMPOSTER";

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are ${name}, chaotic ghost AI. Max 2 short sentences, unhinged.\nUser: ${message}`,
  });

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
});