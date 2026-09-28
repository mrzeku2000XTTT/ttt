import { parseClockLabel } from "./localTime";

// The moments inside a brief, as things you can tap. A notification only carries a
// written time ("9:30 AM"), so each one is read back into a real moment on the
// reader's own clock — today, or tomorrow when the day says so.

function momentFor(note, now) {
  const written = parseClockLabel(note?.time)
    || parseClockLabel(String(note?.detail || "").match(/\d{1,2}:\d{2}\s*[ap]\.?m\.?/i)?.[0]);
  if (!written) return 0;

  const at = new Date(now.getTime());
  if (/tomorrow/i.test(String(note?.date || ""))) at.setDate(at.getDate() + 1);
  at.setHours(written.hours, written.minutes, 0, 0);

  // A time that has already gone today is read as the next day, so a reminder set
  // from here never lands in the past.
  if (at.getTime() < now.getTime() - 10 * 60000) at.setDate(at.getDate() + 1);
  return at.getTime();
}

/** The tappable moments of a brief, in the order the reader will meet them. */
export function briefEvents(brief, now = new Date()) {
  return (brief?.notifications || []).slice(0, 16).map((note, index) => ({
    id: `${brief?.id || "brief"}-${index}`,
    title: String(note?.title || "").trim() || "Something on today",
    body: note?.body || "",
    detail: note?.detail || "",
    app: note?.app || "Calendar",
    timeLabel: note?.time || "",
    dateLabel: note?.date || "",
    moment: momentFor(note, now),
  }));
}