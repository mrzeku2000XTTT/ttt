import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/** The Gmail connector each person connects for themselves. */
const CONNECTOR_ID = "6a8cde4f5e2470cbe4b913d5";

/**
 * The inbox the reminders come from. Asking the reminder function whether it can
 * answer is also how we learn the connection is live — and it hands back the
 * address to show, so there is nothing else to check.
 */
export function useGmailReminder() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");

  const check = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("nudgeBookingReminder", { action: "status" });
      const data = res?.data || {};
      setConnected(Boolean(data.connected));
      setEmail(data.email || "");
    } catch {
      setConnected(false);
      setEmail("");
    }
  }, []);

  useEffect(() => {
    base44.auth
      .isAuthenticated()
      .then(async (authed) => {
        setSignedIn(authed);
        if (authed) await check();
      })
      .catch(() => setSignedIn(false))
      .finally(() => setReady(true));
  }, [check]);

  // Consent finishes in another tab, so the only signal that it worked is that
  // tab closing — then we ask again.
  const connect = useCallback(async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        check();
      }
    }, 500);
  }, [check]);

  const disconnect = useCallback(async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setEmail("");
  }, []);

  // A reminder that fails is never worth interrupting a booking over.
  const remind = useCallback(async (bookings) => {
    try {
      const res = await base44.functions.invoke("nudgeBookingReminder", { action: "remind", bookings });
      return Number(res?.data?.sent) || 0;
    } catch {
      return 0;
    }
  }, []);

  return { ready, signedIn, connected, email, connect, disconnect, remind };
}