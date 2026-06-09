import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Mounted at /login — immediately sends the user to Base44's hosted login.
 * No loading screen is shown so users never get stuck on a "Connecting" page.
 */
export default function AuthRedirect() {
  useEffect(() => {
    if (window.__tttLoginRedirected) return;
    window.__tttLoginRedirected = true;
    try {
      base44.auth.redirectToLogin(window.location.origin + "/");
    } catch (e) {
      window.location.replace("/");
    }
  }, []);

  return null;
}