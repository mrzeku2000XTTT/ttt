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
    const fn = await base44.functions.invoke("agentInternetDirectorySearch", { query: text });
    const res = fn?.data || fn;

    const keywords = (res?.keywords || []).filter(Boolean).slice(0, 3).join(" ");
    const category = CATEGORIES.includes(res?.category) ? res.category : null;
    if (!keywords && !category) return null;
    return { keywords: keywords || text, category };
  } catch {
    return null;
  }
}