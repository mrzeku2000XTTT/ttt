// Real-world lore for a KCC20 token, used by the KCC20 token AI agent so its
// answers are about the SPECIFIC token (creator, website, X profile, use case)
// instead of generic boilerplate about the kron.technology platform.
//
// Sources:
//   1. KRON registry tokenlist  -> creator Kaspa address, name, logo, covenantId
//   2. idx.kron.technology       -> live market data (price, holders, volume…)
//   3. InvokeLLM + web search    -> the project's website, creator X profile,
//                                    and a plain-language description of the
//                                    token's lore / utility.

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

  // Web-grounded lore: the project's website, creator X profile, and a
  // description of what this specific token is for.
  let web: any = null;
  try {
    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        `Search the web for the Kaspa blockchain KCC-20 token named "${name}" with ticker $${T} ` +
        `(launched via the kron.technology launchpad). Identify: (1) the project's official website URL, ` +
        `(2) the creator or team's X / Twitter profile URL (if one exists), and ` +
        `(3) a 2-3 sentence plain description of what this specific token/project is for — its lore, ` +
        `use case, community, or utility. Focus ONLY on the "${name}" ($${T}) project itself. ` +
        `Do NOT describe the kron.technology platform, the KCC-20 token standard, or Kaspa in general. ` +
        `If you cannot find any project-specific information, return empty strings for the fields.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          website: { type: "string" },
          x_profile: { type: "string" },
          description: { type: "string" },
        },
      },
    });
    web = raw && typeof raw === "object" ? raw : null;
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
  };
}

// Render lore into a compact knowledge block the LLM can ground on.
export function loreToKnowledge(lore: any): string {
  if (!lore) return "";
  const m = lore.market || {};
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
    lore.xProfile ? `Creator / project X (Twitter) profile: ${lore.xProfile}` : "Creator X profile: not found on the web.",
    lore.lore ? `Project lore / use case: ${lore.lore}` : "Project lore: not found on the web.",
  ].filter(Boolean).join("\n");
}