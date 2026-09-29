/**
 * useScorpionWallet — React hook that owns the Scorpion connection lifecycle.
 *
 * State machine: DISCONNECTED → CONNECTING → CONNECTED_TN10 (or CONNECTED_WRONG_NETWORK)
 *               → SIGNING → BROADCASTING → back to CONNECTED_TN10.
 *
 * On reload, silently restores a previously-approved session without re-prompting.
 * Exposes the adapter, connection state, address, balance (sompi BigInt), and
 * the payment orchestrator. Private keys never enter this layer.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  scorpion,
  ScorpionConnectionState as State,
  EVOLVE_NETWORK,
  isTN10Address,
  isTN10Network,
  discoverProviders,
} from "./scorpionAdapter";
import { sompiToKas, sompiToKasShort } from "./evolveTxBuilder";

const SESSION_KEY = "evolve_scorpion_session";

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveSession(s) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function useScorpionWallet() {
  const [connState, setConnState] = useState(State.DISCONNECTED);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [balance, setBalance] = useState({ confirmed: 0n, unconfirmed: 0n });
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [busy, setBusy] = useState(false);
  const refreshTimer = useRef(null);

  const isTN10 = connState === State.CONNECTED_TN10;

  /** Silent read of balance/network — no wallet prompt. */
  const silentRefresh = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const bal = await scorpion.getBalance(addr);
      setBalance(bal);
    } catch {}
    try {
      const net = await scorpion.getNetwork();
      setNetwork(net);
      setConnState(isTN10Network(net) ? State.CONNECTED_TN10 : State.CONNECTED_WRONG_NETWORK);
    } catch {}
  }, []);

  /** Restore a session on mount without re-prompting. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = loadSession();
      if (!session?.address) return;
      const accounts = await scorpion.silentAccounts();
      if (cancelled) return;
      if (accounts && accounts.length && accounts.includes(session.address)) {
        setAddress(session.address);
        setConnState(State.CONNECTED_TN10); // optimistic; corrected by silentRefresh
        await silentRefresh(session.address);
      } else {
        saveSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [silentRefresh]);

  /** KIP-12 provider discovery. */
  useEffect(() => {
    return discoverProviders((p) => {
      setProviders((prev) => (prev.find((x) => x.rdns === p.rdns) ? prev : [...prev, p]));
    });
  }, []);

  /** Poll balance every 20s while connected. */
  useEffect(() => {
    if (!isTN10 || !address) return undefined;
    refreshTimer.current = setInterval(() => silentRefresh(address), 20000);
    return () => clearInterval(refreshTimer.current);
  }, [isTN10, address, silentRefresh]);

  /** Full connect flow: connect → verify network → verify address → persist. */
  const connect = useCallback(async () => {
    setBusy(true);
    setError("");
    setConnState(State.CONNECTING);
    try {
      const addr = await scorpion.connect();
      if (!isTN10Address(addr)) {
        setError("EVOLVE requires a kaspatest: (TN-10) address. Mainnet addresses are not accepted.");
        setConnState(State.CONNECTED_WRONG_NETWORK);
        setBusy(false);
        return { ok: false, reason: "MAINNET_ADDRESS" };
      }
      let net = await scorpion.getNetwork();
      if (!isTN10Network(net)) {
        setConnState(State.CONNECTED_WRONG_NETWORK);
        setNetwork(net);
        setBusy(false);
        return { ok: false, reason: "WRONG_NETWORK", network: net, address: addr };
      }
      setAddress(addr);
      setNetwork(net);
      setConnState(State.CONNECTED_TN10);
      saveSession({ address: addr, connectedAt: Date.now() });
      await silentRefresh(addr);
      return { ok: true, address: addr };
    } catch (e) {
      setError(e?.code === "SDK_MISSING" ? "SCORPION SDK UNAVAILABLE" : "Connection rejected");
      setConnState(State.ERROR);
      setBusy(false);
      return { ok: false, reason: e?.code || "CONNECT_FAILED", error: e };
    }
  }, [silentRefresh]);

  /** Switch the wallet to TN10. The wallet handles user confirmation. */
  const switchToTN10 = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const net = await scorpion.switchToTN10();
      setNetwork(net);
      if (isTN10Network(net)) {
        setConnState(State.CONNECTED_TN10);
        if (address) await silentRefresh(address);
        return { ok: true };
      }
      setConnState(State.CONNECTED_WRONG_NETWORK);
      return { ok: false, reason: "STILL_WRONG_NETWORK" };
    } catch (e) {
      setError("Network switch failed");
      return { ok: false, reason: "SWITCH_FAILED", error: e };
    } finally {
      setBusy(false);
    }
  }, [address, silentRefresh]);

  const disconnect = useCallback(async () => {
    try {
      await scorpion.disconnect();
    } catch {}
    saveSession(null);
    setAddress("");
    setNetwork("");
    setBalance({ confirmed: 0n, unconfirmed: 0n });
    setHoldings([]);
    setConnState(State.DISCONNECTED);
  }, []);

  const openWallet = useCallback(() => scorpion.openWallet().catch(() => {}), []);
  const refreshHoldings = useCallback(async () => {
    try {
      setHoldings(await scorpion.getHoldings());
    } catch {
      setHoldings([]);
    }
  }, []);

  return {
    adapter: scorpion,
    connState,
    isTN10,
    isWrongNetwork: connState === State.CONNECTED_WRONG_NETWORK,
    address,
    network,
    balance,
    balanceKas: sompiToKas(balance.confirmed),
    balanceKasShort: sompiToKasShort(balance.confirmed),
    holdings,
    providers,
    error,
    busy,
    connect,
    switchToTN10,
    disconnect,
    openWallet,
    refreshHoldings,
    silentRefresh,
    setConnState,
    setBusy,
    setError,
  };
}