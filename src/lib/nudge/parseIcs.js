// Local .ics reader. Runs entirely in the browser — the file is never uploaded.
// Handles the shapes a real calendar export actually uses: folded lines, UTC and
// floating timestamps, all-day (VALUE=DATE) events, and escaped text.

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function unescapeText(value) {
  return String(value)
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** "20260928T140000Z" | "20260928T140000" | "20260928" → { date, time, allDay, ts } */
function parseStamp(raw, params) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(raw).trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, , utc] = m;
  const dateOnly = /VALUE=DATE/i.test(params || "") || !h;
  if (dateOnly) {
    return { date: `${y}-${mo}-${d}`, time: null, allDay: true, ts: new Date(+y, +mo - 1, +d).getTime() };
  }
  const ts = utc
    ? Date.UTC(+y, +mo - 1, +d, +h, +mi)
    : new Date(+y, +mo - 1, +d, +h, +mi).getTime();
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}`, allDay: false, ts };
}

/** Read an .ics document into a flat list of events. */
export function parseIcs(raw) {
  if (!raw || typeof raw !== "string") return [];
  // RFC 5545 line folding: a continuation line starts with a space or tab.
  const unfolded = raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const events = [];
  let cur = null;

  unfolded.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") { cur = {}; return; }
    if (trimmed === "END:VEVENT") {
      if (cur && (cur.summary || cur.start)) events.push(cur);
      cur = null;
      return;
    }
    if (!cur) return;
    const split = trimmed.indexOf(":");
    if (split < 0) return;
    const keyPart = trimmed.slice(0, split);
    const value = trimmed.slice(split + 1);
    const key = keyPart.split(";")[0].toUpperCase();
    const params = keyPart.slice(key.length);

    if (key === "SUMMARY") cur.summary = unescapeText(value);
    else if (key === "DESCRIPTION") cur.description = unescapeText(value);
    else if (key === "LOCATION") cur.location = unescapeText(value);
    else if (key === "DTSTART") cur.start = parseStamp(value, params);
    else if (key === "DTEND") cur.end = parseStamp(value, params);
  });

  return events.sort((a, b) => (a.start?.ts ?? Infinity) - (b.start?.ts ?? Infinity));
}

export function formatEventDay(event) {
  const ts = event?.start?.ts;
  if (ts == null) return "Unscheduled";
  const d = new Date(ts);
  return `${DAY_NAMES[d.getDay()]} ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function formatEventTime(event) {
  if (!event?.start) return "";
  if (event.start.allDay) return "all day";
  const start = new Date(event.start.ts);
  const hh = String(start.getHours()).padStart(2, "0");
  const mm = String(start.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Flatten parsed events into the plain lines the agent reads. */
export function icsToLines(events) {
  return events
    .map((e) => {
      const when = e.start?.allDay
        ? `${formatEventDay(e)} · all day`
        : `${formatEventDay(e)} ${formatEventTime(e)}`;
      const bits = [when, e.summary || "Untitled"];
      if (e.location) bits.push(`@ ${e.location}`);
      if (e.description) bits.push(`— ${e.description}`);
      return bits.join(" · ");
    })
    .join("\n");
}