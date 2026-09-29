import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useTn10Balances — REAL Kaspa testnet (TN-10) balances for a set of
 * kaspatest: addresses, read straight from the chain.
 *
 * Returns { balances, loading, ok } where balances maps address -> tKAS.
 * An address MISSING from balances means the chain did not answer for it.
 * We never substitute a simulation number for a missing chain answer.
 */
export default function useTn10Balances(addresses) {
  const [state, setState] = useState({ balances: {}, loading: false, ok: true });
  const lastKey = useRef("");

  const key = (addresses || []).filter(Boolean).sort().join(",");

  useEffect(() => {
    if (!key) {
      lastKey.current = "";
      setState({ balances: {}, loading: false, ok: true });
      return;
    }
    if (lastKey.current === key) return;
    lastKey.current = key;

    let alive = true;
    setState((s) => ({ ...s, loading: true }));

    base44.functions
      .invoke("evolveTn10Balances", { addresses: key.split(",") })
      .then((res) => {
        if (!alive) return;
        const data = res?.data || {};
        const balances = {};
        for (const [addr, sompi] of Object.entries(data.balances || {})) {
          balances[addr] = Number(sompi) / 1e8;
        }
        setState({ balances, loading: false, ok: data.ok !== false });
      })
      .catch(() => {
        if (!alive) return;
        lastKey.current = "";
        setState({ balances: {}, loading: false, ok: false });
      });

    return () => {
      alive = false;
    };
  }, [key]);

  return state;
}