import { base44 } from "@/api/base44Client";
import { zoneLabel } from "@/lib/nudge/localTime";

// The booking agent only ever sees what the person typed or dropped, and only at
// the moment they press Book. A dropped screenshot is uploaded at that moment and
// nowhere else. Nothing it returns is stored anywhere but this browser.

const SCHEMA = {
  type: "object",
  properties: {
    note: {
      type: "string",
      description: "One short line back to the person: what was booked, or what is missing. Max 90 characters.",
    },
    appointments: {
      type: "array",
      description: "Every appointment that is ready to book, ordered by when it happens. Empty when none can be.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "What it is, e.g. 'Haircut with Dana'. Max 48 characters." },
          date: { type: "string", description: "The day it falls on, as YYYY-MM-DD in local time." },
          time: { type: "string", description: "Start time as 24-hour HH:MM in local time." },
          minutes: { type: "number", description: "How long it lasts, in minutes. 60 when nothing says." },
          where: { type: "string", description: "The place, or an address, or an empty string." },
          who: { type: "string", description: "Who it is with, or an empty string." },
          notes: { type: "string", description: "One short note of anything to remember, or an empty string." },
        },
        required: ["title", "date", "time", "minutes", "where", "who", "notes"],
      },
    },
  },
  required: ["note", "appointments"],
};

function clip(value, max) {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
const isTime = (s) => /^\d{2}:\d{2}$/.test(String(s || ""));

function normalise(raw) {
  const list = Array.isArray(raw?.appointments) ? raw.appointments : [];
  const appointments = list
    .map((a) => ({
      title: clip(a?.title, 48),
      date: isDay(a?.date) ? a.date : "",
      time: isTime(a?.time) ? a.time : "",
      minutes: Math.min(600, Math.max(5, Math.round(Number(a?.minutes) || 60))),
      where: clip(a?.where, 60),
      who: clip(a?.who, 40),
      notes: clip(a?.notes, 160),
    }))
    // A booking without a real day and time is not a booking.
    .filter((a) => a.title && a.date && a.time)
    .slice(0, 8);

  return { note: clip(raw?.note || "", 90), appointments };
}

/**
 * Turns what a person said or dropped into real appointments: either something
 * they want to book, or appointments they already have and want to bring in.
 */
export async function planBookings({ text, imageUrl }) {
  const now = new Date();
  const nowString = now.toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const body = String(text || "").trim();
  const fromImage = Boolean(imageUrl);
  const zone = zoneLabel();

  const prompt = `You are the booking agent inside a phone that keeps everything on the device.

RIGHT NOW IT IS: ${nowString}${zone ? ` — ${zone}` : ""}

WHAT THE PERSON GAVE YOU${fromImage ? " — the appointments are in the attached image: read what it actually shows, and never guess at a value you cannot read." : ""}
---
${body || "(nothing typed — the appointments are the attached image)"}
---

Two things arrive here and both are handled the same way:
· a request to book something — "haircut with Dana next Tuesday at 3, about 45 minutes", "dentist in two weeks at 9am" — work the real day and time out from the local date and time above;
· appointments that already exist — a list, a roster, a confirmation, a screenshot — take them exactly as they are written.

Rules:
- Resolve every relative day ("tomorrow", "this Friday", "in two weeks") against the local date above, and give the result as YYYY-MM-DD.
- Give the start as 24-hour HH:MM in the local time above. For a range like "3-4pm", use the start and work out the minutes from the range.
- "minutes" is how long it lasts: 60 when nothing says, 30 for a call or a quick check-in.
- "where" is the place when one is given, otherwise an empty string. "who" is who it is with, otherwise an empty string.
- Never invent an appointment, a person, a place or a time that is not in what they gave you. If they want to book something but gave no day or no time, leave it OUT of "appointments" and say plainly in "note" what is missing, so they can add it.
- When nothing at all can be booked, return an empty "appointments" array and say why in "note".
- "note" is at most 90 characters: what you booked, or what is missing. Plain and factual — no greetings, no encouragement, no emoji.
- "title" is at most 48 characters, and reads like a calendar entry, not a sentence.

Return JSON only.`;

  if (!body && !fromImage) return { note: "", appointments: [] };

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: SCHEMA,
    ...(fromImage ? { file_urls: [imageUrl], model: "gemini_3_flash" } : {}),
  });

  return normalise(result);
}