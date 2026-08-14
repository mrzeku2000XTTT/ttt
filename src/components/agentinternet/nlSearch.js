import { base44 } from "@/api/base44Client";

const CATEGORIES = ["Ecosystem", "Resources", "Exchanges", "Wallets", "Merchant Solutions", "Developer Tools", "Community Chats", "News Sources", "X Profiles"];

/**
 * Natural-language search: turns a spoken-style question into directory
 * keywords + a category filter. Returns null when it isn't worth translating.
 */
export async function translateQuery(q) {
  const text = (q || "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4 && !text.includes("?")) return null;

  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `A user searched a Kaspa app directory with this natural-language query: "${text}"

Return the 1-3 best short keywords to match against app names, descriptions and tags, and the single best matching category from this list (or empty string if none fits): ${CATEGORIES.join(", ")}.
Keywords must be plain single words or short phrases, no punctuation.`,
      response_json_schema: {
        type: "object",
        properties: {
          keywords: { type: "array", items: { type: "string" } },
          category: { type: "string" },
        },
      },
    });

    const keywords = (res?.keywords || []).filter(Boolean).slice(0, 3).join(" ");
    const category = CATEGORIES.includes(res?.category) ? res.category : null;
    if (!keywords && !category) return null;
    return { keywords: keywords || text, category };
  } catch {
    return null;
  }
}