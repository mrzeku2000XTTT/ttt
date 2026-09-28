import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * FluxKmail sends reminders to the person's own Kaspa address — FluxKmail maps
 * that address to the user's FluxKmail inbox. No per-user OAuth, no email.
 * "Connecting" is the person opting in; we remember that per address so the
 * Booking app can show a Connect button the same way it used to.
 */
const STORAGE_KEY = "nudge_fluxkmail_connected";

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function isConnected(address) {
  if (!address) return false;
  return Boolean(readMap()[address]);
}

function setConnected(address, value) {
  if (!address) return;
  try {
    const map = readMap();
    if (value) map[address] = true;
    else delete map[address];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — connection just won't persist across reloads */
  }
}

export function useFluxkmailReminder() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    base44.auth
      .isAuthenticated()
      .then(async (authed) => {
        setSignedIn(authed);
        if (authed) {
          try {
            const me = await base44.auth.me();
            const addr = me.created_wallet_address || me.data?.kaspa_address || "";
            setAddress(addr);
            setConnected(isConnected(addr));
          } catch {
            /* not signed in for real */
          }
        }
      })
      .catch(() => setSignedIn(false))
      .finally(() => setReady(true));
  }, []);

  const connect = useCallback(() => setShowPopup(true), []);

  const confirmConnect = useCallback(() => {
    setConnected(address, true);
    setConnected(true);
    setShowPopup(false);
  }, [address]);

  const cancelConnect = useCallback(() => setShowPopup(false), []);

  const disconnect = useCallback(() => {
    setConnected(address, false);
    setConnected(false);
  }, [address]);

  // A reminder that fails is never worth interrupting a booking over.
  const remind = useCallback(async (bookings) => {
    try {
      const res = await base44.functions.invoke("nudgeFluxkmailReminder", { action: "remind", bookings });
      return Number(res?.data?.sent) || 0;
    } catch {
      return 0;
    }
  }, []);

  return { ready, signedIn, connected, address, showPopup, connect, confirmConnect, cancelConnect, disconnect, remind };
}