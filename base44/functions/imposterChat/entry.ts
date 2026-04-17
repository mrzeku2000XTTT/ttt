import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
      const RENDER_BASE = "https://kaspa-69e00a3b3c4957544571e863.base44.app";
      const RENDER_API_KEY = Deno.env.get("KAI_HYPERFRAMES_API_KEY") || "";
      const renderHeaders = {
        "Content-Type": "application/json",
        "api_key": RENDER_API_KEY,
      };

      // Extract duration + style from the message
      const durationMatch = message.match(/(\d+)\s*(?:sec|second|s\b)/i);
      const duration = durationMatch ? Math.min(60, Math.max(5, parseInt(durationMatch[1]))) : 15;

      let style = "kaspa";
      if (/\bneon\b/i.test(message)) style = "neon";
      else if (/\bdark\b/i.test(message)) style = "dark";
      else if (/\blight\b/i.test(message)) style = "light";

      // Step 1: create render job
      const createRes = await fetch(`${RENDER_BASE}/api/apps/69e00a3b3c4957544571e863/functions/kaiHyperFrames`, {
        method: "POST",
        headers: renderHeaders,
        body: JSON.stringify({
          prompt: message,
          title: "Imposter Render",
          duration,
          style,
          resolution: "1920x1080",
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text().catch(() => "");
        console.error("render create failed:", createRes.status, errText);
        return Response.json({ reply: `render endpoint rejected the job (${createRes.status}). try again.` });
      }

      const createData = await createRes.json();
      const recordId = createData.record_id || createData.id;
      if (!recordId) {
        return Response.json({ reply: "no record_id came back. render failed." });
      }

      // Step 2: poll for completion (up to ~90s)
      let videoUrl = null;
      let errored = false;
      for (let i = 0; i < 18; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const pollRes = await fetch(`${RENDER_BASE}/api/apps/69e00a3b3c4957544571e863/functions/kaiHyperFrames?record_id=${recordId}`, {
          headers: renderHeaders,
        });
        if (!pollRes.ok) continue;
        const pollData = await pollRes.json();
        if (pollData.status === "done" && pollData.video_url) {
          videoUrl = pollData.video_url;
          break;
        }
        if (pollData.status === "error") {
          errored = true;
          break;
        }
      }

      if (errored) {
        return Response.json({ reply: "render failed on the backend. give it another shot." });
      }
      if (!videoUrl) {
        return Response.json({
          reply: `🎬 still rendering. check back in a minute — job id: ${recordId}`,
          action: { type: "video_pending", record_id: recordId },
        });
      }

      return Response.json({
        reply: `🎬 your video is ready: ${videoUrl}`,
        action: { type: "video_ready", video_url: videoUrl, record_id: recordId },
      });
    } catch (err) {
      console.error("video render error:", err);
      return Response.json({ reply: "render broke mid-flight. try again." });
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