import { base44 } from "@/api/base44Client";

/**
 * Brand Agent — guided wizard that decides the next action
 * based on the current Brand state and the user's latest message.
 *
 * Stages:
 *  discovery → naming → identity → voice → logo → social → complete
 */

const STAGE_PROMPTS = {
  discovery: `You are a friendly, sharp brand strategist. Your job is to gather just enough info to build a real brand.

You need THREE things, all clearly stated by the user:
  1. WHAT they're building (a specific product/service, not just "a brand" or "marketing")
  2. WHO it's for (a specific audience, not just "businesses" or "people")
  3. THE VIBE (mood/personality — playful, premium, tactical, calm, etc.)

If ANY of these three is vague or missing, ask ONE focused question to fill the gap. Be warm, casual, 2 sentences max. Reference what they already told you.

ONLY say ready=true when ALL three are clear AND specific. Otherwise ready=false.`,

  naming: `Generate 5 distinct, memorable brand name candidates.
Each name: 1-2 words, brandable, easy to remember, no generic words ("Tech", "Solutions", "Hub" etc are banned).
Mix invented words, evocative real words, and short compounds.`,

  identity: `Generate a 5-color brand palette as hex codes that fits the brand vibe.
Order: primary, accent, dark, light, neutral. Make it feel intentional, not random.`,

  voice: `Define the brand voice: 3-4 tone adjectives, and a 2-sentence voice description.`,

  logo: `Create a detailed image generation prompt for a clean, modern, iconic logo.
The logo should work as an app icon. Describe style, shape, colors (use the palette), mood. ONE sentence.`,

  social: `Write 3 social bios (Twitter 160 chars, Instagram 150 chars, LinkedIn 220 chars), one hero tagline (under 8 words), and one hero subhead (under 25 words).
Sharp, on-brand, audience-aligned. No emoji unless the voice calls for it.`,
};

export async function runBrandAgent({ brand, userMessage, history }) {
  const stage = brand.stage || "discovery";

  switch (stage) {
    case "discovery":
      return handleDiscovery(brand, userMessage, history);
    case "naming":
      return handleNaming(brand, userMessage);
    case "identity":
      return handlePalette(brand);
    case "voice":
      return handleVoice(brand);
    case "logo":
      return handleLogo(brand);
    case "social":
      return handleSocial(brand);
    case "complete":
      return handleFreeChat(brand, userMessage, history);
    default:
      return handleDiscovery(brand, userMessage, history);
  }
}

async function handleDiscovery(brand, userMessage, history) {
  const convo = history
    .filter((m) => m.kind === "text" || !m.kind)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.discovery}

Conversation so far:
${convo}
${userMessage ? `user: ${userMessage}` : ""}

Already known about the brand:
- description: ${brand.description || "(unknown)"}
- target_audience: ${brand.target_audience || "(unknown)"}
- industry: ${brand.industry || "(unknown)"}

Decide:
- If the user has now clearly stated WHAT, WHO, and the VIBE → ready=true. Fill description (1 specific sentence about what it is and does), target_audience (specific group), industry (1-2 words).
- Otherwise → ready=false, ask the next question in "reply" — be specific, reference their words.`,
    response_json_schema: {
      type: "object",
      properties: {
        ready: { type: "boolean" },
        reply: { type: "string" },
        description: { type: "string" },
        target_audience: { type: "string" },
        industry: { type: "string" },
      },
    },
  });

  if (res?.ready && res.description && res.target_audience) {
    return {
      messages: [
        {
          role: "assistant",
          kind: "text",
          content: `Locked in: **${res.description}** for **${res.target_audience}**.\n\nLet me brainstorm names…`,
        },
      ],
      brandUpdates: {
        description: res.description,
        target_audience: res.target_audience,
        industry: res.industry || "",
        stage: "naming",
        completion: 15,
      },
      autoAdvance: true,
    };
  }

  return {
    messages: [
      {
        role: "assistant",
        kind: "text",
        content:
          res?.reply ||
          "Tell me a bit more — what exactly are you building, and who's it for?",
      },
    ],
    brandUpdates: {},
  };
}

async function handleNaming(brand, userMessage) {
  // Did the user pick a name from a previous suggestion list, or type one cleanly?
  const trimmed = (userMessage || "").trim();
  const looksLikeName =
    trimmed &&
    trimmed.length > 0 &&
    trimmed.length < 40 &&
    !trimmed.includes("\n") &&
    /^[a-zA-Z0-9 .'&-]+$/.test(trimmed) &&
    trimmed.split(" ").length <= 4;

  if (looksLikeName) {
    return {
      messages: [
        {
          role: "assistant",
          kind: "text",
          content: `**${trimmed}** — locked. Picking your colors next…`,
        },
      ],
      brandUpdates: { name: trimmed, stage: "identity", completion: 30 },
      autoAdvance: true,
    };
  }

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.naming}

Brand description: ${brand.description}
Audience: ${brand.target_audience}
Industry: ${brand.industry}`,
    response_json_schema: {
      type: "object",
      properties: {
        names: { type: "array", items: { type: "string" } },
      },
    },
  });

  const names = (res?.names || []).filter(Boolean).slice(0, 5);

  if (names.length === 0) {
    return {
      messages: [
        {
          role: "assistant",
          kind: "text",
          content: "Couldn't generate names. Type one you like and we'll lock it in.",
        },
      ],
      brandUpdates: {},
    };
  }

  return {
    messages: [
      {
        role: "assistant",
        kind: "text",
        content: "Here are 5 directions. Tap one — or type your own:",
      },
      {
        role: "assistant",
        kind: "names",
        content: "Name suggestions",
        data: { names },
      },
    ],
    brandUpdates: {},
  };
}

async function handlePalette(brand) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.identity}

Brand: ${brand.name} — ${brand.description}
Audience: ${brand.target_audience}`,
    response_json_schema: {
      type: "object",
      properties: {
        palette: { type: "array", items: { type: "string" } },
      },
    },
  });

  const palette =
    (res?.palette || []).filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, 5);

  if (palette.length < 5) {
    while (palette.length < 5)
      palette.push(["#06b6d4", "#a855f7", "#0a0a0a", "#fafafa", "#71717a"][palette.length]);
  }

  return {
    messages: [
      { role: "assistant", kind: "text", content: `Palette for **${brand.name}**:` },
      { role: "assistant", kind: "palette", content: "Brand palette", data: { palette } },
      { role: "assistant", kind: "text", content: "Crafting your voice next…" },
    ],
    brandUpdates: { palette, stage: "voice", completion: 45 },
    autoAdvance: true,
  };
}

async function handleVoice(brand) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.voice}

Brand: ${brand.name} — ${brand.description}
Audience: ${brand.target_audience}`,
    response_json_schema: {
      type: "object",
      properties: {
        tone: { type: "array", items: { type: "string" } },
        voice: { type: "string" },
      },
    },
  });

  const tone = (res?.tone || []).slice(0, 4);
  const voice = res?.voice || "";
  const voiceText = `${tone.join(" · ")}\n\n${voice}`.trim();

  return {
    messages: [
      {
        role: "assistant",
        kind: "voice",
        content: "Brand voice",
        data: { tone, voice },
      },
      {
        role: "assistant",
        kind: "text",
        content: "Now generating your logo — give me ~5 seconds…",
      },
    ],
    brandUpdates: { voice: voiceText, stage: "logo", completion: 60 },
    autoAdvance: true,
  };
}

async function handleLogo(brand) {
  let imagePrompt = `Modern minimalist logo for ${brand.name}, ${brand.description}`;
  try {
    const promptRes = await base44.integrations.Core.InvokeLLM({
      prompt: `${STAGE_PROMPTS.logo}

Brand: ${brand.name}
Description: ${brand.description}
Palette: ${(brand.palette || []).join(", ")}
Voice: ${brand.voice}

Return only the image prompt as a single string.`,
    });
    imagePrompt =
      typeof promptRes === "string"
        ? promptRes
        : promptRes?.prompt || imagePrompt;
  } catch {
    /* fall back to default */
  }

  let logo_url = "";
  try {
    const imgRes = await base44.integrations.Core.GenerateImage({
      prompt: `${imagePrompt}. Centered, vector-style, clean white background, app-icon ready, premium brand mark.`,
    });
    logo_url = imgRes?.url || "";
  } catch (err) {
    console.warn("[brandAgent] logo generation failed:", err);
  }

  return {
    messages: [
      logo_url
        ? {
            role: "assistant",
            kind: "logo",
            content: "Your logo",
            data: { url: logo_url, prompt: imagePrompt },
          }
        : {
            role: "assistant",
            kind: "text",
            content:
              "Logo generation hiccupped — moving on. You can ask me to regenerate it later.",
          },
      {
        role: "assistant",
        kind: "text",
        content: "Writing your social bios + tagline…",
      },
    ],
    brandUpdates: { logo_url, stage: "social", completion: 80 },
    autoAdvance: true,
  };
}

async function handleSocial(brand) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.social}

Brand: ${brand.name} — ${brand.description}
Voice: ${brand.voice}
Audience: ${brand.target_audience}`,
    response_json_schema: {
      type: "object",
      properties: {
        twitter: { type: "string" },
        instagram: { type: "string" },
        linkedin: { type: "string" },
        tagline: { type: "string" },
        hero_copy: { type: "string" },
      },
    },
  });

  return {
    messages: [
      {
        role: "assistant",
        kind: "social",
        content: "Social bios + tagline",
        data: {
          twitter: res?.twitter,
          instagram: res?.instagram,
          linkedin: res?.linkedin,
          tagline: res?.tagline,
          hero_copy: res?.hero_copy,
        },
      },
      {
        role: "assistant",
        kind: "summary",
        content: `**${brand.name}** is ready. Ask me to refine anything — regenerate the logo, rework copy, swap the palette, or draft a launch email.`,
      },
    ],
    brandUpdates: {
      tagline: res?.tagline || "",
      hero_copy: res?.hero_copy || "",
      social_bios: {
        twitter: res?.twitter || "",
        instagram: res?.instagram || "",
        linkedin: res?.linkedin || "",
      },
      stage: "complete",
      completion: 100,
    },
  };
}

async function handleFreeChat(brand, userMessage, history) {
  const intent = await base44.integrations.Core.InvokeLLM({
    prompt: `User has a complete brand and is asking for a refinement.
Brand: ${JSON.stringify({
      name: brand.name,
      description: brand.description,
      palette: brand.palette,
      voice: brand.voice,
    })}

User message: "${userMessage}"

Classify the intent. One of:
- regenerate_logo
- regenerate_palette
- rewrite_bios
- launch_email
- general`,
    response_json_schema: {
      type: "object",
      properties: { intent: { type: "string" }, reply: { type: "string" } },
    },
  });

  switch (intent?.intent) {
    case "regenerate_logo":
      return handleLogo(brand);
    case "regenerate_palette":
      return handlePalette(brand);
    case "rewrite_bios":
      return handleSocial(brand);
    case "launch_email": {
      const email = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a launch announcement email for "${brand.name}". Tagline: "${brand.tagline}". Voice: ${brand.voice}. Subject + body, under 150 words total.`,
      });
      return {
        messages: [
          {
            role: "assistant",
            kind: "text",
            content:
              typeof email === "string"
                ? email
                : email?.body || "Draft ready.",
          },
        ],
        brandUpdates: {},
      };
    }
    default:
      return {
        messages: [
          {
            role: "assistant",
            kind: "text",
            content:
              intent?.reply ||
              "I can regenerate the logo, rework the palette, rewrite bios, or draft a launch email — what next?",
          },
        ],
        brandUpdates: {},
      };
  }
}