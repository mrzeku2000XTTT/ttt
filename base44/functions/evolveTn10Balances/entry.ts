// evolveTn10Balances — REAL Kaspa testnet-10 (TN-10) balances, read straight
// from the public TN-10 REST API. Read-only: this function never signs, never
// broadcasts and never touches a wallet key.
//
// The response is the chain's answer and nothing else. An address the chain did
// not answer for is OMITTED from `balances` — callers must show "unknown" rather
// than substituting a simulation number.
const TN10_API = "https://api-tn10.kaspa.org";
const MAX_ADDRESSES = 40;

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const requested = Array.isArray(body?.addresses) ? body.addresses : [];

    const addresses = [
      ...new Set(
        requested.filter(
          (a: unknown) => typeof a === "string" && a.startsWith("kaspatest:") && a.length > 12
        )
      ),
    ].slice(0, MAX_ADDRESSES);

    if (addresses.length === 0) {
      return Response.json({
        ok: true,
        network: "kaspa_testnet_10",
        source: "api-tn10.kaspa.org",
        balances: {},
        totalSompi: 0,
      });
    }

    const results = await Promise.all(
      addresses.map(async (address: string) => {
        try {
          const res = await fetch(
            `${TN10_API}/addresses/${encodeURIComponent(address)}/balance`,
            { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) }
          );
          if (!res.ok) return [address, null] as const;
          const data = await res.json();
          const sompi = data?.balance == null ? null : Number(data.balance);
          return [address, sompi !== null && Number.isSafeInteger(sompi) && sompi >= 0 ? sompi : null] as const;
        } catch {
          return [address, null] as const;
        }
      })
    );

    const balances: Record<string, number> = {};
    let totalSompi = 0;
    let complete = true;

    for (const [address, sompi] of results) {
      if (sompi === null) {
        complete = false;
        continue;
      }
      balances[address] = sompi;
      totalSompi += sompi;
    }

    return Response.json({
      ok: complete,
      network: "kaspa_testnet_10",
      source: "api-tn10.kaspa.org",
      balances,
      totalSompi,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}