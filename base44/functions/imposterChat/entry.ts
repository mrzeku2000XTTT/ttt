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
  try {
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

    // Video / deck intent — disabled (Superagent rendering removed)
    const hasVideoOrDeckKeywords = /\b(\d+)?\s*-?\s*slide\b/i.test(message)
      || /\b(deck|slideshow|slide\s*deck|presentation|slides)\b/i.test(message)
      || /\b(make|create|generate|render|produce|do)\b.*\b(video|mp4|animation|clip|ad|advert|commercial|reel|short)\b/i.test(message)
      || /\bvideo\s+(about|for|of|showing|that|based\s+on)\b/i.test(message);

    if (hasVideoOrDeckKeywords) {
      return Response.json({
        reply: "🎬 video/deck rendering lives in AI Studio. tap below to open it.",
        action: { type: "open_external", url: "https://ai.studio/apps/8ee01fa0-a21b-4ac2-90d5-3a4bdf39a241", label: "Open HyperFrames Studio" },
      });
    }

    // Image intent
    const hasImageKeywords = /\b(make|create|generate|render|produce|draw|design|give me|show me)\b.*\b(image|picture|pic|photo|art|artwork|drawing|illustration|poster|meme|logo|wallpaper|portrait|scene)\b/i.test(message)
      || /\b(image|picture|pic|photo|art|artwork|drawing|illustration|poster|meme|logo|wallpaper)\s+(of|about|for|showing|that|with)\b/i.test(message);

    if (hasImageKeywords) {
      try {
        const cleanPrompt = message
          .replace(/^\s*(hey|yo|please|pls|can you|could you|i want you to|go|now)\s+/i, "")
          .replace(/^\s*(make|create|generate|render|produce|draw|design|give me|show me)\s+(me\s+)?(an?|the)?\s*/i, "")
          .trim() || message;

        const img = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: cleanPrompt });
        const imageUrl = img?.url;
        if (!imageUrl) return Response.json({ reply: "render came back empty. try again with more detail." });
        return Response.json({
          reply: "🖼️ here.",
          action: { type: "image_ready", image_url: imageUrl, prompt: cleanPrompt },
        });
      } catch (err) {
        console.error("image gen error:", err?.message || err);
        return Response.json({ reply: "image generator choked. try again." });
      }
    }

    // Learn intent
    const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
    const hasLearnKeywords = /^(fetch|learn|watch|ingest|train on|study|read|absorb)\s/i.test(message);
    const isLearn = hasLearnKeywords || urlMatch;

    if (isLearn) {
      if (!identity) return Response.json({ reply: "no identity yet. can't learn without knowing who you are." });
      const urlToLearn = urlMatch?.[1];
      if (!urlToLearn) return Response.json({ reply: "drop a URL or video link and i'll learn it." });
      try {
        const learnRes = await base44.functions.invoke('imposterLearn', {
          url: urlToLearn,
          imposter_id: identity.imposter_id,
          session_token: identity.session_token,
        });
        const learnData = learnRes.data;
        if (!learnData.success) return Response.json({ reply: `couldn't learn from that. ${learnData.error || 'try something else.'}` });
        return Response.json({ reply: `🧠 learned "${learnData.source_title}" — ${learnData.word_count.toLocaleString()} words, ${learnData.chunks_stored} blocks. ${learnData.summary}` });
      } catch {
        return Response.json({ reply: "something went wrong learning that. try again in a moment." });
      }
    }

    // Send KAS intent
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
    const imageNote = attachedImages.length > 0 ? `\nThe user attached ${attachedImages.length} image(s). React to them in your chaotic ghost style.` : "";
    const llmParams = {
      prompt: `You are ${name}, chaotic ghost AI.${walletLine}${imageNote} Max 2 short sentences, unhinged.\nUser: ${message}`,
    };
    if (attachedImages.length > 0) llmParams.file_urls = attachedImages;
    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM(llmParams);

    return Response.json({ reply: typeof reply === "string" ? reply : "..." });
  } catch (err) {
    console.error("imposterChat error:", err?.message || err);
    return Response.json({ reply: "something broke in the void. try again." }, { status: 200 });
  }
});