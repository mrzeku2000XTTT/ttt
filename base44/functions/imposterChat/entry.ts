import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const KASPA_API = 'https://api.kaspa.org';
// Must use the Superagent app's subdomain, not app.base44.com (platform domain is blocked for backend function calls)
const KAI_HYPERFRAMES_URL = 'https://superagent.base44.app/api/apps/69e00a3b3c4957544571e863/functions/kaiHyperFrames';
const KAI_HYPERFRAMES_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';

async function callHyperFrames(payload) {
  const res = await fetch(KAI_HYPERFRAMES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': KAI_HYPERFRAMES_API_KEY },
    body: JSON.stringify(payload),
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

function genConversationId() {
  // 24-char hex, matches Mongo ObjectId shape Superagent uses elsewhere
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return ts + rand;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, identity, conversation_state, image_urls, conversation_id: incomingConvId } = await req.json();
    const attachedImages = Array.isArray(image_urls) ? image_urls.filter(u => typeof u === "string" && u.startsWith("http")) : [];

    const name = identity?.subagent_name || "IMPOSTER";
    const wallet = identity?.kaspa_address || null;

    // -------------------- SLIDE DECK --------------------
    const hasDeckKeywords = /\b(\d+)?\s*-?\s*slide\b/i.test(message)
      || /\b(deck|slideshow|slide\s*deck|presentation|slides)\b/i.test(message);

    if (hasDeckKeywords) {
      const deckSpec = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `User request: "${message}"\n\nPlan a slide deck video. Extract the topic, pick a fitting style, and create 3-8 slides with vivid visual prompts and concise voiceover narration.\n\nRules:\n- title: short and punchy (max 60 chars)\n- description: one-sentence summary\n- style: pick ONE of kaspa, fire, neon, luxury, minimal, ocean, dark, auto\n- slides: 3-8 (match any explicit count in the request)\n- Each slide.prompt: cinematic visual description (2-3 sentences)\n- Each slide.voiceover: narrator text (1-2 sentences, natural flow)\n- Each slide.duration: 4-8 seconds`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            style: { type: "string", enum: ["kaspa", "fire", "neon", "luxury", "minimal", "ocean", "dark", "auto"] },
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  voiceover: { type: "string" },
                  duration: { type: "number" },
                },
                required: ["prompt", "voiceover", "duration"],
              },
            },
          },
          required: ["title", "description", "style", "slides"],
        },
      });

      if (!deckSpec?.slides?.length) {
        return Response.json({ reply: "couldn't figure out the deck. try: 'make me a 5-slide deck about kaspa staking'" });
      }

      const totalDuration = deckSpec.slides.reduce((sum, s) => sum + (s.duration || 5), 0);
      const convId = incomingConvId || genConversationId();

      // Call kaiHyperFrames directly with the deck payload
      console.log(`[imposterChat] DECK → kaiHyperFrames conv=${convId} slides=${deckSpec.slides.length}`);
      try {
        const hfResult = await callHyperFrames({
          title: deckSpec.title,
          style: deckSpec.style || "kaspa",
          duration: totalDuration,
          conversation_id: convId,
          slides: deckSpec.slides.map((s, idx) => ({
            order: idx + 1,
            prompt: s.prompt,
            voiceover: s.voiceover,
            duration: s.duration || 5,
          })),
          image_urls: attachedImages,
        });
        console.log(`[imposterChat] ✅ deck accepted conv=${convId}:`, JSON.stringify(hfResult).slice(0, 300));
      } catch (hfErr) {
        console.error(`[imposterChat] ❌ deck kaiHyperFrames failed:`, hfErr?.message || hfErr);
        return Response.json({ reply: `render service didn't accept the job (${hfErr?.message || "unknown"}). try again.` });
      }

      return Response.json({
        reply: `🎬 Building your **${deckSpec.title}** — ${deckSpec.slides.length} slides, ~${totalDuration}s. I'll drop the link here when it's ready.`,
        action: { type: "video_processing", conversation_id: convId },
      });
    }

    // -------------------- SINGLE VIDEO --------------------
    const hasVideoKeywords = /\b(make|create|generate|render|produce|do)\b.*\b(video|mp4|animation|clip|ad|advert|commercial|reel|short)\b/i.test(message)
      || /\bvideo\s+(about|for|of|showing|that|based\s+on)\b/i.test(message);

    if (hasVideoKeywords) {
      const convId = incomingConvId || genConversationId();
      console.log(`[imposterChat] VIDEO → kaiHyperFrames conv=${convId} images=${attachedImages.length}`);
      try {
        const hfResult = await callHyperFrames({
          prompt: message,
          title: message.slice(0, 60).trim() || "Imposter Video",
          duration: 15,
          style: "kaspa",
          conversation_id: convId,
          image_urls: attachedImages,
        });
        console.log(`[imposterChat] ✅ video accepted conv=${convId}:`, JSON.stringify(hfResult).slice(0, 300));
      } catch (hfErr) {
        console.error(`[imposterChat] ❌ video kaiHyperFrames failed:`, hfErr?.message || hfErr);
        return Response.json({ reply: `render service didn't accept the job (${hfErr?.message || "unknown"}). try again.` });
      }

      return Response.json({
        reply: "🎬 rendering your video… hang tight, this takes about a minute.",
        action: { type: "video_processing", conversation_id: convId },
      });
    }

    // -------------------- IMAGE --------------------
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

    // -------------------- LEARN --------------------
    const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
    const hasLearnKeywords = /^(fetch|learn|watch|ingest|train on|study|read|absorb)\s/i.test(message);
    if (hasLearnKeywords || urlMatch) {
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

    // -------------------- SEND KAS --------------------
    const sendIntent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this message for a Kaspa send/transfer request.\nMessage: "${message}"\nPrevious state: ${JSON.stringify(conversation_state || {})}\n\nReply ONLY as JSON:\n- is_send_intent: true if user wants to send KAS\n- has_address: true if a kaspa: address is present\n- has_amount: true if a specific amount is mentioned\n- to_address: the recipient kaspa address (null otherwise)\n- amount_kas: the amount in KAS (null otherwise)`,
      response_json_schema: {
        type: "object",
        properties: {
          is_send_intent: { type: "boolean" },
          has_address: { type: "boolean" },
          has_amount: { type: "boolean" },
          to_address: { type: "string" },
          amount_kas: { type: "number" },
        },
        required: ["is_send_intent", "has_address", "has_amount"],
      },
    });

    if (sendIntent?.is_send_intent) {
      if (!sendIntent.has_address || !sendIntent.to_address) {
        return Response.json({
          reply: "who are we sending to? drop the kaspa: address.",
          action: { type: "ask_address", partial: { amount_kas: sendIntent.amount_kas } },
        });
      }
      if (!sendIntent.has_amount || !sendIntent.amount_kas) {
        const balance = wallet ? await getBalance(wallet) : null;
        const balanceLine = balance !== null ? `your balance: ${balance.toFixed(4)} KAS. ` : "";
        return Response.json({
          reply: `${balanceLine}how much KAS you sending?`,
          action: { type: "ask_amount", partial: { to_address: sendIntent.to_address }, balance },
        });
      }
      const balance = wallet ? await getBalance(wallet) : null;
      if (balance !== null && sendIntent.amount_kas > balance) {
        return Response.json({
          reply: `nope. you only have ${balance.toFixed(4)} KAS. can't send ${sendIntent.amount_kas} KAS.`,
          action: { type: "insufficient_balance", balance, requested: sendIntent.amount_kas },
        });
      }
      const balanceNote = balance !== null ? ` (balance: ${balance.toFixed(4)} KAS)` : "";
      return Response.json({
        reply: `aight. sending ${sendIntent.amount_kas} KAS to ${sendIntent.to_address.slice(0, 20)}…${balanceNote} confirm?`,
        action: { type: "send_kas", to_address: sendIntent.to_address, amount_kas: sendIntent.amount_kas, balance },
      });
    }

    // -------------------- CHAT --------------------
    const walletLine = wallet ? ` Your Kaspa wallet address is ${wallet}.` : "";
    const imageNote = attachedImages.length > 0 ? `\nThe user attached ${attachedImages.length} image(s). React in your chaotic ghost style.` : "";
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