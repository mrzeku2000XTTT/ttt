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

/** "9:30 AM" read back as a clock time, or null when it is not one. */
export function parseClockLabel(label) {
  const match = String(label || "").match(/(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const suffix = String(match[3] || "").toLowerCase().replace(/\./g, "");
  if (suffix === "pm" && hours < 12) hours += 12;
  if (suffix === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

/** "Tuesday, September 29 at 9:30 AM" — one moment, spelled all the way out. */
export function momentLabel(ms) {
  const date = new Date(Number(ms) || Date.now());
  return `${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at ${clockLabel(date)}`;
}

/** "Today", "Tomorrow", or "Wed Oct 1" — for anything tied to a real day. */
export function shortDayLabel(date, now = new Date()) {
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(date) - midnight(now)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
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