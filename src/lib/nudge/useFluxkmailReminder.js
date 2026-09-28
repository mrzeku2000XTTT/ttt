import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * FluxKmail sends reminders to the person's own Kaspa address — FluxKmail maps
 * that address to the user's FluxKmail inbox. No per-user OAuth, no email.
 *
 * "Connect" opens FluxKmail so the person signs in and their Kaspa address is on
 * their FluxKmail profile. When FluxKmail hands them back with ?fluxkmail=connected,
 * we remember it against the address; the Booking app then shows reminders as on.
 */
const STORAGE_KEY = "nudge_fluxkmail_connected";
const ADDRESS_KEY = "nudge_fluxkmail_address";
const FLUXKMAIL_APP = "https://fluxkmail.base44.app";

function readOverride() {
  try {
    return localStorage.getItem(ADDRESS_KEY) || "";
  } catch {
    return "";
  }
}

function writeOverride(addr) {
  try {
    if (addr) localStorage.setItem(ADDRESS_KEY, addr);
    else localStorage.removeItem(ADDRESS_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** The FluxKmail sign-in link, carrying the address to link and where to come back to. */
export function fluxkmailConnectUrl(address) {
  const returnTo = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({ kaspa: address || "", return: returnTo });
  return `${FLUXKMAIL_APP}/connect?${params.toString()}`;
}

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
  const [connected, setConnectedState] = useState(false);
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    base44.auth
      .isAuthenticated()
      .then(async (authed) => {
        setSignedIn(authed);
        if (!authed) return;
        try {
          const me = await base44.auth.me();
          const profileAddr = me.created_wallet_address || me.data?.kaspa_address || "";
          const override = readOverride();
          const addr = override || profileAddr;
          setAddress(addr);

          // Coming back from FluxKmail's sign-in: the address is now linked there.
          const params = new URLSearchParams(window.location.search);
          if (params.get("fluxkmail") === "connected" && addr) {
            setConnected(addr, true);
            params.delete("fluxkmail");
            const qs = params.toString();
            window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
          }

          setConnectedState(isConnected(addr));
        } catch {
          /* not signed in for real */
        }
      })
      .catch(() => setSignedIn(false))
      .finally(() => setReady(true));
  }, []);

  const connect = useCallback(() => setShowPopup(true), []);

  // Let the person type any Kaspa address they want — overrides the profile field.
  const setAddressOverride = useCallback((addr) => {
    setAddress(addr || "");
    writeOverride(addr || "");
  }, []);

  // Sends the person to FluxKmail to sign in and link the address. FluxKmail
  // returns them here with ?fluxkmail=connected, which the load effect picks up.
  const confirmConnect = useCallback(() => {
    setConnected(address, true);
    setConnectedState(true);
    setShowPopup(false);
    if (address) window.location.href = fluxkmailConnectUrl(address);
  }, [address]);

  const cancelConnect = useCallback(() => setShowPopup(false), []);

  const disconnect = useCallback(() => {
    setConnected(address, false);
    setConnectedState(false);
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

  return { ready, signedIn, connected, address, setAddress: setAddressOverride, showPopup, connect, confirmConnect, cancelConnect, disconnect, remind };
}