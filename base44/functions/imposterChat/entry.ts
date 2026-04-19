import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const KASPA_API = 'https://api.kaspa.org';
const KAI_APP_ID = '69e00a3b3c4957544571e863';
const KAI_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const KAI_AGENTS_BASE = `https://app.base44.com/api/agents/${KAI_APP_ID}`;
const KAI_HYPERFRAMES_URL = `https://app.base44.com/api/apps/${KAI_APP_ID}/functions/kaiHyperFrames`;

const ALLOWED_STYLES = new Set(["kaspa", "fire", "neon", "luxury", "ocean", "minimal"]);

// Fire a render job to kaiHyperFrames per spec. Returns { record_id, ... }.
async function triggerHyperFramesRender(body) {
  const apiKey = Deno.env.get("KAI_HYPERFRAMES_API_KEY");
  const res = await fetch(KAI_HYPERFRAMES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'api_key': apiKey } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`kaiHyperFrames ${res.status}: ${errText.slice(0, 300)}`);
  }
  return await res.json();
}

// Create a real Superagent conversation — required by kaiHyperFrames spec.
async function createKaiConversation(title = 'Video Render Job') {
  const res = await fetch(`${KAI_AGENTS_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api_key': KAI_API_KEY },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
  const data = await res.json();
  return data.id || data.conversation_id;
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

    // Slide-deck intent (most specific)
    const hasDeckKeywords = /\b(\d+)?\s*-?\s*slide\b/i.test(message)
      || /\b(deck|slideshow|slide\s*deck|presentation|slides)\b/i.test(message);

    if (hasDeckKeywords) {
      try {
        const deckSpec = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `User request: "${message}"\n\nGenerate a slide deck plan. Create 3-8 slides with vivid visual prompts.\n\nRules:\n- title: short punchy (max 60 chars)\n- description: one-sentence summary\n- style: pick ONE from [kaspa, fire, neon, luxury, ocean, minimal]\n- slides: 3-8 slides (match any explicit count in the request)\n- Each slide.prompt: cinematic visual description (2-3 sentences)\n- Each slide.duration: 4-8 seconds\n- Slides flow as a story: hook → build → payoff`,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              style: { type: "string", enum: ["kaspa", "fire", "neon", "luxury", "ocean", "minimal"] },
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    prompt: { type: "string" },
                    duration: { type: "number" },
                  },
                  required: ["prompt", "duration"],
                },
              },
            },
            required: ["title", "style", "slides"],
          },
        });

        if (!deckSpec?.slides?.length) {
          return Response.json({ reply: "couldn't figure out what the deck should be. try: 'make me a 5-slide deck about kaspa staking'" });
        }

        const style = ALLOWED_STYLES.has(deckSpec.style) ? deckSpec.style : "kaspa";

        // Real Superagent conversation required by spec
        let convId;
        try { convId = await createKaiConversation(`Deck: ${deckSpec.title}`); } catch (err) {
          console.error("deck conv create error:", err?.message || err);
          return Response.json({ reply: "couldn't kick off the deck render. try again." });
        }

        // Single POST per spec — deck mode with slides[]
        let renderData;
        try {
          renderData = await triggerHyperFramesRender({
            title: deckSpec.title,
            style,
            conversation_id: convId,
            prompt: deckSpec.description || deckSpec.title,
            slides: deckSpec.slides.map((s, idx) => ({
              order: idx + 1,
              prompt: s.prompt,
              duration: Math.min(8, Math.max(4, s.duration || 5)),
              style,
            })),
          });
        } catch (err) {
          console.error("kaiHyperFrames deck trigger error:", err?.message || err);
          return Response.json({ reply: "render endpoint didn't respond. try again." });
        }

        if (!renderData?.record_id) {
          return Response.json({ reply: "deck render didn't queue. try again." });
        }

        const totalDuration = deckSpec.slides.reduce((sum, s) => sum + (s.duration || 5), 0);
        return Response.json({
          reply: `🎬 Building **${deckSpec.title}** — ${deckSpec.slides.length} slides, ~${totalDuration}s. Dropping the link here when it's done.`,
          action: {
            type: "video_rendering",
            record_id: renderData.record_id,
            conversation_id: renderData.conversation_id || convId,
          },
        });
      } catch (err) {
        console.error("deck gen error:", err?.message || err);
        return Response.json({ reply: "something broke building the deck. try again with a clearer topic." });
      }
    }

    // Single video intent
    const hasVideoKeywords = /\b(make|create|generate|render|produce|do)\b.*\b(video|mp4|animation|clip|ad|advert|commercial|reel|short)\b/i.test(message)
      || /\bvideo\s+(about|for|of|showing|that|based\s+on)\b/i.test(message);

    if (hasVideoKeywords) {
      const durationMatch = message.match(/(\d+)\s*(?:sec|second|s\b)/i);
      const duration = durationMatch ? Math.min(60, Math.max(5, parseInt(durationMatch[1]))) : 15;
      let style = "kaspa";
      if (/\bneon\b/i.test(message)) style = "neon";
      else if (/\bfire\b/i.test(message)) style = "fire";
      else if (/\bluxury\b/i.test(message)) style = "luxury";
      else if (/\bocean\b/i.test(message)) style = "ocean";
      else if (/\bminimal\b/i.test(message)) style = "minimal";
      const title = message.split(/\s+/).slice(0, 6).join(" ").slice(0, 60) || "Imposter Video";

      // Real Superagent conversation required by spec
      let convId = conversation_state?.conversation_id || null;
      if (!convId) {
        try { convId = await createKaiConversation(); } catch (err) {
          console.error("create conversation error:", err?.message || err);
          return Response.json({ reply: "couldn't kick off the render. try again." });
        }
      }

      const body = { prompt: message, title, duration, style, conversation_id: convId };
      if (attachedImages.length > 0) body.image_urls = attachedImages;

      let renderData;
      try {
        renderData = await triggerHyperFramesRender(body);
      } catch (err) {
        console.error("kaiHyperFrames trigger error:", err?.message || err);
        return Response.json({ reply: "render endpoint didn't respond. try again." });
      }

      if (!renderData?.record_id) {
        return Response.json({ reply: "render job didn't start. try again." });
      }

      return Response.json({
        reply: "🎬 rendering your video… hang tight, about 60 seconds",
        action: {
          type: "video_rendering",
          record_id: renderData.record_id,
          conversation_id: renderData.conversation_id || convId,
        },
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