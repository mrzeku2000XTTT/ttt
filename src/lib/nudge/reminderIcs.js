// A reminder written as a real calendar file, so the calendar or reminders app on
// someone's actual phone buzzes at the right moment. This is the only thing NUDGE
// ever hands out of the browser on the user's behalf — and only when they ask.

const pad = (n) => String(n).padStart(2, "0");

function stamp(ms) {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

function escapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Every reminder as one VCALENDAR, each carrying the alarm that makes it buzz. */
export function remindersToIcs(reminders) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NUDGE//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NUDGE reminders",
  ];

  (reminders || []).forEach((reminder) => {
    const at = Number(reminder?.at) || 0;
    if (!at) return;
    const lead = Math.max(0, Number(reminder?.leadMinutes) || 0);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${reminder.id}@nudge`,
      `DTSTAMP:${stamp(Date.now())}`,
      `DTSTART:${stamp(at)}`,
      `DTEND:${stamp(at + 30 * 60000)}`,
      `SUMMARY:${escapeText(reminder.title)}`,
      `DESCRIPTION:${escapeText(`Reminder from NUDGE${reminder.from ? ` · ${reminder.from}` : ""}`)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:${lead > 0 ? `-PT${lead}M` : "PT0M"}`,
      `DESCRIPTION:${escapeText(reminder.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Hands the file to the browser's own download, which is what a phone can open. */
export function downloadRemindersIcs(reminders, name = "nudge-reminders") {
  const blob = new Blob([remindersToIcs(reminders)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}