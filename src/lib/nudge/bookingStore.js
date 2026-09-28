import { clockLabel, shortDayLabel } from "@/lib/nudge/localTime";

// Bookings are kept in this browser beside the briefs, on the same terms: no
// entity, no backend function, no upload. Each person keeps their own.

const KEY = "ttt_nudge_bookings_v1";

export function loadBookings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((b) => b && b.id && b.title && b.start);
  } catch {
    return [];
  }
}

export function saveBookings(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked — the bookings still work for this session.
  }
}

export function makeBookingId() {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** A booking reference, the way a real booking app hands one back. */
export function makeRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `NB-${out}`;
}

/** A "YYYY-MM-DD" day and an "HH:MM" time as one real local moment. */
export function bookingStart(date, time) {
  return `${date}T${time}`;
}

/** When a booking begins, as a real moment. */
export function bookingWhen(booking) {
  const at = new Date(booking?.start || "");
  return Number.isNaN(at.getTime()) ? 0 : at.getTime();
}

export function durationLabel(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** Everything still to come, soonest first — an hour of grace for one just started. */
export function upcomingBookings(list, now = Date.now()) {
  return [...(list || [])]
    .filter((b) => bookingWhen(b) >= now - 3600000)
    .sort((a, b) => bookingWhen(a) - bookingWhen(b));
}

/**
 * A booking, written as the notification a phone would have shown — drawn by the
 * very same card the brief uses, because it is the very same component.
 */
export function bookingToNotification(booking, now = new Date()) {
  const at = new Date(bookingWhen(booking) || Date.now());
  const parts = [durationLabel(booking.minutes), booking.where, booking.who].filter(Boolean);
  const soon = Math.abs(at.getTime() - now.getTime()) < 45 * 60 * 1000;

  return {
    app: "Calendar",
    date: shortDayLabel(at, now),
    time: clockLabel(at),
    title: booking.title,
    body: parts.join(" · ") || booking.notes || "Booked",
    detail: parts.length && booking.notes ? `${booking.notes} · Ref ${booking.ref}` : `Ref ${booking.ref}`,
    tone: soon ? "now" : "later",
  };
}

/** The next few bookings, as notifications for the lock screen. */
export function bookingsToNotifications(list, now = new Date()) {
  return upcomingBookings(list, now.getTime()).slice(0, 4).map((b) => bookingToNotification(b, now));
}