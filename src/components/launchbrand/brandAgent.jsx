import { base44 } from "@/api/base44Client";
import { tryColorEdit, refineCopy, detectRefineTarget } from "@/components/launchbrand/vibeCoder";

/**
 * Brand Agent — guided wizard that decides the next action
 * based on the current Brand state and the user's latest message.
 *
 * Stages:
 *  discovery → naming → identity → voice → logo → social → broll → complete
 *
 * In discovery, if the user pastes a URL, the agent scrapes the site
 * (root + up to 5 subpages) and uses it to fill description/audience/industry
 * + visual_keywords for the b-roll stage.
 */

const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s)<>"]+|[a-z0-9-]+\.(?:com|net|org|io|ai|co|app|dev|xyz|tech|store|shop|me|so|gg)(?:\/[^\s)<>"]*)?)\b/i;

function extractUrl(text) {
  if (!text) return null;
  const m = text.match(URL_REGEX);
  if (!m) return null;
  let u = m[1];
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u).toString(); } catch { return null; }
}

const STAGE_PROMPTS = {
  discovery: `You are a fast, decisive brand strategist. Your job is to gather just enough info to build a real brand without annoying the user.

Extract or infer THREE things:
  1. WHAT they're building
  2. WHO it's for
  3. THE VIBE

If the user gives enough context to make a reasonable assumption, set ready=true and move forward. Do NOT ask the same question twice. Do NOT demand a perfect one-sentence summary.

Only ask one short follow-up when the product itself is completely unclear.`, 

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
    case "broll":
      return handleBroll(brand);
    case "complete":
      return handleFreeChat(brand, userMessage, history);
    default:
      return handleDiscovery(brand, userMessage, history);
  }
}

async function handleDiscovery(brand, userMessage, history) {
  // ── URL fast-path: if the user pastes a URL, scrape the site
  // (root + up to 5 subpages) and synthesize discovery fields from it.
  const url = extractUrl(userMessage);
  if (url) {
    return handleUrlDiscovery(brand, url);
  }

  const userTurns = history.filter((m) => m.role === "user" && m.content);
  const convo = history
    .filter((m) => m.kind === "text" || !m.kind)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  const userCorpus = userTurns.map((m) => m.content).join(" ").trim();
  const userIsFrustrated = /\b(stfu|shut up|fuck|fucking|already told|i told|stop asking|same questions?|you keep asking)\b/i.test(userMessage || "");

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
- If there is enough information to infer WHAT, WHO, and VIBE → ready=true. Fill description (1 specific sentence about what it is and does), target_audience (specific group), industry (1-2 words).
- Otherwise → ready=false, ask the next question in "reply" — never repeat a previous question.`,
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

  if (userIsFrustrated || userTurns.length >= 2) {
    const description = res?.description || brand.description || userCorpus.slice(0, 220) || "A new digital brand";
    const targetAudience = res?.target_audience || brand.target_audience || "early users and customers";

    return {
      messages: [
        {
          role: "assistant",
          kind: "text",
          content: `Got it — I’ll stop asking and move forward with what I have.\n\nLocked in: **${description}** for **${targetAudience}**.\n\nLet me brainstorm names…`,
        },
      ],
      brandUpdates: {
        description,
        target_audience: targetAudience,
        industry: res?.industry || brand.industry || "Digital",
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
          "What are you building, and who should use it?",
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
      stage: "broll",
      completion: 88,
    },
    autoAdvance: true,
  };
}

async function handleUrlDiscovery(brand, url) {
  let scraped;
  try {
    const resp = await base44.functions.invoke("brandSiteScraper", { url });
    scraped = resp?.data;
    if (!scraped || scraped.error) throw new Error(scraped?.error || "scrape_failed");
  } catch (err) {
    return {
      messages: [
        {
          role: "assistant",
          kind: "text",
          content: `Couldn't load that URL (${err.message || "fetch failed"}). Want to describe the brand in your own words?`,
        },
      ],
      brandUpdates: {},
    };
  }

  // Build a corpus from root + subpages
  const corpus = [
    `URL: ${scraped.url}`,
    `Title: ${scraped.title}`,
    `Meta description: ${scraped.description}`,
    `Site name: ${scraped.site_name || ""}`,
    `\nROOT PAGE TEXT:\n${scraped.root_text || ""}`,
    ...((scraped.sub_pages || []).map((p) => `\n--- SUBPAGE: ${p.url} (${p.label || p.title})\n${p.text || ""}`)),
  ]
    .join("\n")
    .slice(0, 18000);

  const synth = await base44.integrations.Core.InvokeLLM({
    prompt: `You're a brand strategist analyzing a real website's content. Pull out everything needed to rebuild the brand.

${corpus}

Return:
- name: the brand name (from the site title or content). If unclear, leave blank.
- description: 1 specific sentence about what they do.
- target_audience: a specific group, not "businesses" or "people".
- industry: 1-2 words.
- tone: 3-4 adjectives describing the existing brand voice.
- visual_keywords: 8-12 short visual descriptors useful for generating b-roll imagery (e.g. "neon city", "soft daylight on linen", "macro shots of circuitry"). These should match the brand's actual aesthetic from the site.
- existing_palette: up to 5 hex colors you can infer from the site's described/likely look. If unsure, leave empty.`,
    response_json_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        target_audience: { type: "string" },
        industry: { type: "string" },
        tone: { type: "array", items: { type: "string" } },
        visual_keywords: { type: "array", items: { type: "string" } },
        existing_palette: { type: "array", items: { type: "string" } },
      },
    },
  });

  if (!synth?.description || !synth?.target_audience) {
    return {
      messages: [
        {
          role: "assistant",
          kind: "text",
          content: "I scraped the site but couldn't pull enough signal. Tell me in one line what they do and who it's for.",
        },
      ],
      brandUpdates: { source_url: scraped.url },
    };
  }

  const updates = {
    source_url: scraped.url,
    description: synth.description,
    target_audience: synth.target_audience,
    industry: synth.industry || "",
    visual_keywords: (synth.visual_keywords || []).slice(0, 12),
    stage: "naming",
    completion: 20,
  };
  if (synth.name && synth.name.length < 40) {
    updates.name = synth.name;
    updates.stage = "identity";
    updates.completion = 32;
  }

  const subCount = (scraped.sub_pages || []).length;
  return {
    messages: [
      {
        role: "assistant",
        kind: "text",
        content: `Read **${scraped.url}**${subCount ? ` + ${subCount} subpage${subCount === 1 ? "" : "s"}` : ""}.\n\n**${updates.name || "Brand"}** — ${synth.description}\nFor: ${synth.target_audience}\n\n${updates.name ? "Picking colors next…" : "Now let's name it…"}`,
      },
    ],
    brandUpdates: updates,
    autoAdvance: true,
  };
}

async function handleBroll(brand) {
  const palette = (brand.palette || []).slice(0, 5);
  const visualKeywords = (brand.visual_keywords || []).slice(0, 12);

  // Get 10 distinct cinematic b-roll prompts tied to this brand
  const prompts = await base44.integrations.Core.InvokeLLM({
    prompt: `Generate 10 distinct cinematic b-roll image prompts for this brand. Each should feel like a frame from a hero motion video — moody, premium, in motion. Variety across: macro, wide, human, abstract, product, environment.

Brand: ${brand.name}
What they do: ${brand.description}
Audience: ${brand.target_audience}
Voice: ${brand.voice}
Palette (use these colors): ${palette.join(", ")}
Visual keywords: ${visualKeywords.join(", ")}

Each prompt: 1 sentence, vivid, specific lighting + composition + subject. NO text overlays. Cinematic, photographic or stylized illustration as fits the brand.`,
    response_json_schema: {
      type: "object",
      properties: {
        prompts: { type: "array", items: { type: "string" } },
      },
    },
  });

  const list = (prompts?.prompts || []).filter(Boolean).slice(0, 10);
  const filled = [...list];
  while (filled.length < 10) {
    filled.push(`Cinematic b-roll for ${brand.name}: ${visualKeywords[filled.length % Math.max(1, visualKeywords.length)] || brand.description}, dramatic lighting, ${palette[0] || "#06b6d4"} accent`);
  }

  // Generate all 10 in parallel — failures are OK
  const generated = await Promise.all(
    filled.map(async (p) => {
      try {
        const r = await base44.integrations.Core.GenerateImage({
          prompt: `${p}. Cinematic, premium, no text, no watermarks, high contrast, color grade matching palette ${palette.join(" / ")}.`,
        });
        return r?.url || null;
      } catch {
        return null;
      }
    })
  );

  const broll_images = generated.filter(Boolean);

  return {
    messages: [
      {
        role: "assistant",
        kind: "broll",
        content: `${broll_images.length} b-roll motion frames`,
        data: { images: broll_images, prompts: filled },
      },
      {
        role: "assistant",
        kind: "summary",
        content: `**${brand.name}** is ready. Now we vibe-code: say things like _"make it more neon"_, _"swap accent to #ff6b00"_, _"darker moodier palette"_, _"rewrite the tagline punchier"_, _"shorter hero copy"_ — I'll re-render in place. Or ask for a new logo, b-roll, or launch email.`,
      },
    ],
    brandUpdates: { broll_images, stage: "complete", completion: 100 },
  };
}

async function handleFreeChat(brand, userMessage, history) {
  // If the user pastes a NEW url at any point, re-ingest from scratch.
  const url = extractUrl(userMessage);
  if (url && url !== brand.source_url) {
    return handleUrlDiscovery(brand, url);
  }

  // ── VIBE CODER: iterative color edits (explicit hex OR vibe direction) ──
  try {
    const colorEdit = await tryColorEdit(brand, userMessage);
    if (colorEdit) {
      return {
        messages: [
          { role: "assistant", kind: "palette", content: "Updated palette", data: { palette: colorEdit.palette } },
          { role: "assistant", kind: "text", content: colorEdit.summary + " Want me to push it further?" },
        ],
        brandUpdates: { palette: colorEdit.palette },
      };
    }
  } catch (err) {
    console.warn("[brandAgent] color edit failed:", err);
  }

  // ── VIBE CODER: copy refinements (tagline / hero / bios) ──
  const refineTarget = detectRefineTarget(userMessage);
  if (refineTarget) {
    try {
      const res = await refineCopy(brand, userMessage, refineTarget);
      if (refineTarget === "bios") {
        const social_bios = {
          twitter: res?.twitter || brand.social_bios?.twitter || "",
          instagram: res?.instagram || brand.social_bios?.instagram || "",
          linkedin: res?.linkedin || brand.social_bios?.linkedin || "",
        };
        return {
          messages: [
            { role: "assistant", kind: "social", content: "Refreshed bios", data: { ...social_bios, tagline: brand.tagline, hero_copy: brand.hero_copy } },
            { role: "assistant", kind: "text", content: "Tighter. Want another pass or new vibe?" },
          ],
          brandUpdates: { social_bios },
        };
      }
      const text = res?.text || "";
      if (!text) throw new Error("empty");
      const update = refineTarget === "tagline" ? { tagline: text } : { hero_copy: text };
      return {
        messages: [
          { role: "assistant", kind: "text", content: `**New ${refineTarget === "tagline" ? "tagline" : "hero copy"}:**\n\n_${text}_\n\nKeep iterating?` },
        ],
        brandUpdates: update,
      };
    } catch (err) {
      console.warn("[brandAgent] copy refine failed:", err);
    }
  }

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
- regenerate_broll
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
    case "regenerate_broll":
      return handleBroll(brand);
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
              "Vibe-code with me — try _\"more neon\"_, _\"swap primary to #0a2540\"_, _\"shorter tagline\"_, _\"warmer palette\"_, _\"new logo\"_, or _\"redo b-roll\"_.",
          },
        ],
        brandUpdates: {},
      };
  }
}