import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.25';

const KASPA_API = 'https://api.kaspa.org';
const KAI_AGENT_ID = '69e00a3b3c4957544571e863';
const KAI_API_KEY = '7d4e7751d1ac406dae4df07533c5e566';
const KAI_BASE_URL = `https://app.base44.com/api/agents/${KAI_AGENT_ID}`;
const KAI_HYPERFRAMES_URL = `https://kais-backend-brain-superagent-for-4571e863.base44.app/functions/kaiHyperFrames`;

async function triggerHyperFramesRender({ prompt, conversation_id, title = "Kai Video", image_urls = [] }) {
  const body = { prompt, title, conversation_id };
  // Attach reference images if provided — kaiHyperFrames uses them as visual input for the render
  if (Array.isArray(image_urls) && image_urls.length > 0) {
    body.image_urls = image_urls;
    body.reference_images = image_urls; // in case the downstream uses a different key
  }
  const res = await fetch(KAI_HYPERFRAMES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

  // Detect slide-deck intent FIRST (most specific — "X-slide deck" / "slideshow" / "presentation")
  const hasDeckKeywords = /\b(\d+)?\s*-?\s*slide\b/i.test(message)
    || /\b(deck|slideshow|slide\s*deck|presentation|slides)\b/i.test(message);

  if (hasDeckKeywords) {
    try {
      const deckSpec = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `User request: "${message}"\n\nGenerate a slide deck video plan. Extract the topic, pick a fitting style, and create 3-8 slides with vivid visual prompts and concise voiceover narration.\n\nRules:\n- title: short and punchy (max 60 chars)\n- description: one-sentence summary\n- style: pick ONE that fits the topic (kaspa for crypto, fire for intense, neon for tech/cyber, luxury for premium, minimal for clean, ocean for calm, dark for moody, auto if unsure)\n- slides: 3-8 slides (match any explicit count in the request, otherwise pick a sensible number)\n- Each slide.prompt: a cinematic visual description (2-3 sentences, describe what you SEE)\n- Each slide.voiceover: narrator text (1-2 sentences, spoken aloud, natural flow)\n- Each slide.duration: 4-8 seconds\n- Slides should flow as a story: hook → build → payoff`,
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
        return Response.json({ reply: "couldn't figure out what the deck should be. try: 'make me a 5-slide deck about kaspa staking'" });
      }

      const totalDuration = deckSpec.slides.reduce((sum, s) => sum + (s.duration || 5), 0);

      // Create SlideDeck record (draft initially — will flip to rendering after Superagent trigger)
      const deck = await base44.entities.SlideDeck.create({
        title: deckSpec.title,
        description: deckSpec.description,
        style: deckSpec.style || "auto",
        status: "draft",
        total_slides: deckSpec.slides.length,
        total_duration: totalDuration,
      });

      // Create Slide records (order starts at 1, matching Superagent payload spec)
      const createdSlides = await Promise.all(deckSpec.slides.map((s, idx) =>
        base44.entities.Slide.create({
          deck_id: deck.id,
          order: idx + 1,
          prompt: s.prompt,
          voiceover: s.voiceover,
          duration: s.duration || 5,
          style: deckSpec.style || "auto",
          status: "pending",
        })
      ));

      // Trigger Superagent render — create conversation + POST SLIDE_RENDER_JOB payload
      try {
        const convRes = await fetch(`${KAI_BASE_URL}/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api_key': KAI_API_KEY },
          body: JSON.stringify({ title: `Deck: ${deckSpec.title}` }),
        });
        if (!convRes.ok) throw new Error(`conv create ${convRes.status}`);
        const convData = await convRes.json();
        const renderConvId = convData.id || convData.conversation_id;

        const sortedSlides = [...createdSlides].sort((a, b) => (a.order || 0) - (b.order || 0));
        const payload = {
          deck_id: deck.id,
          deck_title: deck.title,
          style: deck.style,
          conversation_id: renderConvId,
          slides: sortedSlides.map(s => ({
            id: s.id,
            order: s.order,
            prompt: s.prompt,
            voiceover: s.voiceover,
            duration: s.duration || 5,
            style: s.style || deck.style,
          })),
        };
        const renderContent = `SLIDE_RENDER_JOB: ${JSON.stringify(payload)}`;

        // Fire-and-forget POST to Superagent
        fetch(`${KAI_BASE_URL}/conversations/${renderConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api_key': KAI_API_KEY },
          body: JSON.stringify({ role: "user", content: renderContent }),
        }).catch(err => console.error('slide render send error:', err?.message || err));

        // Flip deck to rendering
        await base44.entities.SlideDeck.update(deck.id, {
          status: "rendering",
          render_log: "🎬 Render queued — Superagent processing...",
        });
      } catch (renderErr) {
        console.error("deck render trigger error:", renderErr?.message || renderErr);
        // Deck stays as draft — user can manually render from builder
      }

      return Response.json({
        reply: `🎬 Building your **${deckSpec.title}** — ${deckSpec.slides.length} slides, ~${totalDuration}s video. Rendering now, I'll drop the link right here when it's ready.`,
        action: {
          type: "deck_ready",
          deck_id: deck.id,
          deck_title: deckSpec.title,
          slide_count: deckSpec.slides.length,
        },
      });
    } catch (err) {
      console.error("deck gen error:", err?.message || err);
      return Response.json({ reply: "something broke building the deck. try again with a clearer topic." });
    }
  }

  // Detect video-generation intent (video is more specific than image)
  const hasVideoKeywords = /\b(make|create|generate|render|produce|do)\b.*\b(video|mp4|animation|clip|ad|advert|commercial|reel|short)\b/i.test(message)
    || /\bvideo\s+(about|for|of|showing|that|based\s+on)\b/i.test(message);

  if (hasVideoKeywords) {
    // Flow: create a Kai conversation → send the video request AS A MESSAGE → Kai agent
    // internally calls kaiHyperFrames and posts the result back. We poll the conversation.
    let convId;
    try {
      convId = await createKaiConversation();
    } catch (err) {
      console.error("create conversation error:", err?.message || err);
      return Response.json({ reply: "couldn't kick off the render. try again." });
    }

    const videoRequest = `Please render a video for me with kaiHyperFrames. Prompt: "${message}". Do NOT apply any Kaspa, crypto, or brand-specific styling unless the prompt explicitly asks for it. Once the video is ready, reply with the .mp4 URL.`;

    // Send the request to Kai — fire-and-forget, frontend will poll the conversation for the video URL
    sendKaiMessage(convId, videoRequest, attachedImages).catch(err =>
      console.error("send kai message error:", err?.message || err)
    );

    return Response.json({
      reply: "🎬 rendering your video… hang tight, this takes about a minute.",
      action: {
        type: "video_processing",
        conversation_id: convId,
      },
    });
  }

  // Detect image-generation intent
  const hasImageKeywords = /\b(make|create|generate|render|produce|draw|design|give me|show me)\b.*\b(image|picture|pic|photo|art|artwork|drawing|illustration|poster|meme|logo|wallpaper|portrait|scene)\b/i.test(message)
    || /\b(image|picture|pic|photo|art|artwork|drawing|illustration|poster|meme|logo|wallpaper)\s+(of|about|for|showing|that|with)\b/i.test(message);

  if (hasImageKeywords) {
    try {
      // Clean the prompt a bit — strip leading command words so the model focuses on the subject
      const cleanPrompt = message
        .replace(/^\s*(hey|yo|please|pls|can you|could you|i want you to|go|now)\s+/i, "")
        .replace(/^\s*(make|create|generate|render|produce|draw|design|give me|show me)\s+(me\s+)?(an?|the)?\s*/i, "")
        .trim() || message;

      const img = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: cleanPrompt,
      });
      const imageUrl = img?.url;
      if (!imageUrl) {
        return Response.json({ reply: "render came back empty. try again with more detail." });
      }
      return Response.json({
        reply: "🖼️ here.",
        action: { type: "image_ready", image_url: imageUrl, prompt: cleanPrompt },
      });
    } catch (err) {
      console.error("image gen error:", err?.message || err);
      return Response.json({ reply: "image generator choked. try again." });
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
  const imageNote = attachedImages.length > 0
    ? `\nThe user attached ${attachedImages.length} image(s). Look at them and react/describe what you see in your chaotic ghost style.`
    : "";
  const llmParams = {
    prompt: `You are ${name}, chaotic ghost AI.${walletLine}${imageNote} Max 2 short sentences, unhinged.\nUser: ${message}`,
  };
  if (attachedImages.length > 0) {
    llmParams.file_urls = attachedImages;
  }
  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM(llmParams);

  return Response.json({ reply: typeof reply === "string" ? reply : "..." });
  } catch (err) {
    console.error("imposterChat error:", err?.message || err);
    return Response.json({ reply: "something broke in the void. try again." }, { status: 200 });
  }
});