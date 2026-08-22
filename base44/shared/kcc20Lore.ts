// Real-world lore for a KCC20 token, used by the KCC20 token AI agent so its
// answers are about the SPECIFIC token (creator/dev profile, website, X profile,
// recent posts & vision, use case) instead of generic boilerplate about the
// kron.technology platform.
//
// Sources:
//   1. KRON registry tokenlist  -> creator Kaspa address, name, logo, covenantId
//   2. idx.kron.technology       -> live market data (price, holders, volume…)
//   3. InvokeLLM + web search    -> project website, creator/dev X profile, a
//                                    plain-language description, the dev's
//                                    recent post themes & vision
//   4. Direct scrape of the      -> the project's own homepage text (mission,
//      project website (if any)      roadmap, utility) merged into the knowledge

const REG = "https://api.kron.technology";
const IDX = "https://idx.kron.technology/v1/kcc20";

async function fetchJson(url: string, timeout = 6000): Promise<any> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "TTTAgent/1.0" },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.result ?? body;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Fetch a project homepage and return readable text. Skips JS shells / social /
// the kron platform itself (those give no project-specific text).
async function grabSite(url: string, timeout = 5000): Promise<string> {
  try {
    let u: URL;
    try { u = new URL(url); } catch { return ""; }
    const host = u.host.replace(/^www\./, "").toLowerCase();
    if (!host || host === "kron.technology" || host === "idx.kron.technology" ||
        host === "x.com" || host === "twitter.com" || host === "t.me") return "";
    const res = await fetch(u.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TTTAgent/1.0)" },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return "";
    const text = stripHtml(await res.text());
    if (text.length < 200) return ""; // likely a JS shell
    return text.slice(0, 3000);
  } catch {
    return "";
  }
}

export async function fetchKcc20Lore(tick: string, base44: any): Promise<any> {
  const T = String(tick || "").toUpperCase().trim();
  if (!T) return null;

  const [listRes, detail] = await Promise.all([
    fetchJson(`${REG}/api/registry/tokenlist`),
    fetchJson(`${IDX}/token/${T}`),
  ]);

  const entry: any = (listRes?.tokens || []).find(
    (t: any) => String(t.symbol || "").toUpperCase() === T,
  );
  const d: any = Array.isArray(detail) ? detail[0] || {} : detail || {};

  const name: string = entry?.name || d?.name || T;
  const creator: string = entry?.extensions?.creator || "";
  const creatorPubkey: string = entry?.extensions?.creatorPubkey || "";
  const covenantId: string = entry?.covenantId || d?.covenantId || "";
  const logo: string = entry?.logoURI || "";
  const genesisTxid: string = entry?.extensions?.genesisTxid || "";
  const graduated: boolean = !!(entry?.extensions?.graduated || d?.graduated);

  const market = {
    price: Number(d?.price || 0),
    change24h: Number(d?.change24h || 0),
    volume24h: Number(d?.volume24h || 0),
    volumeTotal: Number(d?.volumeTotal || 0),
    tvl: Number(d?.tvl || 0),
    trades24h: Number(d?.trades24h || 0),
    holderTotal: Number(d?.holderTotal || 0),
    circulating: Number(d?.circulating || 0),
    minted: Number(d?.minted || 0),
    max: Number(d?.max || 0),
  };

  // Web-grounded lore: project website, creator/dev X profile, what the token
  // is for, AND the dev's recent post themes + vision (like the profile agent
  // reads recent activity). One internet-grounded call.
  let web: any = null;
  let websiteContent = "";
  try {
    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        `Search the web for the Kaspa blockchain KCC-20 token named "${name}" with ticker $${T} ` +
        `(launched via the kron.technology launchpad). Identify, about THIS SPECIFIC PROJECT ONLY:\n` +
        `(1) the project's official website URL,\n` +
        `(2) the creator's or team's X / Twitter profile URL (the dev account, if one exists),\n` +
        `(3) a 2-3 sentence plain description of what this specific token/project is for — its lore, use case, community, or utility,\n` +
        `(4) a "dev_profile": who the creator/dev team is, their X handle, what they post about, and what they are building,\n` +
        `(5) "recent_posts": a list of 3-6 short themes from the creator's recent X posts / project announcements (e.g. "announced token airdrop", "teased v2 roadmap", "AMA with community", "partnership with X").\n\n` +
        `Focus ONLY on the "${name}" ($${T}) project and its creators. Do NOT describe the kron.technology platform, the KCC-20 token standard, or Kaspa in general. ` +
        `If you cannot find any project-specific information for a field, return empty strings / empty array for that field — never invent.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          website: { type: "string" },
          x_profile: { type: "string" },
          description: { type: "string" },
          dev_profile: { type: "string" },
          recent_posts: { type: "array", items: { type: "string" } },
        },
      },
    });
    web = raw && typeof raw === "object" ? raw : null;

    // Scrape the project's own website for concrete mission/roadmap/utility text.
    const site = (web?.website || "").trim();
    if (site) websiteContent = await grabSite(site);
  } catch {
    web = null;
  }

  return {
    tick: T,
    name,
    logo,
    creator,
    creatorPubkey,
    covenantId,
    genesisTxid,
    graduated,
    market,
    website: web?.website || "",
    xProfile: web?.x_profile || "",
    lore: web?.description || "",
    devProfile: web?.dev_profile || "",
    recentPosts: Array.isArray(web?.recent_posts) ? web.recent_posts : [],
    websiteContent,
  };
}

// Render lore into a compact knowledge block the LLM can ground on.
export function loreToKnowledge(lore: any): string {
  if (!lore) return "";
  const m = lore.market || {};
  const posts = Array.isArray(lore.recentPosts) ? lore.recentPosts.filter(Boolean) : [];
  return [
    `TOKEN: $${lore.tick} (${lore.name}) — a KCC-20 covenant token on Kaspa.`,
    `Creator Kaspa address: ${lore.creator || "unknown"}`,
    lore.creatorPubkey ? `Creator pubkey: ${lore.creatorPubkey}` : "",
    `Covenant id: ${lore.covenantId || "unknown"}`,
    lore.genesisTxid ? `Genesis tx: ${lore.genesisTxid}` : "",
    lore.graduated ? "Status: GRADUATED to the Kaspa DEX." : "Status: live on the KRON bonding curve (not yet graduated).",
    `Price: ${m.price} KAS. 24h change: ${m.change24h}%. Volume 24h: ${m.volume24h} KAS (total ${m.volumeTotal}). TVL: ${m.tvl} KAS.`,
    `Holders: ${m.holderTotal}. Circulating: ${m.circulating} / minted ${m.minted} / max ${m.max}.`,
    lore.website ? `Project website: ${lore.website}` : "Project website: not found on the web.",
    lore.xProfile ? `Creator / dev X (Twitter) profile: ${lore.xProfile}` : "Creator X profile: not found on the web.",
    lore.devProfile ? `Dev profile: ${lore.devProfile}` : "Dev profile: not found on the web.",
    posts.length ? `Recent dev posts / project activity: ${posts.map((p: string) => `"${p}"`).join("; ")}` : "Recent dev posts: not found.",
    lore.lore ? `Project lore / use case: ${lore.lore}` : "Project lore: not found on the web.",
    lore.websiteContent ? `Scraped project website text (excerpt):\n${lore.websiteContent}` : "",
  ].filter(Boolean).join("\n");
}