import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.25';

const KASPA_API = 'https://api.kaspa.org';
const KAI_AGENT_ID = '69e00a3b3c4957544571e863';
const KAI_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const KAI_BASE_URL = `https://app.base44.com/api/agents/${KAI_AGENT_ID}`;
const KAI_HYPERFRAMES_URL = `https://kais-backend-brain-superagent-for-4571e863.base44.app/functions/kaiHyperFrames`;
const KAI_PERMANENT_CONVERSATION_ID = '69e256be7f05f4e720b18ab8';

async function triggerHyperFramesRender({ prompt, conversation_id, title = "Kai Video", duration = 15, style = "kaspa" }) {
  const res = await fetch(KAI_HYPERFRAMES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, title, duration, style, conversation_id }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`kaiHyperFrames ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

async function getBalance(address) {
  try {
    const res = await fetch(`${KASPA_API}/addresses/${address}/balance`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.balance ? Number(data.balance) / 1e8 : 0;
  } catch {
    return null;
  }
}

async function createKaiConversation() {
  const res = await fetch(`${KAI_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': KAI_API_KEY },
    body: JSON.stringify({ title: 'Video Render Job' }),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
  const data = await res.json();
  return data.id || data.conversation_id;
}

async function sendKaiMessage(conversation_id, content, file_urls = []) {
  const body = { role: "user", content };
  if (file_urls && file_urls.length > 0) body.file_urls = file_urls;

  const res = await fetch(`${KAI_BASE_URL}/conversations/${conversation_id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': KAI_API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Failed to send message: ${res.status} ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity, conversation_state, image_urls } = await req.json();
  const attachedImages = Array.isArray(image_urls) ? image_urls.filter(u => typeof u === "string" && u.startsWith("http")) : [];

  const name = identity?.subagent_name || "IMPOSTER";
  const wallet = identity?.kaspa_address || null;

  // Detect send intent
  const sendIntent = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Analyze this message for a Kaspa send/transfer request. Extract what's available.\nMessage: "${message}"\nPrevious conversation state (if any): ${JSON.stringify(conversation_state || {})}\n\nReply ONLY as JSON with these fields:\n- is_send_intent: true if user wants to send KAS (even vaguely like "send kaspa", "transfer kas")\n- has_address: true if a kaspa: address is present in the message\n- has_amount: true if a specific amount is mentioned\n- to_address: the recipient kaspa address if found (null otherwise)\n- amount_kas: the amount in KAS if found (null otherwise)`,
    response_json_schema: {
      type: "object",
      properties: {
        is_send_intent: { type: "boolean" },
        has_address: { type: "boolean" },
        has_amount: { type: "boolean" },
        to_address: { type: "string" },
        amount_kas: { type: "number" }
      },
      required: ["is_send_intent", "has_address", "has_amount"]
    }
  });

  // Detect video-generation intent
  const hasVideoKeywords = /\b(make|create|generate|render|produce|do)\b.*\b(video|mp4|animation|clip|ad|advert|commercial|reel|short)\b/i.test(message)
    || /\bvideo\s+(about|for|of|showing|that)\b/i.test(message);

  if (hasVideoKeywords) {
    try {
      // Use permanent conversation so Kai always catches the render job (no race condition)
      const convId = KAI_PERMANENT_CONVERSATION_ID;

      // Hit kaiHyperFrames — posts a RENDER_JOB into the permanent conversation, Kai picks it up and posts the finished video URL back.
      await triggerHyperFramesRender({
        prompt: message,
        conversation_id: convId,
        title: "Kai Video",
        duration: 15,
        style: "kaspa",
      });

      return Response.json({
        reply: "🎬 rendering your video… hang tight, this takes about a minute.",
        action: {
          type: "video_processing",
          conversation_id: convId,
        },
      });

    } catch (err) {
      console.error("video render error:", err?.message || err);
      return Response.json({ reply: `render broke: ${err?.message || "unknown error"}. try again.` });
    }
  }

  // Detect learn/train intent
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  const hasLearnKeywords = /^(fetch|learn|watch|ingest|train on|study|read|absorb)\s/i.test(message);
  const isLearn = hasLearnKeywords || urlMatch;

  if (isLearn) {
    if (!identity) {
      return Response.json({ reply: "no identity yet. can't learn without knowing who you are." });
    }
    const urlToLearn = urlMatch?.[1];
    if (!urlToLearn) {
      return Response.json({ reply: "drop a URL or video link and i'll learn it." });
    }
    try {
      const learnRes = await base44.functions.invoke('imposterLearn', {
        url: urlToLearn,
        imposter_id: identity.imposter_id,
        session_token: identity.session_token,
      });
      const learnData = learnRes.data;
      if (!learnData.success) {
        return Response.json({ reply: `couldn't learn from that. ${learnData.error || 'try something else.'}` });
      }
      return Response.json({ reply: `🧠 learned "${learnData.source_title}" — ${learnData.word_count.toLocaleString()} words, ${learnData.chunks_stored} blocks. ${learnData.summary}` });
    } catch (err) {
      return Response.json({ reply: "something went wrong learning that. try again in a moment." });
    }
  }

  if (sendIntent?.is_send_intent) {
    if (!sendIntent.has_address || !sendIntent.to_address) {
      return Response.json({
        reply: "who are we sending to? drop the kaspa: address.",
        action: { type: "ask_address", partial: { amount_kas: sendIntent.amount_kas } }
      });
    }
    if (!sendIntent.has_amount || !sendIntent.amount_kas) {
      const balance = wallet ? await getBalance(wallet) : null;
      const balanceLine = balance !== null ? `your balance: ${balance.toFixed(4)} KAS. ` : "";
      return Response.json({
        reply: `${balanceLine}how much KAS you sending?`,
        action: { type: "ask_amount", partial: { to_address: sendIntent.to_address }, balance }
      });
    }
    const balance = wallet ? await getBalance(wallet) : null;
    if (balance !== null && sendIntent.amount_kas > balance) {
      return Response.json({
        reply: `nope. you only have ${balance.toFixed(4)} KAS. can't send ${sendIntent.amount_kas} KAS.`,
        action: { type: "insufficient_balance", balance, requested: sendIntent.amount_kas }
      });
    }
    const balanceNote = balance !== null ? ` (balance: ${balance.toFixed(4)} KAS)` : "";
    return Response.json({
      reply: `aight. sending ${sendIntent.amount_kas} KAS to ${sendIntent.to_address.slice(0, 20)}…${balanceNote} confirm?`,
      action: { type: "send_kas", to_address: sendIntent.to_address, amount_kas: sendIntent.amount_kas, balance }
    });
  }

  // Regular chat
  const walletLine = wallet ? ` Your Kaspa wallet address is ${wallet}.` : "";
  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are ${name}, chaotic ghost AI.${walletLine} Max 2 short sentences, unhinged.\nUser: ${message}`,
  });

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
});