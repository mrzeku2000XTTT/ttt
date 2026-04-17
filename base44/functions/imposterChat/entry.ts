import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.25';

const KASPA_API = 'https://api.kaspa.org';

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

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { message, identity, conversation_state } = await req.json();

  const name = identity?.subagent_name || "IMPOSTER";
  const wallet = identity?.kaspa_address || null;

  // Detect send intent with full context
  const sendIntent = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Analyze this message for a Kaspa send/transfer request. Extract what's available.
Message: "${message}"
Previous conversation state (if any): ${JSON.stringify(conversation_state || {})}

Reply ONLY as JSON with these fields:
- is_send_intent: true if user wants to send KAS (even vaguely like "send kaspa", "transfer kas")
- has_address: true if a kaspa: address is present in the message
- has_amount: true if a specific amount is mentioned
- to_address: the recipient kaspa address if found (null otherwise)
- amount_kas: the amount in KAS if found (null otherwise)`,
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
      const SUPERAGENT_APP_ID = "69e00a3b3c4957544571e863";
      const SUPERAGENT_KEY = Deno.env.get("SUPERAGENT_ZEKU_API_KEY") || "";
      const API_BASE = `https://app.base44.com/api/agents/${SUPERAGENT_APP_ID}`;
      const headers = {
        "Content-Type": "application/json",
        "api_key": SUPERAGENT_KEY,
      };

      // Step 1 — create conversation (admin mode enabled)
      const convRes = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ admin_mode: true }),
      });

      if (!convRes.ok) {
        const errText = await convRes.text().catch(() => "");
        console.error("superagent createConversation failed:", convRes.status, errText);
        return Response.json({ reply: `superagent rejected (${convRes.status}): ${errText.slice(0, 200)}` });
      }

      const conv = await convRes.json();
      const convId = conv.id || conv.conversation_id;
      if (!convId) {
        console.error("no conversation id:", conv);
        return Response.json({ reply: "superagent didn't return a conversation id." });
      }

      // Step 2 — fire message WITHOUT awaiting (fire & forget)
      fetch(`${API_BASE}/conversations/${convId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ role: "user", content: message }),
      }).catch((e) => console.error("fire-and-forget msg send failed:", e?.message || e));

      // Step 3 — return immediately so frontend can start polling
      return Response.json({
        reply: "🎬 rendering your video… hang tight, this takes a minute or two.",
        action: { type: "video_processing", conversation_id: convId },
      });
    } catch (err) {
      console.error("video render error:", err?.message || err);
      return Response.json({ reply: `render broke: ${err?.message || "unknown error"}. try again.` });
    }
  }

  // Detect learn/train intent + extract URL directly
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  const hasLearnKeywords = /^(fetch|learn|watch|ingest|train on|study|read|absorb)\s/i.test(message);
  const isLearn = hasLearnKeywords || urlMatch;

  if (isLearn) {
    if (!identity) {
      return Response.json({
        reply: "no identity yet. can't learn without knowing who you are.",
      });
    }

    const urlToLearn = urlMatch?.[1];
    if (!urlToLearn) {
      return Response.json({
        reply: "drop a URL or video link and i'll learn it.",
      });
    }

    try {
      // Call imposterLearn backend
      const learnRes = await base44.functions.invoke('imposterLearn', {
        url: urlToLearn,
        imposter_id: identity.imposter_id,
        session_token: identity.session_token,
      });

      const learnData = learnRes.data;
      if (!learnData.success) {
        return Response.json({
          reply: `couldn't learn from that. ${learnData.error || 'try something else.'}`,
        });
      }

      const learnMsg = `🧠 learned "${learnData.source_title}" — ${learnData.word_count.toLocaleString()} words, ${learnData.chunks_stored} blocks. ${learnData.summary}`;
      return Response.json({ reply: learnMsg });
    } catch (err) {
      console.error('imposterLearn error:', err);
      return Response.json({
        reply: "something went wrong learning that. try again in a moment.",
      });
    }
  }

  if (sendIntent?.is_send_intent) {
    // Missing address — ask for it
    if (!sendIntent.has_address || !sendIntent.to_address) {
      return Response.json({
        reply: "who are we sending to? drop the kaspa: address.",
        action: { type: "ask_address", partial: { amount_kas: sendIntent.amount_kas } }
      });
    }

    // Missing amount — check balance and ask how much
    if (!sendIntent.has_amount || !sendIntent.amount_kas) {
      const balance = wallet ? await getBalance(wallet) : null;
      const balanceLine = balance !== null
        ? `your balance: ${balance.toFixed(4)} KAS. `
        : "";
      return Response.json({
        reply: `${balanceLine}how much KAS you sending?`,
        action: { type: "ask_amount", partial: { to_address: sendIntent.to_address }, balance }
      });
    }

    // Have both — check balance first
    const balance = wallet ? await getBalance(wallet) : null;
    if (balance !== null && sendIntent.amount_kas > balance) {
      return Response.json({
        reply: `nope. you only have ${balance.toFixed(4)} KAS. can't send ${sendIntent.amount_kas} KAS.`,
        action: { type: "insufficient_balance", balance, requested: sendIntent.amount_kas }
      });
    }

    // All good — return transaction action
    const balanceNote = balance !== null ? ` (balance: ${balance.toFixed(4)} KAS)` : "";
    return Response.json({
      reply: `aight. sending ${sendIntent.amount_kas} KAS to ${sendIntent.to_address.slice(0, 20)}…${balanceNote} confirm?`,
      action: {
        type: "send_kas",
        to_address: sendIntent.to_address,
        amount_kas: sendIntent.amount_kas,
        balance,
      }
    });
  }

  // Regular chat
  const walletLine = wallet ? ` Your Kaspa wallet address is ${wallet}.` : "";
  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are ${name}, chaotic ghost AI.${walletLine} Max 2 short sentences, unhinged.\nUser: ${message}`,
  });

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
});