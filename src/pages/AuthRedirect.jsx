import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Mounted at /login.
 * This app is PUBLIC (no login required) and uses wallet connections instead.
 * So hitting /login must NOT loop through the hosted-login redirect (that hangs
 * on a "Connecting" screen for public apps). Instead:
 *   - If already authenticated, just send them into the app.
 *   - If not, only redirect to hosted login if they explicitly asked for it
 *     via ?force=1; otherwise drop them straight into the app as a guest.
 */
export default function AuthRedirect() {
  useEffect(() => {
    if (window.__tttLoginHandled) return;
    window.__tttLoginHandled = true;

    const params = new URLSearchParams(window.location.search);
    const force = params.get("force") === "1";

    (async () => {
      try {
        const isAuthed = await base44.auth.isAuthenticated();
        if (isAuthed) {
          window.location.replace("/");
          return;
        }
        if (force) {
          base44.auth.redirectToLogin(window.location.origin + "/");
          return;
        }
      } catch (e) {
        // ignore — fall through to guest
      }
      // Public app: no login required, go straight in as a guest.
      window.location.replace("/");
    })();
  }, []);

  return null;
}