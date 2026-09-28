import { clockLabel, shortDayLabel, momentLabel } from "./localTime";

// The reminders this phone buzzes with. They live in this browser, on the same
// terms as the briefs and the bookings: no entity, no backend function, no upload.
// The one thing that can leave is a calendar file the user asks for themselves.

const KEY = "ttt_nudge_reminders_v1";

/** The lead times offered on every reminder, in minutes. */
export const LEAD_OPTIONS = [
  { minutes: 0, label: "At the time" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
];

/** Whatever lead time arrives, it becomes one of the four on offer. */
function snapLead(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value)) return 15;
  return LEAD_OPTIONS.reduce(
    (best, option) => (Math.abs(option.minutes - value) < Math.abs(best - value) ? option.minutes : best),
    15,
  );
}

export function leadLabel(minutes) {
  const snapped = snapLead(minutes);
  return LEAD_OPTIONS.find((option) => option.minutes === snapped)?.label || "At the time";
}

export function makeReminderId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** One reminder: what to say, when the moment is, and how far ahead to buzz. */
export function makeReminder({ title, at, leadMinutes = 15, from = "" }) {
  return {
    id: makeReminderId(),
    title: String(title || "").trim().slice(0, 90),
    at: Number(at) || 0,
    leadMinutes: snapLead(leadMinutes),
    from: String(from || "").slice(0, 60),
    createdAt: Date.now(),
  };
}

export function loadReminders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && r.id && r.title && Number(r.at) > 0);
  } catch {
    return [];
  }
}

export function saveReminders(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked — the reminders still work for this session.
  }
}

/** The moment the phone buzzes: the appointment, less the lead time. */
export function buzzAt(reminder) {
  return (Number(reminder?.at) || 0) - snapLead(reminder?.leadMinutes) * 60000;
}

/** Everything still to come, soonest first — one just gone stays on the list a while. */
export function upcomingReminders(list, now = Date.now()) {
  return [...(list || [])]
    .filter((r) => Number(r.at) > now - 6 * 3600000)
    .sort((a, b) => Number(a.at) - Number(b.at));
}

/** The ones whose moment has come — these are what the phone buzzes with. */
export function dueReminders(list, now = Date.now()) {
  return (list || [])
    .filter((r) => buzzAt(r) <= now && Number(r.at) > now - 12 * 3600000)
    .sort((a, b) => buzzAt(b) - buzzAt(a))
    .slice(0, 3);
}

/** "in 25 min", "in 2 hr", "now" — how far off the buzz is, in plain words. */
export function waitLabel(reminder, now = Date.now()) {
  const ms = buzzAt(reminder) - now;
  if (ms <= 0) return "now";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hr`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * A reminder, written as the notification a phone would show — drawn by the very
 * same card the brief uses, because it is the very same component.
 */
export function reminderToNotification(reminder) {
  const at = new Date(Number(reminder?.at) || Date.now());
  return {
    app: "Reminders",
    date: shortDayLabel(at),
    time: clockLabel(at),
    title: reminder?.title || "Reminder",
    body: leadLabel(reminder?.leadMinutes),
    detail: `${momentLabel(at)} · ${leadLabel(reminder?.leadMinutes).toLowerCase()}`,
    tone: "now",
  };
}

/** The reminders whose moment has come, as notifications for the lock screen. */
export function remindersToNotifications(list, now = new Date()) {
  return dueReminders(list, now.getTime()).map(reminderToNotification);
}