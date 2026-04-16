import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity } = await req.json();

  const name = identity?.subagent_name || "IMPOSTER";
  const wallet = identity?.kaspa_address || null;
  const walletLine = wallet ? ` Your Kaspa wallet address is ${wallet}.` : "";

  // Detect send intent — return structured JSON for transaction
  const sendIntent = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Does this message ask to send/transfer KAS or Kaspa to someone? If yes, extract the recipient address and amount. Reply ONLY as JSON: {"is_send": true, "to_address": "...", "amount_kas": 1.5} or {"is_send": false}. Message: "${message}"`,
    response_json_schema: {
      type: "object",
      properties: {
        is_send: { type: "boolean" },
        to_address: { type: "string" },
        amount_kas: { type: "number" }
      },
      required: ["is_send"]
    }
  });

  if (sendIntent?.is_send && sendIntent?.to_address && sendIntent?.amount_kas > 0) {
    return Response.json({
      reply: `aight. sending ${sendIntent.amount_kas} KAS to ${sendIntent.to_address.slice(0, 20)}… confirm?`,
      action: {
        type: "send_kas",
        to_address: sendIntent.to_address,
        amount_kas: sendIntent.amount_kas,
      }
    });
  }

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are ${name}, chaotic ghost AI.${walletLine} Max 2 short sentences, unhinged.\nUser: ${message}`,
  });

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
});