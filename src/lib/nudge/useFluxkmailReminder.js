import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * FluxKmail sends reminders from its own mail service — no per-user OAuth, no
 * Google account. "Connecting" is the person opting in; we remember that per
 * email so the Booking app can show a Connect button the same way it used to.
 */
const STORAGE_KEY = "nudge_fluxkmail_connected";

function readMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function isConnected(email) {
  if (!email) return false;
  return Boolean(readMap()[email]);
}

function setConnected(email, value) {
  if (!email) return;
  try {
    const map = readMap();
    if (value) map[email] = true;
    else delete map[email];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — connection just won't persist across reloads */
  }
}

export function useFluxkmailReminder() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    base44.auth
      .isAuthenticated()
      .then(async (authed) => {
        setSignedIn(authed);
        if (authed) {
          try {
            const me = await base44.auth.me();
            const addr = me.email || "";
            setEmail(addr);
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
    setConnected(email, true);
    setConnected(true);
    setShowPopup(false);
  }, [email]);

  const cancelConnect = useCallback(() => setShowPopup(false), []);

  const disconnect = useCallback(() => {
    setConnected(email, false);
    setConnected(false);
  }, [email]);

  // A reminder that fails is never worth interrupting a booking over.
  const remind = useCallback(async (bookings) => {
    try {
      const res = await base44.functions.invoke("nudgeFluxkmailReminder", { action: "remind", bookings });
      return Number(res?.data?.sent) || 0;
    } catch {
      return 0;
    }
  }, []);

  return { ready, signedIn, connected, email, showPopup, connect, confirmConnect, cancelConnect, disconnect, remind };
}