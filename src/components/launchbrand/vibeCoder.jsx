import { base44 } from "@/api/base44Client";

/**
 * Vibe Coder — iterative refinement engine.
 * Lets the user say things like:
 *   - "make it more neon"
 *   - "swap the primary to a deep forest green"
 *   - "darker, moodier, like a late-night studio"
 *   - "rewrite the tagline punchier"
 *   - "make the hero copy shorter"
 *   - "warmer palette"
 *   - "change accent to #ff6b00"
 * …and rebuilds the relevant brand fields in-place.
 */

const HEX_REGEX = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

const ROLE_KEYWORDS = {
  primary: ["primary", "main", "brand color"],
  accent: ["accent", "highlight", "secondary"],
  dark: ["dark", "background", "bg", "deep"],
  light: ["light", "foreground", "fg"],
  neutral: ["neutral", "muted", "gray", "grey"],
};

function detectExplicitHexes(text) {
  if (!text) return [];
  const matches = [...text.matchAll(HEX_REGEX)].map((m) => {
    let h = m[0];
    if (h.length === 4) h = "#" + h.slice(1).split("").map((c) => c + c).join("");
    return h.toLowerCase();
  });
  return matches;
}

function detectTargetRole(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [role, words] of Object.entries(ROLE_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return role;
  }
  return null;
}

const ROLE_INDEX = ["primary", "accent", "dark", "light", "neutral"];

/**
 * Re-shuffle palette so the requested color lives in the requested slot.
 * If no slot is requested, replace the primary.
 */
export function applyExplicitHex(palette, hex, role) {
  const next = [...(palette || [])];
  while (next.length < 5) next.push(["#06b6d4", "#a855f7", "#0a0a0a", "#fafafa", "#71717a"][next.length]);
  const idx = role ? ROLE_INDEX.indexOf(role) : 0;
  next[idx >= 0 ? idx : 0] = hex;
  return next.slice(0, 5);
}

/**
 * Ask the LLM to regenerate the palette to match a vibe direction
 * (e.g. "more neon", "warmer", "moody late-night studio"),
 * while keeping any pinned hexes intact.
 */
export async function rebuildPaletteFromVibe({ brand, direction, pinned = {} }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Re-design this 5-color brand palette based on the user's vibe direction. Return 5 hex codes in this exact order: primary, accent, dark, light, neutral.

Brand: ${brand.name} — ${brand.description}
Audience: ${brand.target_audience}
Voice: ${brand.voice}
Current palette: ${(brand.palette || []).join(", ")}
${Object.keys(pinned).length ? `MUST KEEP THESE EXACT COLORS in their slots:\n${Object.entries(pinned).map(([role, hex]) => `  - ${role}: ${hex}`).join("\n")}` : ""}

User's vibe direction: "${direction}"

Make it cohesive. Make it feel intentional. Strong contrast between dark and light. Accent should pop against primary.`,
    response_json_schema: {
      type: "object",
      properties: {
        palette: { type: "array", items: { type: "string" } },
        rationale: { type: "string" },
      },
    },
  });

  const palette = (res?.palette || [])
    .map((c) => (c || "").trim().toLowerCase())
    .filter((c) => /^#[0-9a-f]{6}$/.test(c))
    .slice(0, 5);

  while (palette.length < 5) {
    palette.push(["#06b6d4", "#a855f7", "#0a0a0a", "#fafafa", "#71717a"][palette.length]);
  }

  // Re-apply any pinned hexes (in case the LLM ignored the constraint)
  for (const [role, hex] of Object.entries(pinned)) {
    const idx = ROLE_INDEX.indexOf(role);
    if (idx >= 0 && /^#[0-9a-f]{6}$/i.test(hex)) palette[idx] = hex.toLowerCase();
  }

  return { palette, rationale: res?.rationale || "" };
}

/**
 * Main entry — figures out what kind of color edit the user wants and applies it.
 * Returns { palette, summary } or null if no color intent detected.
 */
export async function tryColorEdit(brand, userMessage) {
  const explicit = detectExplicitHexes(userMessage);
  const role = detectTargetRole(userMessage);

  // Case A: user gave an explicit hex → drop it into the right slot.
  if (explicit.length > 0) {
    let palette = brand.palette || [];
    const pinned = {};
    if (explicit.length === 1) {
      palette = applyExplicitHex(palette, explicit[0], role);
      pinned[role || "primary"] = explicit[0];
    } else {
      // Multiple hexes — assume they're given in order
      palette = explicit.slice(0, 5);
      while (palette.length < 5) palette.push(brand.palette?.[palette.length] || "#fafafa");
    }
    return {
      palette,
      summary: explicit.length === 1
        ? `Set ${role || "primary"} → ${explicit[0]}.`
        : `Updated palette to ${explicit.length} new colors.`,
    };
  }

  // Case B: vibe direction (no hex). Let the LLM rebuild.
  const COLOR_CUES = [
    "color", "palette", "vibe", "neon", "warmer", "cooler", "darker", "lighter",
    "moody", "vibrant", "muted", "pastel", "earthy", "sunset", "ocean", "forest",
    "monochrome", "black and white", "high contrast", "softer", "punchier",
    "playful", "premium", "minimal", "retro", "futuristic", "cyber", "dreamy",
    "swap", "change.*color", "make it.*green", "make it.*blue", "make it.*red",
    "more.*color", "less.*color",
  ];
  const lower = (userMessage || "").toLowerCase();
  const isColorIntent = COLOR_CUES.some((cue) =>
    new RegExp(cue).test(lower)
  );
  if (!isColorIntent) return null;

  const { palette, rationale } = await rebuildPaletteFromVibe({
    brand,
    direction: userMessage,
  });
  return {
    palette,
    summary: rationale || "New palette dialed to that vibe.",
  };
}

/**
 * Iterative copy refinement — used when the user says
 * "rewrite the tagline punchier", "shorter hero", "more energetic bios", etc.
 */
export async function refineCopy(brand, userMessage, target) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Rewrite the brand's ${target} based on the user's direction. Keep voice consistent.

Brand: ${brand.name}
Description: ${brand.description}
Audience: ${brand.target_audience}
Voice: ${brand.voice}

Current ${target}: ${
      target === "tagline" ? brand.tagline :
      target === "hero_copy" ? brand.hero_copy :
      target === "bios" ? JSON.stringify(brand.social_bios || {}) :
      ""
    }

User's direction: "${userMessage}"

Constraints:
- tagline: under 8 words, sharp, no clichés.
- hero_copy: under 25 words, magnetic.
- bios: twitter ≤160 chars, instagram ≤150 chars, linkedin ≤220 chars.

Return ONLY the rewritten ${target}.`,
    response_json_schema:
      target === "bios"
        ? {
            type: "object",
            properties: {
              twitter: { type: "string" },
              instagram: { type: "string" },
              linkedin: { type: "string" },
            },
          }
        : { type: "object", properties: { text: { type: "string" } } },
  });
  return res;
}

/**
 * Detect what the user is asking to refine. Returns null if no clear intent.
 */
export function detectRefineTarget(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/(tagline|headline)/.test(lower)) return "tagline";
  if (/(hero|subhead|sub-?head|hero copy|landing copy)/.test(lower)) return "hero_copy";
  if (/(bio|bios|social)/.test(lower)) return "bios";
  return null;
}