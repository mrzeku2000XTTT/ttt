import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useTn10Balances — REAL Kaspa testnet (TN-10) balances for a set of
 * kaspatest: addresses, read straight from the chain.
 *
 * Returns { balances, loading, ok } where balances maps address -> tKAS.
 * An address MISSING from balances means the chain did not answer for it.
 * We never substitute a simulation number for a missing chain answer.
 *
 * The chain is polled, not read once: a wallet balance changes the moment a
 * payment lands, and a cached figure would keep showing the pre-payment amount.
 */
export default function useTn10Balances(addresses, { pollMs = 15000 } = {}) {
  const [state, setState] = useState({ balances: {}, loading: false, ok: true });

  const key = [...new Set((addresses || []).filter(address => typeof address === 'string' && address.startsWith('kaspatest:')))].sort().join(',');

  useEffect(() => {
    if (!key) {
      setState({ balances: {}, loading: false, ok: true });
      return undefined;
    }

    let alive = true;

    const load = async (first) => {
      if (first) setState((s) => ({ ...s, loading: true }));
      try {
        const addresses = key.split(',');
        const responses = [];
        for (let i = 0; i < addresses.length; i += 40) {
          responses.push((await base44.functions.invoke('evolveTn10Balances', { addresses: addresses.slice(i, i + 40) })).data);
        }
        if (!alive) return;
        const balances = {};
        for (const data of responses) {
          for (const [addr, sompi] of Object.entries(data?.balances || {})) {
            if (sompi !== null && Number.isSafeInteger(Number(sompi)) && Number(sompi) >= 0) balances[addr] = Number(sompi) / 1e8;
          }
        }
        setState({ balances, loading: false, ok: responses.every(data => data?.ok === true), key });
      } catch {
        if (!alive) return;
        // A failed refresh is unknown, not zero or an unlabelled stale balance.
        setState({ balances: {}, loading: false, ok: false, key });
      }
    };

    load(true);
    const refresh = () => { if (!document.hidden) load(false); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = pollMs ? setInterval(() => load(false), pollMs) : null;

    return () => {
      alive = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      if (timer) clearInterval(timer);
    };
  }, [key, pollMs]);

  return state.key === key ? state : { balances: {}, loading: !!key, ok: !key };
}