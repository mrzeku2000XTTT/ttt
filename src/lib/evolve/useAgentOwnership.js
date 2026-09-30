import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useAgentOwnership — WHO controls which agent, taken from the server-side
 * ledger (EvolveAgentWallet.owner_user_id) rather than from whichever client
 * happens to be open.
 *
 * That ledger is written only by backend functions, so an agent bought at the
 * Factory or on the market belongs to its buyer and to nobody else — a stale
 * browser tab can neither claim an agent nor keep one it has sold.
 *
 * Returns { mine: Set<agentKey>, loading }.
 */
export default function useAgentOwnership(experimentId) {
  const [state, setState] = useState({ mine: new Set(), loading: true });

  useEffect(() => {
    if (!experimentId) {
      setState({ mine: new Set(), loading: false });
      return undefined;
    }

    let alive = true;

    const load = async () => {
      try {
        const user = await base44.auth.me();
        if (!alive) return;
        if (!user) {
          setState({ mine: new Set(), loading: false });
          return;
        }
        const wallets = await base44.entities.EvolveAgentWallet.filter({ experiment_id: experimentId }, "-created_date", 500);
        if (!alive) return;
        setState({
          mine: new Set(wallets.filter((w) => w.owner_user_id === user.id).map((w) => w.agent_id)),
          loading: false,
        });
      } catch {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    };

    load();
    // A sale can happen in someone else's session; re-read so ownership follows.
    const timer = setInterval(load, 30000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [experimentId]);

  return state;
}