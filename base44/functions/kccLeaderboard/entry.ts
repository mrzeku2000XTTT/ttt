// KCC-20 board — LIVE data only.
//   • Token metadata + dev holdings straight from KRON's public launch registry
//     (api.kron.technology/api/registry/tokens).
//   • Per-token recent buy/sell activity + sentiment from Kascov's live covenant
//     event feed (kascov.io/data/mainnet-live.json), matched by each token's
//     curve covenant id (cp.curveCovid).
// No AI, no guessing: fields absent upstream stay empty.

const KRON_URL = "https://api.kron.technology/api/registry/tokens";
const KASCOV_URL = "https://kascov.io/data/mainnet-live.json";

async function fetchJson(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

export default async function (req) {
  const fetched_at = new Date().toISOString();
  try {
    // Pull both sources in parallel. Kascov is best-effort — if it fails we still
    // return KRON data with empty activity.
    const [kronData, kascovData] = await Promise.all([
      fetchJson(KRON_URL).catch((e) => ({ __error: e.message })),
      fetchJson(KASCOV_URL).catch((e) => ({ __error: e.message })),
    ]);

    if (kronData?.__error) {
      return Response.json(
        { success: false, error: `KRON: ${kronData.__error}` },
        { status: 502 }
      );
    }

    const raw = Array.isArray(kronData?.tokens) ? kronData.tokens : [];

    // Build a { curveCovid -> recentEventCount } map from Kascov's live feed.
    // recent_events are covenant transitions (buys/sells on the bonding curve).
    const activityByCovenant = new Map();
    const kascovOk = !kascovData?.__error;
    const kascovGeneratedMs = kascovData?.generated_at_ms ?? null;
    if (kascovOk && Array.isArray(kascovData?.recent_events)) {
      for (const ev of kascovData.recent_events) {
        const id = ev?.covenant_id;
        if (!id) continue;
        activityByCovenant.set(id, (activityByCovenant.get(id) || 0) + 1);
      }
    }

    const tokens = raw.map((t) => {
      const x = t.links?.x || "";
      const handle = x ? (x.split("?")[0].split("/").filter(Boolean).pop() || "") : "";
      const curveCovid = t.cp?.curveCovid || "";
      const tokenCovid = t.cp?.tokenCovid || "";
      const recent_buys = curveCovid ? (activityByCovenant.get(curveCovid) || 0) : 0;

      // Sentiment derived purely from real Kascov activity on this token's curve
      // covenant over the live feed window. More recent transitions = more
      // active buying/selling pressure right now.
      let sentiment = "quiet";
      if (recent_buys >= 8) sentiment = "hot";
      else if (recent_buys >= 2) sentiment = "active";

      // Progress on the bonding curve (real, from KRON).
      const supply = typeof t.curve?.supply === "number" ? t.curve.supply : null;
      const graduationSupply = t.curve?.graduationSupply ?? null;
      const progress_pct =
        supply != null && graduationSupply ? Math.min(100, Math.round((supply / graduationSupply) * 100)) : null;

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
        graduation_supply: graduationSupply,
        supply,
        progress_pct,
        liquidity_locked: t.trust?.liquidityLocked ?? null,
        mint_renounced: t.trust?.mintRenounced ?? null,
        dev_holding_pct: t.trust?.devHoldingPct ?? null,
        dev_amount: t.cp?.devAmount ?? null,           // real dev token allocation
        initial_inventory: t.cp?.initialInventory ?? null,
        fee_bps: t.curve?.feeBps ?? null,
        creator: t.creator || "",
        creator_pubkey: t.creatorPubkey || "",
        txid: t.txid || "",
        graduated: !!t.graduated,
        created_at: t.createdAt || null,                // real launch timestamp
        image_updated_at: t.imageUpdatedAt ?? null,    // last metadata update
        curve_covid: curveCovid,
        token_covid: tokenCovid,
        recent_buys,                                    // Kascov live activity count
        sentiment,                                      // quiet | active | hot
        kron_url: t.tick ? `https://kron.technology/token/${t.tick}` : "https://kron.technology",
        kascov_url: tokenCovid ? `https://kascov.io/covenant/${tokenCovid}` : "https://kascov.io",
      };
    });

    return Response.json({
      success: true,
      source: "api.kron.technology + kascov.io",
      kascov_ok: kascovOk,
      kascov_generated_at_ms: kascovGeneratedMs,
      tokens,
      fetched_at,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}