import { useEffect, useState } from "react";

/**
 * The visitor's own clock, language and zone — never a fixed 9:41. Everything the
 * phone shows about time goes through here, so it is the reader's local time and
 * not the author's.
 */

export function clockLabel(date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function dayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

/** "America/Chicago · CDT" — the zone the times above are read in. */
export function zoneLabel() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(new Date());
    const short = parts.find((p) => p.type === "timeZoneName")?.value || "";
    return [zone, short].filter(Boolean).join(" · ");
  } catch {
    return "";
  }
}

/**
 * Ticks once a second so the phone keeps time. Kept in its own hook so only the
 * clock redraws — the notification stack is not re-rendered every second.
 */
export function useLocalNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}