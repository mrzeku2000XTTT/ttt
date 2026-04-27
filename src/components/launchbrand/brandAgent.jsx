import { base44 } from "@/api/base44Client";

/**
 * Brand Agent — guided wizard that decides the next action
 * based on the current Brand state and the user's latest message.
 *
 * Stages:
 *  discovery → naming → identity → voice → logo → social → complete
 */

const STAGE_PROMPTS = {
  discovery: `You are a friendly brand strategist. The user wants to build a brand.
Ask ONE focused question to understand: what they're building, who it's for, and the vibe.
Be warm, brief (2-3 sentences max), and end with a clear question.`,

  naming: `Generate 5 distinct, memorable brand name candidates based on what the user described.
Each name should be short (1-2 words), brandable, and easy to remember.
Return JSON.`,

  identity: `Generate a 5-color brand palette as hex codes that fits the brand vibe.
Return one primary, one accent, one dark, one light, one neutral.
Return JSON.`,

  voice: `Define the brand voice: tone (3-4 adjectives), and a 2-sentence voice description.
Return JSON.`,

  logo: `Create a detailed image generation prompt for a clean, modern, iconic logo for this brand.
The logo should work as an app icon. Describe style, shape, colors (use the palette), mood.`,

  social: `Write 3 social bios (Twitter 160 chars, Instagram 150 chars, LinkedIn 220 chars) and one hero tagline.
Keep them sharp, on-brand, and audience-aligned.
Return JSON.`,
};

export async function runBrandAgent({ brand, userMessage, history }) {
  const stage = brand.stage || "discovery";

  // Step the stage forward when the user confirms
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
  // Have enough info? Use LLM to decide
  const convo = history.map(m => `${m.role}: ${m.content}`).join("\n");

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.discovery}

Conversation so far:
${convo}
user: ${userMessage}

Decide:
- If you have enough info (what it is, who it's for, vibe) → set ready=true, summarize as "description", "target_audience", "industry".
- Otherwise → set ready=false and ask the next question in "reply".`,
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

  if (res?.ready) {
    return {
      messages: [{
        role: "assistant",
        kind: "text",
        content: `Got it. Building you ${res.industry || "a brand"} for ${res.target_audience || "your audience"}. Let me brainstorm names...`,
      }],
      brandUpdates: {
        description: res.description,
        target_audience: res.target_audience,
        industry: res.industry,
        stage: "naming",
        completion: 15,
      },
      autoAdvance: true,
    };
  }

  return {
    messages: [{ role: "assistant", kind: "text", content: res.reply || "Tell me more about what you're building." }],
    brandUpdates: {},
  };
}

async function handleNaming(brand, userMessage) {
  // If user picked a name from a previous suggestion
  if (userMessage && userMessage.length < 40 && /^[a-zA-Z0-9 ]+$/.test(userMessage)) {
    return {
      messages: [{
        role: "assistant",
        kind: "text",
        content: `"${userMessage}" — locked in. Now generating your color palette...`,
      }],
      brandUpdates: { name: userMessage, stage: "identity", completion: 30 },
      autoAdvance: true,
    };
  }

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.naming}

Brand: ${brand.description}
Audience: ${brand.target_audience}
Industry: ${brand.industry}`,
    response_json_schema: {
      type: "object",
      properties: {
        names: { type: "array", items: { type: "string" } },
      },
    },
  });

  return {
    messages: [
      { role: "assistant", kind: "text", content: "Here are 5 name ideas. Pick one or tell me to try again:" },
      { role: "assistant", kind: "names", content: "Name suggestions", data: { names: res.names || [] } },
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

  const palette = res.palette || ["#06b6d4", "#a855f7", "#0a0a0a", "#fafafa", "#71717a"];

  return {
    messages: [
      { role: "assistant", kind: "text", content: `Your palette for ${brand.name}:` },
      { role: "assistant", kind: "palette", content: "Brand palette", data: { palette } },
      { role: "assistant", kind: "text", content: "Locking it in and crafting your voice..." },
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

  const voiceText = `${(res.tone || []).join(" · ")}\n\n${res.voice || ""}`;

  return {
    messages: [
      { role: "assistant", kind: "voice", content: "Brand voice", data: { tone: res.tone, voice: res.voice } },
      { role: "assistant", kind: "text", content: "Now generating your logo — this takes a few seconds..." },
    ],
    brandUpdates: { voice: voiceText, stage: "logo", completion: 60 },
    autoAdvance: true,
  };
}

async function handleLogo(brand) {
  const promptRes = await base44.integrations.Core.InvokeLLM({
    prompt: `${STAGE_PROMPTS.logo}

Brand: ${brand.name}
Description: ${brand.description}
Palette: ${(brand.palette || []).join(", ")}
Voice: ${brand.voice}

Return only the image prompt as a single string.`,
  });

  const imagePrompt = typeof promptRes === "string" ? promptRes : (promptRes?.prompt || `Modern minimalist logo for ${brand.name}`);

  const imgRes = await base44.integrations.Core.GenerateImage({
    prompt: `${imagePrompt}. Centered, vector-style, clean white background, app-icon ready, premium brand mark.`,
  });

  const logo_url = imgRes?.url || "";

  return {
    messages: [
      { role: "assistant", kind: "logo", content: "Your logo", data: { url: logo_url, prompt: imagePrompt } },
      { role: "assistant", kind: "text", content: "Logo done. Writing your social bios + tagline..." },
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
          twitter: res.twitter,
          instagram: res.instagram,
          linkedin: res.linkedin,
          tagline: res.tagline,
          hero_copy: res.hero_copy,
        },
      },
      {
        role: "assistant",
        kind: "summary",
        content: `${brand.name} is ready. Ask me anything to refine — change the logo, rework copy, regenerate the palette, or draft a launch email.`,
      },
    ],
    brandUpdates: {
      tagline: res.tagline,
      hero_copy: res.hero_copy,
      social_bios: {
        twitter: res.twitter,
        instagram: res.instagram,
        linkedin: res.linkedin,
      },
      stage: "complete",
      completion: 100,
    },
  };
}

async function handleFreeChat(brand, userMessage, history) {
  const intent = await base44.integrations.Core.InvokeLLM({
    prompt: `User has a complete brand and is asking for a refinement.
Brand: ${JSON.stringify({ name: brand.name, description: brand.description, palette: brand.palette, voice: brand.voice })}

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
        prompt: `Write a launch announcement email for the brand "${brand.name}". Tagline: "${brand.tagline}". Voice: ${brand.voice}. Subject + body, under 150 words total.`,
      });
      return {
        messages: [{ role: "assistant", kind: "text", content: typeof email === "string" ? email : (email?.body || "Draft ready.") }],
        brandUpdates: {},
      };
    }
    default:
      return {
        messages: [{ role: "assistant", kind: "text", content: intent?.reply || "I can regenerate the logo, rework the palette, rewrite bios, or draft a launch email — what next?" }],
        brandUpdates: {},
      };
  }
}