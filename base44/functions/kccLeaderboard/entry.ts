// KCC-20 board — LIVE data only, straight from KRON's public launch registry
// (api.kron.technology). No AI, no guessing: fields absent upstream stay empty.

export default async function (req) {
  try {
    const res = await fetch("https://api.kron.technology/api/registry/tokens", {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return Response.json({ success: false, error: `KRON returned ${res.status}` }, { status: 502 });

    const data = await res.json();
    const raw = Array.isArray(data?.tokens) ? data.tokens : [];

    const tokens = raw.map((t) => {
      const x = t.links?.x || "";
      const handle = x ? (x.split("?")[0].split("/").filter(Boolean).pop() || "") : "";
      return {
        tick: (t.tick || "").toUpperCase(),
        name: t.name || t.tick || "",
        description: t.description || "",
        image: t.image || "",
        x_url: x,
        x_handle: handle,
        website: t.links?.website || "",
        telegram: t.links?.telegram || "",
        max_supply: t.max || "",
        decimals: typeof t.dec === "number" ? t.dec : null,
        graduation_supply: t.curve?.graduationSupply ?? null,
        supply: t.curve?.supply ?? null,
        liquidity_locked: t.trust?.liquidityLocked ?? null,
        mint_renounced: t.trust?.mintRenounced ?? null,
        dev_holding_pct: t.trust?.devHoldingPct ?? null,
        creator: t.creator || "",
        txid: t.txid || "",
        kron_url: t.tick ? `https://kron.technology/token/${t.tick}` : "https://kron.technology",
        kascov_url: t.cp?.tokenCovid ? `https://kascov.io/covenant/${t.cp.tokenCovid}` : "https://kascov.io",
      };
    });

    return Response.json({
      success: true,
      source: "api.kron.technology/api/registry/tokens",
      tokens,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}